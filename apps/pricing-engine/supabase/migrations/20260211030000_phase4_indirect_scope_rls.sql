-- =====================================================
-- Migration: Phase 4 - Indirect Org Scope via join_path
-- Date: 2026-02-11
-- Description:
--   Regenerate RLS policies for 14 tables that reach their org
--   through a FK join chain (e.g. deal_comments -> deals -> org).
--   Uses the join_path column in organization_policies_column_filters
--   to generate EXISTS subqueries for org_records/org_and_user scopes.
--
--   Also adds missing indexes for FK performance.
--
-- Tables affected:
--   Via deals: deal_borrower, deal_entity, deal_entity_owners,
--     deal_guarantors, deal_inputs, deal_property, deal_roles,
--     deal_comments, appraisal
--   Via loans: application_signings, pricing_activity_log, term_sheets
--   Via credit_reports: credit_report_user_chats, credit_report_viewers
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add missing indexes for FK join performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_deal_entity_deal_id
  ON public.deal_entity (deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_entity_owners_deal_id
  ON public.deal_entity_owners (deal_id);

-- =====================================================
-- STEP 2: Regenerate RLS for tables with join_path
-- =====================================================
DO $$
DECLARE
  target record;
  v_action text;
  v_policy_name text;
  v_using_clause text;
  v_user_expr text;
  v_fk_column text;
  v_parent_table text;
  v_parent_org_col text;
  v_org_exists_expr text;
BEGIN
  FOR target IN
    SELECT cf.table_name, cf.schema_name, cf.org_column, cf.user_column,
           cf.user_column_type, cf.join_path,
           c_fk.data_type AS fk_data_type,
           c_parent.data_type AS parent_id_type
    FROM public.organization_policies_column_filters cf
    LEFT JOIN information_schema.columns c_fk
      ON c_fk.table_schema = 'public'
      AND c_fk.table_name = cf.table_name
      AND c_fk.column_name = split_part(cf.join_path, '->', 1)
    LEFT JOIN information_schema.columns c_parent
      ON c_parent.table_schema = 'public'
      AND c_parent.table_name = split_part(cf.join_path, '->', 2)
      AND c_parent.column_name = 'id'
    WHERE cf.join_path IS NOT NULL
      AND cf.is_excluded = false
    ORDER BY cf.table_name
  LOOP
    -- Skip tables that don't exist yet (may be created by later migrations)
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = target.schema_name AND tablename = target.table_name
    ) THEN
      RAISE NOTICE 'Skipping non-existent table: %.%', target.schema_name, target.table_name;
      CONTINUE;
    END IF;

    -- Parse join_path: "fk_column->parent_table->parent_org_column"
    v_fk_column := split_part(target.join_path, '->', 1);
    v_parent_table := split_part(target.join_path, '->', 2);
    v_parent_org_col := split_part(target.join_path, '->', 3);

    -- Skip if the parent table in join_path doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = v_parent_table
    ) THEN
      RAISE NOTICE 'Skipping %: parent table % does not exist', target.table_name, v_parent_table;
      CONTINUE;
    END IF;

    -- Build the EXISTS subquery for org scope (with type cast if needed)
    IF target.fk_data_type <> target.parent_id_type THEN
      -- Type mismatch: cast FK column to parent type
      v_org_exists_expr := format(
        'EXISTS (SELECT 1 FROM public.%I WHERE %I.id = %I.%I::%s AND %I.%I = public.get_active_org_id())',
        v_parent_table,
        v_parent_table,
        target.table_name,
        v_fk_column,
        target.parent_id_type,
        v_parent_table,
        v_parent_org_col
      );
    ELSE
      v_org_exists_expr := format(
        'EXISTS (SELECT 1 FROM public.%I WHERE %I.id = %I.%I AND %I.%I = public.get_active_org_id())',
        v_parent_table,
        v_parent_table,
        target.table_name,
        v_fk_column,
        v_parent_table,
        v_parent_org_col
      );
    END IF;

    -- Build user expression
    IF target.user_column IS NOT NULL THEN
      IF target.user_column_type = 'pk' THEN
        v_user_expr := format(
          '%I = (SELECT id FROM public.users WHERE clerk_user_id = (auth.jwt() ->> ''sub'') LIMIT 1)',
          target.user_column
        );
      ELSE
        v_user_expr := format('%I = (auth.jwt() ->> ''sub'')', target.user_column);
      END IF;
    ELSE
      v_user_expr := NULL;
    END IF;

    -- Drop existing policies
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update', 'delete']
    LOOP
      v_policy_name := 'org_policy_' || v_action;
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', v_policy_name, target.schema_name, target.table_name);
    END LOOP;

    -- Generate new policies for each action
    FOREACH v_action IN ARRAY ARRAY['select', 'insert', 'update', 'delete']
    LOOP
      v_policy_name := 'org_policy_' || v_action;

      IF target.user_column IS NOT NULL THEN
        -- Has user column + indirect org: full scope support
        v_using_clause := format(
          '(public.check_org_access(''table'', %L, %L)).allowed AND '
          || 'CASE (public.check_org_access(''table'', %L, %L)).scope '
          || 'WHEN ''all'' THEN true '
          || 'WHEN ''org_records'' THEN %s '
          || 'WHEN ''user_records'' THEN %s '
          || 'WHEN ''org_and_user'' THEN %s OR %s '
          || 'ELSE false END',
          target.table_name, v_action,
          target.table_name, v_action,
          v_org_exists_expr,
          v_user_expr,
          v_org_exists_expr, v_user_expr
        );
      ELSE
        -- No user column, indirect org only
        v_using_clause := format(
          '(public.check_org_access(''table'', %L, %L)).allowed AND '
          || 'CASE (public.check_org_access(''table'', %L, %L)).scope '
          || 'WHEN ''all'' THEN true '
          || 'WHEN ''org_records'' THEN %s '
          || 'WHEN ''user_records'' THEN %s '
          || 'WHEN ''org_and_user'' THEN %s '
          || 'ELSE false END',
          target.table_name, v_action,
          target.table_name, v_action,
          v_org_exists_expr,
          v_org_exists_expr,  -- user_records degrades to org_records
          v_org_exists_expr
        );
      END IF;

      IF v_action = 'select' OR v_action = 'delete' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR %s TO authenticated USING (%s)',
          v_policy_name, target.schema_name, target.table_name,
          upper(v_action), v_using_clause
        );
      ELSIF v_action = 'insert' THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (%s)',
          v_policy_name, target.schema_name, target.table_name,
          v_using_clause
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
          v_policy_name, target.schema_name, target.table_name,
          v_using_clause, v_using_clause
        );
      END IF;
    END LOOP;

    RAISE NOTICE 'Generated indirect-scope policies for: % (via %)', target.table_name, target.join_path;
  END LOOP;
END $$;

COMMIT;

-- =====================================================
-- Summary:
--   14 tables now have indirect org scope via EXISTS subqueries.
--   Tables with user_column get full 4-way scope (org via join, user direct).
--   Tables without user_column degrade user_records to org scope.
--   Added 2 missing indexes for deal_entity and deal_entity_owners.
-- =====================================================
