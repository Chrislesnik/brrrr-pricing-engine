-- ============================================================
-- Migration: Add named scope arm to deal-related RLS policies
-- Date: 2026-02-18
--
-- Every org_policy_{select,insert,update} on deal-related tables
-- currently ends with ELSE false. This migration changes that ELSE
-- arm to call check_named_scope_from_scope_string(), a dispatcher
-- that handles ANY 'named:...' scope string.
--
-- After this migration, adding a new named scope requires ONLY:
--   1. A WHEN branch in check_named_scope() (Option B dispatcher)
--   2. A row in organization_policy_named_scope_tables
--   3. Zero RLS policy changes
--
-- Loan_scenarios is removed from the named_scope_tables registry
-- because it has no deal_id FK (uses organization_id directly).
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: check_named_scope_from_scope_string helper
-- Dispatches any 'named:<x>' scope string to check_named_scope(x, anchor).
-- Returns false for all non-named scopes (all/org_records/user_records/etc.)
-- so the RLS ELSE arm is safe and explicit.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_named_scope_from_scope_string(
  p_scope     text,
  p_anchor_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_scope LIKE 'named:%'
      THEN public.check_named_scope(substring(p_scope from 7), p_anchor_id)
    ELSE false
  END;
$$;

COMMENT ON FUNCTION public.check_named_scope_from_scope_string IS
  'Dispatches any ''named:<scope>'' string to check_named_scope(name, anchor_id).
   Used in the ELSE arm of RLS policy CASE blocks so that any named scope
   registered in check_named_scope() is automatically enforced at the DB level
   without further RLS policy changes.';

-- ============================================================
-- PART 2: Clean up misregistered tables
-- loan_scenarios has no deal_id FK — remove from registry
-- ============================================================

DELETE FROM public.organization_policy_named_scope_tables
WHERE scope_name = 'deal_participant'
  AND table_name IN ('loan_scenarios', 'applications', 'deal_signature_requests');

UPDATE public.organization_policies_column_filters
SET named_scopes = array_remove(named_scopes, 'deal_participant')
WHERE table_name IN ('loan_scenarios', 'applications', 'deal_signature_requests');

-- ============================================================
-- PART 3: Update deal-related RLS policies
--
-- For each table registered in organization_policy_named_scope_tables
-- for 'deal_participant', we replace ELSE false with ELSE <helper()>
-- in org_policy_select, org_policy_insert (WITH CHECK), and org_policy_update.
--
-- The dynamic SQL approach reads the existing policy definition from
-- pg_policies, replaces the ELSE arm, then drops and recreates the policy.
-- This preserves all existing WHEN arms exactly as the DB decompiled them.
-- ============================================================

DO $$
DECLARE
  r          RECORD;
  v_anchor   text;
  v_old_sql  text;
  v_new_sql  text;
  v_else_fn  text;
  v_action   text;
BEGIN

  FOR r IN
    SELECT
      nst.table_name,
      nst.fk_column,
      -- deal_comments.deal_id is text — needs ::uuid cast
      CASE WHEN nst.table_name = 'deal_comments'
           THEN format('(%I.%I)::uuid', nst.table_name, nst.fk_column)
           ELSE format('%I.%I', nst.table_name, nst.fk_column)
      END AS anchor_expr
    FROM public.organization_policy_named_scope_tables nst
    WHERE nst.scope_name = 'deal_participant'
    ORDER BY nst.table_name
  LOOP
    -- ── SELECT and UPDATE: modify the USING clause ───────────
    FOREACH v_action IN ARRAY ARRAY['select','update'] LOOP

      SELECT qual INTO v_old_sql
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename  = r.table_name
        AND policyname = format('org_policy_%s', v_action);

      CONTINUE WHEN v_old_sql IS NULL;

      v_else_fn := format(
        'check_named_scope_from_scope_string('
          '(check_org_access(''table'', %L, %L)).scope, '
          '%s)',
        r.table_name, v_action, r.anchor_expr
      );

      -- Replace the single 'ELSE false' in the CASE block
      v_new_sql := replace(v_old_sql, 'ELSE false', format('ELSE %s', v_else_fn));

      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        format('org_policy_%s', v_action), r.table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s USING (%s)',
        format('org_policy_%s', v_action),
        r.table_name,
        upper(v_action),
        v_new_sql
      );

      RAISE NOTICE 'Updated org_policy_% USING on %', v_action, r.table_name;
    END LOOP;

    -- ── INSERT: modify the WITH CHECK clause ─────────────────
    -- Note: deals INSERT intentionally keeps ELSE false because a new deal
    -- row does not yet exist in user_deal_access at insert time; brokers
    -- should not be creating new deals.
    CONTINUE WHEN r.table_name = 'deals';

    SELECT with_check INTO v_old_sql
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = r.table_name
      AND policyname = 'org_policy_insert';

    CONTINUE WHEN v_old_sql IS NULL;

    v_else_fn := format(
      'check_named_scope_from_scope_string('
        '(check_org_access(''table'', %L, ''insert'')).scope, '
        '%s)',
      r.table_name, r.anchor_expr
    );

    v_new_sql := replace(v_old_sql, 'ELSE false', format('ELSE %s', v_else_fn));

    EXECUTE format(
      'DROP POLICY IF EXISTS org_policy_insert ON public.%I',
      r.table_name
    );
    EXECUTE format(
      'CREATE POLICY org_policy_insert ON public.%I FOR INSERT WITH CHECK (%s)',
      r.table_name,
      v_new_sql
    );

    RAISE NOTICE 'Updated org_policy_insert WITH CHECK on %', r.table_name;
  END LOOP;

END $$;

COMMIT;

-- ============================================================
-- Summary:
--
-- check_named_scope_from_scope_string(scope, anchor) — new helper.
--   Called from ELSE arm of RLS CASE blocks. Dispatches any
--   'named:<x>' scope to check_named_scope(x, anchor); returns false
--   for all standard scopes so existing behavior is unchanged.
--
-- For each registered deal_participant table (except deals INSERT):
--   org_policy_select  — USING updated; ELSE now calls helper
--   org_policy_update  — USING updated; ELSE now calls helper
--   org_policy_insert  — WITH CHECK updated; ELSE calls helper
--                        (deals INSERT excluded: new deal ≠ existing participant)
--
-- org_policy_delete policies NOT modified — Tier 4 grants no DELETE,
--   so ELSE false is the correct and desired behaviour.
--
-- loan_scenarios, applications, deal_signature_requests removed from
--   named_scope_tables (no deal_id FK confirmed by schema inspection).
-- ============================================================
