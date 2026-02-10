-- =====================================================
-- Migration: Fix can_access_org_resource() + v2 condition support + global defaults
-- Date: 2026-02-10
-- Description:
--   1. Fix table reference: org_policies -> organization_policies
--   2. Fix auth: auth.uid()::text -> auth.jwt() ->> 'sub'
--   3. Add v2 structured condition evaluation
--   4. Add global default fallback (org_id IS NULL)
--   5. Support org_type condition field
-- =====================================================

BEGIN;

-- =====================================================
-- Step 1: Allow org_id to be NULL for global default policies
-- =====================================================
ALTER TABLE public.organization_policies
  ALTER COLUMN org_id DROP NOT NULL;

-- =====================================================
-- Step 2: Rewrite can_access_org_resource() with all fixes
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_org_resource(
  p_resource_type text,
  p_resource_name text,
  p_action text
)
RETURNS boolean
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
  v_policy_match boolean;
  v_policy record;
  v_condition jsonb;
  v_all_match boolean;
  v_any_match boolean;
  v_field_val text;
  v_cond_match boolean;
  v_connector text;
BEGIN
  -- Resolve user identity from JWT
  v_user_id := auth.jwt() ->> 'sub';
  v_org_id := public.get_active_org_id();

  IF v_org_id IS NULL THEN
    RETURN false;
  END IF;

  -- Service role bypass
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  -- Owner override to prevent lockout
  IF public.is_org_owner(v_org_id) THEN
    RETURN true;
  END IF;

  -- Resolve user roles (JWT fast-path with DB fallback)
  v_org_role := COALESCE(
    auth.jwt() ->> 'org_role',
    auth.jwt() ->> 'orgRole'
  );
  v_member_role := COALESCE(
    auth.jwt() ->> 'org_member_role',
    auth.jwt() ->> 'orgMemberRole'
  );
  v_is_internal := COALESCE(
    (auth.jwt() ->> 'is_internal')::boolean,
    (auth.jwt() ->> 'isInternal')::boolean
  );

  -- Fallback to DB if JWT is missing data
  IF v_org_role IS NULL OR v_member_role IS NULL THEN
    SELECT m.clerk_org_role, m.clerk_member_role
    INTO v_org_role, v_member_role
    FROM public.organization_members m
    WHERE m.organization_id = v_org_id
      AND m.user_id = v_user_id
    LIMIT 1;
  END IF;

  IF v_is_internal IS NULL THEN
    SELECT u.is_internal_yn
    INTO v_is_internal
    FROM public.users u
    WHERE u.clerk_user_id = v_user_id
    LIMIT 1;
  END IF;

  -- Resolve org type (is_internal_yn on the organization itself)
  SELECT o.is_internal_yn
  INTO v_is_internal_org
  FROM public.organizations o
  WHERE o.id = v_org_id;

  -- Normalize roles
  v_org_role := lower(replace(coalesce(v_org_role, ''), 'org:', ''));
  v_member_role := lower(replace(coalesce(v_member_role, ''), 'org:', ''));

  -- =====================================================
  -- Check org-specific policies first, then global defaults
  -- =====================================================
  FOR v_policy IN
    SELECT op.compiled_config
    FROM public.organization_policies op
    WHERE (op.org_id = v_org_id OR op.org_id IS NULL)
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
    ORDER BY
      -- Org-specific policies take priority over global defaults
      CASE WHEN op.org_id IS NOT NULL THEN 0 ELSE 1 END
  LOOP
    -- Check allow_internal_users bypass
    IF COALESCE((v_policy.compiled_config ->> 'allow_internal_users')::boolean, false) = true
       AND v_is_internal = true
    THEN
      RETURN true;
    END IF;

    -- Check compiled_config version
    IF COALESCE((v_policy.compiled_config ->> 'version')::int, 1) >= 2 THEN
      -- =====================================================
      -- V2: Structured condition evaluation
      -- =====================================================
      v_connector := COALESCE(v_policy.compiled_config ->> 'connector', 'AND');
      v_all_match := true;
      v_any_match := false;

      FOR v_condition IN
        SELECT * FROM jsonb_array_elements(
          COALESCE(v_policy.compiled_config -> 'conditions', '[]'::jsonb)
        )
      LOOP
        -- Resolve the field value for this condition
        CASE v_condition ->> 'field'
          WHEN 'org_role' THEN
            v_field_val := v_org_role;
          WHEN 'member_role' THEN
            v_field_val := v_member_role;
          WHEN 'org_type' THEN
            v_field_val := CASE
              WHEN v_is_internal_org = true THEN 'internal'
              ELSE 'external'
            END;
          WHEN 'internal_user' THEN
            v_field_val := CASE
              WHEN v_is_internal = true THEN 'yes'
              ELSE 'no'
            END;
          ELSE
            v_field_val := NULL;
        END CASE;

        -- Evaluate operator
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
          ELSE
            v_cond_match := false;
        END CASE;

        -- Apply connector logic
        IF v_cond_match THEN
          v_any_match := true;
        ELSE
          v_all_match := false;
        END IF;
      END LOOP;

      -- Evaluate final result based on connector
      IF v_connector = 'AND' AND v_all_match THEN
        RETURN true;
      ELSIF v_connector = 'OR' AND v_any_match THEN
        RETURN true;
      END IF;

    ELSE
      -- =====================================================
      -- V1: Legacy role-pair matching (backward compatible)
      -- =====================================================
      IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          COALESCE(v_policy.compiled_config -> 'allowed_role_pairs', '[]'::jsonb)
        ) AS pair
        WHERE
          (split_part(pair, '|', 1) = '*' OR split_part(pair, '|', 1) = v_org_role)
          AND (split_part(pair, '|', 2) = '*' OR split_part(pair, '|', 2) = v_member_role)
      ) THEN
        RETURN true;
      END IF;
    END IF;
  END LOOP;

  -- Default: deny
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.can_access_org_resource(text, text, text) IS
'Checks org-scoped access using v2 structured conditions or v1 role-pair matching. Falls back to global defaults (org_id IS NULL) when no org-specific policy matches.';

COMMIT;

-- =====================================================
-- Changes:
-- 1. Fixed table reference: org_policies -> organization_policies
-- 2. Fixed auth: auth.uid()::text -> auth.jwt() ->> 'sub'
-- 3. Added v2 condition evaluation (field/operator/values with AND/OR connector)
-- 4. Added global default fallback (org_id IS NULL)
-- 5. Added org_type condition support (checks organizations.is_internal_yn)
-- 6. Added internal_user condition support
-- 7. Backward compatible with v1 role-pair format
-- 8. Org-specific policies take priority over global defaults
-- =====================================================
