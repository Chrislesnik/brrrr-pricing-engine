-- =====================================================
-- Migration: Security hardening
-- Date: 2026-02-25
-- Description:
--   1. Fix is_org_owner bypass: move owner check after DENY evaluation
--      so DENY policies can override even org owners.
--   2. Fix is_internal_admin: require internal org context so the
--      bypass only works when user is in an internal organization.
--   3. Seed explicit DENY policies:
--      a) DENY table:* DELETE for external orgs
--      b) DENY feature:permanent_delete DELETE for non-Tier-1
--      c) DENY feature:settings_policies * for external orgs
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Fix check_org_access — org owner respects DENY
-- =====================================================

-- The latest version of check_org_access is defined in
-- 20260224000000_add_condition_groups_to_check_org_access.sql.
-- We must patch THAT version (which already has condition_groups).
-- Rather than re-create the full 300-line function, we update
-- the version from 20260211040000 since that's the base.
-- The condition_groups migration re-creates on top.
--
-- Strategy: re-create the function with the owner check
-- moved after DENY evaluation.

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
  v_deny_matched boolean := false;
  v_group jsonb;
  v_group_connector text;
  v_group_all_match boolean;
  v_group_any_match boolean;
  v_group_condition jsonb;
  v_group_result boolean;
BEGIN
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  IF v_org_id IS NULL THEN
    v_result.allowed := false;
    v_result.scope := 'none';
    RETURN v_result;
  END IF;

  IF auth.role() = 'service_role' THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  -- NOTE: is_org_owner check is intentionally BELOW, after DENY evaluation.
  -- This allows DENY policies to restrict even org owners.

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

  SELECT o.is_internal_yn INTO v_is_internal_org
  FROM public.organizations o WHERE o.id = v_org_id;

  v_org_role := lower(replace(coalesce(v_org_role, ''), 'org:', ''));
  v_member_role := lower(replace(coalesce(v_member_role, ''), 'org:', ''));

  -- =====================================================
  -- PHASE 1: Evaluate DENY policies first
  -- =====================================================
  FOR v_policy IN
    SELECT op.compiled_config, op.scope AS policy_scope, op.effect
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
      AND op.effect = 'DENY'
    ORDER BY
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN op.resource_name <> '*' THEN 0 ELSE 1 END
  LOOP
    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 2) >= 3 THEN
      FOR v_rule IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_policy.compiled_config -> 'rules', '[]'::jsonb)
        )
      LOOP
        v_connector := COALESCE(v_rule ->> 'connector', 'AND');
        v_all_match := true;
        v_any_match := false;

        FOR v_condition IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'conditions', '[]'::jsonb))
        LOOP
          CASE v_condition ->> 'field'
            WHEN 'org_role' THEN v_field_val := v_org_role;
            WHEN 'member_role' THEN v_field_val := v_member_role;
            WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
            WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
            ELSE v_field_val := NULL;
          END CASE;

          CASE v_condition ->> 'operator'
            WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
            WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
            ELSE v_cond_match := false;
          END CASE;

          IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        FOR v_group IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'condition_groups', '[]'::jsonb))
        LOOP
          v_group_connector := COALESCE(v_group ->> 'connector', 'OR');
          v_group_all_match := true;
          v_group_any_match := false;

          FOR v_group_condition IN
            SELECT * FROM jsonb_array_elements(COALESCE(v_group -> 'conditions', '[]'::jsonb))
          LOOP
            CASE v_group_condition ->> 'field'
              WHEN 'org_role' THEN v_field_val := v_org_role;
              WHEN 'member_role' THEN v_field_val := v_member_role;
              WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
              WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
              ELSE v_field_val := NULL;
            END CASE;

            CASE v_group_condition ->> 'operator'
              WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
              WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val);
              ELSE v_cond_match := false;
            END CASE;

            IF v_cond_match THEN v_group_any_match := true; ELSE v_group_all_match := false; END IF;
          END LOOP;

          v_group_result := (v_group_connector = 'AND' AND v_group_all_match) OR (v_group_connector = 'OR' AND v_group_any_match);
          IF v_group_result THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
          v_deny_matched := true;
        END IF;
      END LOOP;
    ELSE
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb))
      LOOP
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN v_field_val := v_org_role;
          WHEN 'member_role' THEN v_field_val := v_member_role;
          WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
          WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
          ELSE v_field_val := NULL;
        END CASE;

        CASE v_condition ->> 'operator'
          WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
          WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
          ELSE v_cond_match := false;
        END CASE;

        IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
      END LOOP;

      IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
        v_deny_matched := true;
      END IF;
    END IF;

    IF v_deny_matched THEN
      v_result.allowed := false;
      v_result.scope := 'none';
      RETURN v_result;
    END IF;
  END LOOP;

  -- =====================================================
  -- Owner fallback: after DENY, before ALLOW evaluation
  -- Org owners get full access unless explicitly denied.
  -- =====================================================
  IF public.is_org_owner(v_org_id) THEN
    v_result.allowed := true;
    v_result.scope := 'all';
    RETURN v_result;
  END IF;

  -- =====================================================
  -- PHASE 2: Evaluate ALLOW policies
  -- =====================================================
  FOR v_policy IN
    SELECT op.compiled_config, op.scope AS policy_scope
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
      AND (op.effect = 'ALLOW' OR op.effect IS NULL)
    ORDER BY
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN op.resource_name <> '*' THEN 0 ELSE 1 END
  LOOP
    IF COALESCE((v_policy.compiled_config ->> 'allow_internal_users')::boolean, false) = true
       AND v_is_internal = true
    THEN
      v_result.allowed := true;
      v_result.scope := COALESCE(v_policy.policy_scope, 'all');
      RETURN v_result;
    END IF;

    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 2) >= 3 THEN
      FOR v_rule IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'rules', '[]'::jsonb))
      LOOP
        v_connector := COALESCE(v_rule ->> 'connector', 'AND');
        v_all_match := true;
        v_any_match := false;

        FOR v_condition IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'conditions', '[]'::jsonb))
        LOOP
          CASE v_condition ->> 'field'
            WHEN 'org_role' THEN v_field_val := v_org_role;
            WHEN 'member_role' THEN v_field_val := v_member_role;
            WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
            WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
            ELSE v_field_val := NULL;
          END CASE;

          CASE v_condition ->> 'operator'
            WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
            WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
            ELSE v_cond_match := false;
          END CASE;

          IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        FOR v_group IN
          SELECT * FROM jsonb_array_elements(COALESCE(v_rule -> 'condition_groups', '[]'::jsonb))
        LOOP
          v_group_connector := COALESCE(v_group ->> 'connector', 'OR');
          v_group_all_match := true;
          v_group_any_match := false;

          FOR v_group_condition IN
            SELECT * FROM jsonb_array_elements(COALESCE(v_group -> 'conditions', '[]'::jsonb))
          LOOP
            CASE v_group_condition ->> 'field'
              WHEN 'org_role' THEN v_field_val := v_org_role;
              WHEN 'member_role' THEN v_field_val := v_member_role;
              WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
              WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
              ELSE v_field_val := NULL;
            END CASE;

            CASE v_group_condition ->> 'operator'
              WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
              WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_group_condition -> 'values') AS val WHERE val = v_field_val);
              ELSE v_cond_match := false;
            END CASE;

            IF v_cond_match THEN v_group_any_match := true; ELSE v_group_all_match := false; END IF;
          END LOOP;

          v_group_result := (v_group_connector = 'AND' AND v_group_all_match) OR (v_group_connector = 'OR' AND v_group_any_match);
          IF v_group_result THEN v_any_match := true; ELSE v_all_match := false; END IF;
        END LOOP;

        IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
          v_result.allowed := true;
          v_result.scope := COALESCE(v_rule ->> 'scope', v_policy.policy_scope, 'all');
          RETURN v_result;
        END IF;
      END LOOP;
    ELSE
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb))
      LOOP
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN v_field_val := v_org_role;
          WHEN 'member_role' THEN v_field_val := v_member_role;
          WHEN 'org_type' THEN v_field_val := CASE WHEN v_is_internal_org THEN 'internal' ELSE 'external' END;
          WHEN 'internal_user' THEN v_field_val := CASE WHEN v_is_internal THEN 'yes' ELSE 'no' END;
          ELSE v_field_val := NULL;
        END CASE;

        CASE v_condition ->> 'operator'
          WHEN 'is' THEN v_cond_match := v_field_val IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val OR val = '*');
          WHEN 'is_not' THEN v_cond_match := v_field_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_condition -> 'values') AS val WHERE val = v_field_val);
          ELSE v_cond_match := false;
        END CASE;

        IF v_cond_match THEN v_any_match := true; ELSE v_all_match := false; END IF;
      END LOOP;

      IF (v_connector = 'AND' AND v_all_match) OR (v_connector = 'OR' AND v_any_match) THEN
        v_result.allowed := true;
        v_result.scope := COALESCE(v_policy.policy_scope, 'all');
        RETURN v_result;
      END IF;
    END IF;
  END LOOP;

  v_result.allowed := false;
  v_result.scope := 'none';
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.check_org_access(text, text, text) IS
'Combined access check with DENY support. DENY evaluated first (deny wins, even for org owners). Then org owner fallback. Then ALLOW evaluation. Service role bypasses all. Returns (allowed, scope).';

-- =====================================================
-- PART 2: Fix is_internal_admin — require internal org context
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_internal_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.organization_members m
      ON m.user_id = u.clerk_user_id
    JOIN public.organizations o
      ON o.id = m.organization_id
    WHERE u.clerk_user_id = (auth.jwt() ->> 'sub')
      AND u.is_internal_yn = true
      AND o.is_internal_yn = true
      AND m.organization_id = public.get_active_org_id()
  );
$$;

COMMENT ON FUNCTION public.is_internal_admin() IS
'Returns true if current user is an internal user AND their active organization is internal. Prevents internal user bypass when operating in an external org context.';

-- =====================================================
-- PART 3: Allow ALLOW + DENY coexistence for the same resource/action
-- The original unique index only covers (resource_type, resource_name, action)
-- which blocks having both an ALLOW and a DENY row. Include effect.
-- =====================================================

DROP INDEX IF EXISTS public.idx_organization_policies_global_unique;
CREATE UNIQUE INDEX idx_organization_policies_global_unique
  ON public.organization_policies (resource_type, resource_name, action, effect)
  WHERE org_id IS NULL;

-- =====================================================
-- PART 4: Seed explicit DENY policies
-- =====================================================

DO $$
DECLARE
  v_cond_external JSONB := '{"field":"org_type","operator":"is","values":["external"]}'::jsonb;

  v_deny_external_delete_cc JSONB := jsonb_build_object(
    'version', 3, 'allow_internal_users', false,
    'rules', jsonb_build_array(
      jsonb_build_object(
        'connector', 'AND', 'scope', 'all',
        'conditions', jsonb_build_array(v_cond_external)
      )
    )
  );

  v_deny_permdelete_cc JSONB := jsonb_build_object(
    'version', 3, 'allow_internal_users', false,
    'rules', jsonb_build_array(
      jsonb_build_object(
        'connector', 'AND', 'scope', 'all',
        'conditions', jsonb_build_array(v_cond_external)
      ),
      jsonb_build_object(
        'connector', 'AND', 'scope', 'all',
        'conditions', jsonb_build_array(
          '{"field":"org_type","operator":"is","values":["internal"]}'::jsonb,
          '{"field":"org_role","operator":"is","values":["member"]}'::jsonb
        )
      )
    )
  );

  v_deny_settings_policies_cc JSONB := jsonb_build_object(
    'version', 3, 'allow_internal_users', false,
    'rules', jsonb_build_array(
      jsonb_build_object(
        'connector', 'AND', 'scope', 'all',
        'conditions', jsonb_build_array(v_cond_external)
      )
    )
  );
BEGIN

  -- (9a) DENY table:* DELETE for external orgs
  INSERT INTO public.organization_policies
    (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config, created_by_clerk_sub)
  SELECT NULL, 'table', '*', 'delete', 'all', 'DENY', true, true, 1,
    v_deny_external_delete_cc || '{"effect":"DENY"}'::jsonb,
    v_deny_external_delete_cc,
    'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type = 'table' AND resource_name = '*'
      AND action = 'delete' AND effect = 'DENY'
  );

  -- (9b) DENY feature:permanent_delete DELETE for non-Tier-1
  INSERT INTO public.organization_policies
    (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config, created_by_clerk_sub)
  SELECT NULL, 'feature', 'permanent_delete', 'delete', 'all', 'DENY', true, true, 1,
    v_deny_permdelete_cc || '{"effect":"DENY"}'::jsonb,
    v_deny_permdelete_cc,
    'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type = 'feature' AND resource_name = 'permanent_delete'
      AND action = 'delete' AND effect = 'DENY'
  );

  -- (9c) DENY feature:settings_policies * (all actions) for external orgs
  INSERT INTO public.organization_policies
    (org_id, resource_type, resource_name, action, scope, effect, is_active, is_protected_policy, version, definition_json, compiled_config, created_by_clerk_sub)
  SELECT NULL, 'feature', 'settings_policies', unnest(ARRAY['view', 'insert', 'update', 'delete']),
    'all', 'DENY', true, true, 1,
    v_deny_settings_policies_cc || '{"effect":"DENY"}'::jsonb,
    v_deny_settings_policies_cc,
    'system'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_policies
    WHERE org_id IS NULL AND resource_type = 'feature' AND resource_name = 'settings_policies'
      AND effect = 'DENY'
  );

END $$;

COMMIT;
