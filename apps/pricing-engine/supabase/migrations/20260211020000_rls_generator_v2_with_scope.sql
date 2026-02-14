-- =====================================================
-- Migration: RLS Generator v2 with Row-Level Scope
-- Date: 2026-02-11
-- Description:
--   Phase 2 of Row-Level Policy Scoping
--   1. Capture before-state of all org_policy_* RLS policies
--   2. Drop all existing org_policy_* policies on non-excluded tables
--   3. Regenerate scope-aware policies using check_org_access()
--      and organization_policies_column_filters registry
--   4. Capture after-state and produce diff report
--
-- Table categories handled:
--   - Both org+user columns (13 tables): full 4-way scope CASE
--   - Org column only (13 tables): user_records degrades to org_records
--   - User column only (17 tables): org_records degrades to true
--   - Neither column (29 tables): all scopes resolve to true
--   - pk user_column_type: subquery for bigint FK resolution
--
-- Storage policies on storage.objects are NOT modified.
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Capture before-state for diff
-- =====================================================
CREATE TEMP TABLE IF NOT EXISTS rls_before AS
  SELECT schemaname, tablename, policyname, cmd,
         substring(qual from 1 for 200) AS qual_preview
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'org_policy_%'
  ORDER BY tablename, policyname;

-- =====================================================
-- STEP 2: Drop existing + regenerate scope-aware policies
-- =====================================================
DO $$
DECLARE
  target record;
  v_action text;
  v_policy_name text;
  v_using_clause text;
  v_with_check text;
  v_scope_case text;
  v_user_expr text;
BEGIN
  -- Loop through all non-excluded tables in the column_filters registry
  FOR target IN
    SELECT cf.table_name, cf.schema_name, cf.org_column, cf.user_column, cf.user_column_type
    FROM public.organization_policies_column_filters cf
    WHERE cf.is_excluded = false
    ORDER BY cf.table_name
  LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target.schema_name, target.table_name);

    -- Drop existing org_policy_* policies
    FOR v_action IN SELECT unnest(ARRAY['select', 'insert', 'update', 'delete'])
    LOOP
      v_policy_name := 'org_policy_' || v_action;
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', v_policy_name, target.schema_name, target.table_name);
    END LOOP;

    -- Build the user expression based on column type
    IF target.user_column IS NOT NULL THEN
      IF target.user_column_type = 'pk' THEN
        -- Bigint FK to users.id: resolve via subquery
        v_user_expr := format(
          '%I = (SELECT id FROM public.users WHERE clerk_user_id = (auth.jwt() ->> ''sub'') LIMIT 1)',
          target.user_column
        );
      ELSE
        -- Text clerk_user_id: direct comparison
        v_user_expr := format('%I = (auth.jwt() ->> ''sub'')', target.user_column);
      END IF;
    END IF;

    -- Build the scope CASE expression based on available columns
    IF target.org_column IS NOT NULL AND target.user_column IS NOT NULL THEN
      -- BOTH columns: full 4-way scope
      v_scope_case := format(
        'CASE (public.check_org_access(''table'', %L, %s)).scope ' ||
        'WHEN ''all'' THEN true ' ||
        'WHEN ''org_records'' THEN %I = public.get_active_org_id() ' ||
        'WHEN ''user_records'' THEN %s ' ||
        'WHEN ''org_and_user'' THEN %I = public.get_active_org_id() OR %s ' ||
        'ELSE false END',
        target.table_name, '%1$L',  -- placeholder for action
        target.org_column,
        v_user_expr,
        target.org_column, v_user_expr
      );
    ELSIF target.org_column IS NOT NULL THEN
      -- ORG only: user_records degrades to org_records
      v_scope_case := format(
        'CASE (public.check_org_access(''table'', %L, %s)).scope ' ||
        'WHEN ''all'' THEN true ' ||
        'WHEN ''org_records'' THEN %I = public.get_active_org_id() ' ||
        'WHEN ''user_records'' THEN %I = public.get_active_org_id() ' ||
        'WHEN ''org_and_user'' THEN %I = public.get_active_org_id() ' ||
        'ELSE false END',
        target.table_name, '%1$L',
        target.org_column, target.org_column, target.org_column
      );
    ELSIF target.user_column IS NOT NULL THEN
      -- USER only: org_records degrades to true (action gate only)
      v_scope_case := format(
        'CASE (public.check_org_access(''table'', %L, %s)).scope ' ||
        'WHEN ''all'' THEN true ' ||
        'WHEN ''org_records'' THEN true ' ||
        'WHEN ''user_records'' THEN %s ' ||
        'WHEN ''org_and_user'' THEN %s ' ||
        'ELSE false END',
        target.table_name, '%1$L',
        v_user_expr, v_user_expr
      );
    ELSE
      -- NEITHER: all scopes resolve to true (action gate is sole control)
      v_scope_case := NULL;
    END IF;

    -- Generate policies for each action
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update', 'delete']
    LOOP
      v_policy_name := 'org_policy_' || v_action;

      IF v_scope_case IS NOT NULL THEN
        -- Build full USING clause with scope
        v_using_clause := format(
          '(public.check_org_access(''table'', %L, %L)).allowed AND %s',
          target.table_name,
          v_action,
          format(v_scope_case, v_action)
        );
      ELSE
        -- No scope columns: action gate only
        v_using_clause := format(
          '(public.check_org_access(''table'', %L, %L)).allowed',
          target.table_name,
          v_action
        );
      END IF;

      IF v_action = 'select' OR v_action = 'delete' THEN
        -- SELECT and DELETE only use USING
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR %s TO authenticated USING (%s)',
          v_policy_name,
          target.schema_name,
          target.table_name,
          upper(v_action),
          v_using_clause
        );
      ELSIF v_action = 'insert' THEN
        -- INSERT only uses WITH CHECK
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (%s)',
          v_policy_name,
          target.schema_name,
          target.table_name,
          v_using_clause
        );
      ELSE
        -- UPDATE uses both USING and WITH CHECK
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
          v_policy_name,
          target.schema_name,
          target.table_name,
          v_using_clause,
          v_using_clause
        );
      END IF;
    END LOOP;

    RAISE NOTICE 'Generated scope-aware policies for: %', target.table_name;
  END LOOP;
END $$;

-- =====================================================
-- STEP 3: Capture after-state and produce diff
-- =====================================================
CREATE TEMP TABLE IF NOT EXISTS rls_after AS
  SELECT schemaname, tablename, policyname, cmd,
         substring(qual from 1 for 200) AS qual_preview
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'org_policy_%'
  ORDER BY tablename, policyname;

-- Report: tables with changed policies
DO $$
DECLARE
  v_before_count int;
  v_after_count int;
  v_modified_count int;
BEGIN
  SELECT count(*) INTO v_before_count FROM rls_before;
  SELECT count(*) INTO v_after_count FROM rls_after;

  SELECT count(*) INTO v_modified_count
  FROM rls_after a
  JOIN rls_before b ON a.tablename = b.tablename AND a.policyname = b.policyname
  WHERE a.qual_preview <> b.qual_preview;

  RAISE NOTICE '=== RLS Generator v2 Diff Report ===';
  RAISE NOTICE 'Before: % policies', v_before_count;
  RAISE NOTICE 'After: % policies', v_after_count;
  RAISE NOTICE 'Modified: % policies (USING clause changed)', v_modified_count;
  RAISE NOTICE 'All policies now use check_org_access() with scope-aware WHERE clauses';
END $$;

-- Cleanup temp tables
DROP TABLE IF EXISTS rls_before;
DROP TABLE IF EXISTS rls_after;

COMMIT;

-- =====================================================
-- Summary:
--   Replaced all org_policy_* RLS policies on non-excluded tables
--   with scope-aware versions that use check_org_access() and
--   the organization_policies_column_filters registry.
--
--   Tables with both columns get full 4-way scope CASE.
--   Tables with org-only get graceful degradation.
--   Tables with user-only get action gate for org scope.
--   Tables with neither get pure action gate.
--   Storage policies are unchanged.
-- =====================================================
