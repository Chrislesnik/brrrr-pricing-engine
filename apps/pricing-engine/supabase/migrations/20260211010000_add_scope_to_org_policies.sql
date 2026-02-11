-- =====================================================
-- Migration: Add scope column + column_filters registry + check_org_access()
-- Date: 2026-02-11
-- Description:
--   Phase 1 of Row-Level Policy Scoping
--   1. Add scope column to organization_policies
--   2. Create organization_policies_column_filters registry
--   3. Seed column filters for all 72 public tables
--   4. Create org_access_result composite type
--   5. Create check_org_access() combined function
--   6. Wrap can_access_org_resource() as thin boolean wrapper
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add scope column
-- =====================================================
ALTER TABLE public.organization_policies
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'all';

-- Add CHECK constraint (use DO block to avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_policies_scope_check'
  ) THEN
    ALTER TABLE public.organization_policies
      ADD CONSTRAINT organization_policies_scope_check
      CHECK (scope IN ('all', 'org_records', 'user_records', 'org_and_user'));
  END IF;
END $$;

-- Backfill: all existing policies get 'all' (preserves current behavior)
UPDATE public.organization_policies SET scope = 'all' WHERE scope IS NULL;

-- =====================================================
-- STEP 2: Create organization_policies_column_filters
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_policies_column_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  schema_name text NOT NULL DEFAULT 'public',
  org_column text,
  user_column text,
  user_column_type text NOT NULL DEFAULT 'clerk_id'
    CHECK (user_column_type IN ('clerk_id', 'pk')),
  join_path text,
  is_excluded boolean NOT NULL DEFAULT false,
  notes text
);

-- RLS: service role + authenticated read
ALTER TABLE public.organization_policies_column_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "column_filters_service_role" ON public.organization_policies_column_filters;
CREATE POLICY "column_filters_service_role"
  ON public.organization_policies_column_filters FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "column_filters_read" ON public.organization_policies_column_filters;
CREATE POLICY "column_filters_read"
  ON public.organization_policies_column_filters FOR SELECT TO authenticated USING (true);

-- =====================================================
-- STEP 3: Seed column filters for all public tables
-- NOTE: Any future migration creating a new public table
-- MUST also INSERT into organization_policies_column_filters.
-- =====================================================
INSERT INTO public.organization_policies_column_filters
  (table_name, org_column, user_column, user_column_type, join_path, is_excluded, notes)
VALUES
  -- Excluded system tables
  ('organizations', NULL, NULL, 'clerk_id', NULL, true, 'System table - has its own RLS'),
  ('organization_members', NULL, NULL, 'clerk_id', NULL, true, 'System table - has its own RLS'),
  ('users', NULL, NULL, 'clerk_id', NULL, true, 'System table - has its own RLS'),
  ('organization_member_roles', NULL, NULL, 'clerk_id', NULL, true, 'System table'),
  ('organization_policies', NULL, NULL, 'clerk_id', NULL, true, 'System table - has its own RLS'),
  ('organization_policies_column_filters', NULL, NULL, 'clerk_id', NULL, true, 'System table'),

  -- Tables with BOTH org + user columns (13)
  ('ai_chat_messages', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('ai_chats', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('credit_report_chat_messages', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('credit_report_chats', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('deals', 'organization_id', 'primary_user_id', 'clerk_id', NULL, false, 'Also has assigned_to_user_id'),
  ('loans', 'organization_id', 'primary_user_id', 'clerk_id', NULL, false, 'Legacy name for deals; also has assigned_to_user_id'),
  ('integrations', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('loan_scenarios', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('brokers', 'organization_id', 'clerk_user_id', 'clerk_id', NULL, false, NULL),
  ('term_sheet_templates', 'organization_id', 'user_id', 'clerk_id', NULL, false, NULL),
  ('deal_signature_requests', 'organization_id', 'created_by_user_id', 'pk', NULL, false, NULL),
  ('document_access_permissions', 'clerk_org_id', 'updated_by_clerk_sub', 'clerk_id', NULL, false, 'Uses clerk_org_id not organization_id'),
  ('document_files_clerk_orgs', 'clerk_org_id', 'created_by', 'clerk_id', NULL, false, NULL),

  -- Tables with ORG column only (13)
  ('applications', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('borrower_entities', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('borrowers', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('credit_reports', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('custom_broker_settings', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('default_broker_settings', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('document_templates', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('entities', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('entity_owners', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('organization_themes', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('input_categories', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('inputs', 'organization_id', NULL, 'clerk_id', NULL, false, NULL),
  ('deal_clerk_orgs', 'clerk_org_id', NULL, 'clerk_id', NULL, false, 'Uses clerk_org_id'),

  -- Tables with USER column only (17)
  ('credit_report_data_xactus', NULL, 'uploaded_by', 'clerk_id', NULL, false, NULL),
  ('credit_report_user_chats', NULL, 'user_id', 'clerk_id', 'report_id->credit_reports->organization_id', false, 'Indirect org via credit_reports'),
  ('credit_report_viewers', NULL, 'user_id', 'clerk_id', 'report_id->credit_reports->organization_id', false, 'Indirect org via credit_reports; also has added_by'),
  ('deal_comment_mentions', NULL, 'mentioned_user_id', 'clerk_id', NULL, false, 'Indirect org via deal->deals'),
  ('deal_comment_reads', NULL, 'clerk_user_id', 'clerk_id', NULL, false, 'Indirect org via deal->deals'),
  ('deal_comments', NULL, 'author_clerk_user_id', 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_roles', NULL, 'users_id', 'pk', 'deal_id->deals->organization_id', false, 'Bigint FK to users.id; indirect org via deals'),
  ('document_categories_user_order', NULL, 'clerk_user_id', 'clerk_id', NULL, false, NULL),
  ('document_files', NULL, 'uploaded_by', 'clerk_id', NULL, false, NULL),
  ('document_files_borrowers', NULL, 'created_by', 'clerk_id', NULL, false, NULL),
  ('document_files_clerk_users', NULL, 'clerk_user_id', 'clerk_id', NULL, false, 'Also has created_by'),
  ('document_files_entities', NULL, 'created_by', 'clerk_id', NULL, false, NULL),
  ('document_files_tags', NULL, 'created_by', 'clerk_id', NULL, false, NULL),
  ('document_tags', NULL, 'created_by', 'clerk_id', NULL, false, NULL),
  ('notifications', NULL, 'user_id', 'clerk_id', NULL, false, NULL),
  ('pricing_activity_log', NULL, 'user_id', 'clerk_id', 'loan_id->loans->organization_id', false, 'Indirect org via loans'),
  ('programs', NULL, 'user_id', 'clerk_id', NULL, false, NULL),

  -- Tables with NEITHER column (29)
  ('application_signings', NULL, NULL, 'clerk_id', 'loan_id->loans->organization_id', false, 'Indirect org via loans'),
  ('applications_emails_sent', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('appraisal', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('contact', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('deal_borrower', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_entity', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_entity_owners', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_guarantors', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_inputs', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_property', NULL, NULL, 'clerk_id', 'deal_id->deals->organization_id', false, 'Indirect org via deals'),
  ('deal_role_types', NULL, NULL, 'clerk_id', NULL, false, 'Reference table'),
  ('document_access_permissions_global', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('document_categories', NULL, NULL, 'clerk_id', NULL, false, 'Reference table'),
  ('document_roles', NULL, NULL, 'clerk_id', NULL, false, 'Reference table'),
  ('document_roles_files', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('guarantor', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('input_visibility', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('input_visibility_rules', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('integrations_clear', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('integrations_floify', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('integrations_nadlan', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('integrations_xactus', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('n8n_chat_histories', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('program_documents', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('program_documents_chunks_vs', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('property', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('rbac_permissions', NULL, NULL, 'clerk_id', NULL, false, NULL),
  ('term_sheet_template_fields', NULL, NULL, 'clerk_id', NULL, false, 'Indirect org via template->org'),
  ('term_sheets', NULL, NULL, 'clerk_id', 'loan_id->loans->organization_id', false, 'Indirect org via loans')
ON CONFLICT (table_name) DO NOTHING;

-- =====================================================
-- STEP 4: Create composite return type
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_access_result') THEN
    CREATE TYPE public.org_access_result AS (
      allowed boolean,
      scope text
    );
  END IF;
END $$;

-- =====================================================
-- STEP 5: Create check_org_access() combined function
-- Returns (allowed, scope) in a single evaluation pass
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_org_access(
  p_resource_type text,
  p_resource_name text,
  p_action text
)
RETURNS public.org_access_result
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_user_id text;
  v_org_role text;
  v_member_role text;
  v_is_internal boolean;
  v_is_internal_org boolean;
  v_policy record;
  v_rule jsonb;
  v_condition jsonb;
  v_all_match boolean;
  v_any_match boolean;
  v_field_val text;
  v_cond_match boolean;
  v_connector text;
  v_result public.org_access_result;
BEGIN
  -- Resolve user identity from JWT
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  IF v_org_id IS NULL THEN
    v_result.allowed := false;
    v_result.scope := 'none';
    RETURN v_result;
  END IF;

  -- Service role bypass
  IF auth.role() = 'service_role' THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  -- Owner override
  IF public.is_org_owner(v_org_id) THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  -- Resolve user roles (JWT fast-path with DB fallback)
  v_org_role := COALESCE(auth.jwt() ->> 'org_role', auth.jwt() ->> 'orgRole');
  v_member_role := COALESCE(auth.jwt() ->> 'org_member_role', auth.jwt() ->> 'orgMemberRole');
  v_is_internal := COALESCE(
    (auth.jwt() ->> 'is_internal')::boolean,
    (auth.jwt() ->> 'isInternal')::boolean
  );

  IF v_org_role IS NULL OR v_member_role IS NULL THEN
    SELECT m.clerk_org_role, m.clerk_member_role
    INTO v_org_role, v_member_role
    FROM public.organization_members m
    WHERE m.organization_id = v_org_id AND m.user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_is_internal IS NULL THEN
    SELECT u.is_internal_yn INTO v_is_internal
    FROM public.users u WHERE u.clerk_user_id = v_user_id LIMIT 1;
  END IF;

  -- Resolve org type
  SELECT o.is_internal_yn INTO v_is_internal_org
  FROM public.organizations o WHERE o.id = v_org_id;

  -- Normalize roles
  v_org_role := lower(replace(coalesce(v_org_role, ''), 'org:', ''));
  v_member_role := lower(replace(coalesce(v_member_role, ''), 'org:', ''));

  -- Evaluate policies: org-specific first, then global, specific resource before wildcard
  FOR v_policy IN
    SELECT op.compiled_config, op.scope AS policy_scope
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
    ORDER BY
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN op.resource_name <> '*' THEN 0 ELSE 1 END
  LOOP
    -- Check allow_internal_users bypass
    IF COALESCE((v_policy.compiled_config ->> 'allow_internal_users')::boolean, false) = true
       AND v_is_internal = true
    THEN
      v_result.allowed := true;
      v_result.scope := COALESCE(v_policy.policy_scope, 'all');
      RETURN v_result;
    END IF;

    -- Check version
    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 2) >= 3 THEN
      -- V3: Multiple rule groups with per-rule scopes
      FOR v_rule IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_policy.compiled_config -> 'rules', '[]'::jsonb)
        )
      LOOP
        v_connector := COALESCE(v_rule ->> 'connector', 'AND');
        v_all_match := true;
        v_any_match := false;

        FOR v_condition IN
          SELECT * FROM jsonb_array_elements(
            COALESCE(v_rule -> 'conditions', '[]'::jsonb)
          )
        LOOP
          CASE v_condition ->> 'field'
            WHEN 'org_role' THEN v_field_val := v_org_role;
            WHEN 'member_role' THEN v_field_val := v_member_role;
            WHEN 'org_type' THEN
              v_field_val := CASE WHEN v_is_internal_org = true THEN 'internal' ELSE 'external' END;
            WHEN 'internal_user' THEN
              v_field_val := CASE WHEN v_is_internal = true THEN 'yes' ELSE 'no' END;
            ELSE v_field_val := NULL;
          END CASE;

          CASE v_condition ->> 'operator'
            WHEN 'is' THEN
              v_cond_match := v_field_val IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val
                  WHERE val = v_field_val OR val = '*'
                );
            WHEN 'is_not' THEN
              v_cond_match := v_field_val IS NOT NULL
                AND NOT EXISTS (
                  SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val
                  WHERE val = v_field_val
                );
            ELSE v_cond_match := false;
          END CASE;

          IF v_cond_match THEN v_any_match := true;
          ELSE v_all_match := false;
          END IF;
        END LOOP;

        IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
          v_result.allowed := true;
          v_result.scope := COALESCE(v_rule ->> 'scope', v_policy.policy_scope, 'all');
          RETURN v_result;
        END IF;
      END LOOP;

    ELSE
      -- V2: Single condition set (existing behavior)
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb)
        )
      LOOP
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN v_field_val := v_org_role;
          WHEN 'member_role' THEN v_field_val := v_member_role;
          WHEN 'org_type' THEN
            v_field_val := CASE WHEN v_is_internal_org = true THEN 'internal' ELSE 'external' END;
          WHEN 'internal_user' THEN
            v_field_val := CASE WHEN v_is_internal = true THEN 'yes' ELSE 'no' END;
          ELSE v_field_val := NULL;
        END CASE;

        CASE v_condition ->> 'operator'
          WHEN 'is' THEN
            v_cond_match := v_field_val IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val
                WHERE val = v_field_val OR val = '*'
              );
          WHEN 'is_not' THEN
            v_cond_match := v_field_val IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val
                WHERE val = v_field_val
              );
          ELSE v_cond_match := false;
        END CASE;

        IF v_cond_match THEN v_any_match := true;
        ELSE v_all_match := false;
        END IF;
      END LOOP;

      IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
        v_result.allowed := true;
        v_result.scope := COALESCE(v_policy.policy_scope, 'all');
        RETURN v_result;
      END IF;
    END IF;
  END LOOP;

  -- Default: deny
  v_result.allowed := false;
  v_result.scope := 'none';
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_org_access(text, text, text) IS
'Combined access check returning (allowed, scope). Evaluates v2 and v3 policies. Used by RLS generator for both action-level and row-level enforcement.';

-- =====================================================
-- STEP 6: Wrap can_access_org_resource() as thin wrapper
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_org_resource(
  p_resource_type text,
  p_resource_name text,
  p_action text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (public.check_org_access(p_resource_type, p_resource_name, p_action)).allowed;
$$;

COMMENT ON FUNCTION public.can_access_org_resource(text, text, text) IS
'Thin boolean wrapper around check_org_access(). Returns true if the action is allowed. For row-level scope, use check_org_access() directly.';

GRANT EXECUTE ON FUNCTION public.check_org_access(text, text, text) TO authenticated;

COMMIT;

-- =====================================================
-- Summary:
--   1. Added scope column to organization_policies (default 'all')
--   2. Created organization_policies_column_filters with 72 table entries
--   3. Created org_access_result composite type
--   4. Created check_org_access() returning (allowed, scope)
--   5. Rewrote can_access_org_resource() as thin wrapper
--   6. Supports both v2 (single condition set) and v3 (multi-rule) formats
-- =====================================================
