-- =====================================================
-- Migration: Org Policies + Access Helpers
-- Date: 2026-02-03
-- Description:
--   - Create org_policies table for compiled policy storage
--   - Add is_org_owner() helper
--   - Add can_access_org_resource() helper for RLS/app gate
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: org_policies table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.org_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_name text NOT NULL DEFAULT '*',
  action text NOT NULL,
  definition_json jsonb NOT NULL,
  compiled_config jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_user_id bigint NULL,
  created_by_clerk_sub text NULL,
  CONSTRAINT org_policies_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT org_policies_unique
    UNIQUE (org_id, resource_type, resource_name, action),
  CONSTRAINT org_policies_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT org_policies_resource_type_check
    CHECK (resource_type = ANY (ARRAY['table'::text, 'storage_bucket'::text])),
  CONSTRAINT org_policies_action_check
    CHECK (action = ANY (ARRAY['select'::text, 'insert'::text, 'update'::text, 'delete'::text, 'all'::text]))
);

CREATE INDEX IF NOT EXISTS idx_org_policies_lookup
  ON public.org_policies USING btree (org_id, resource_type, resource_name, action, is_active);

-- =====================================================
-- PART 2: Helper functions
-- =====================================================

-- Function: is_org_owner()
CREATE OR REPLACE FUNCTION public.is_org_owner(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = auth.uid()::text
      AND lower(replace(coalesce(m.clerk_org_role, ''), 'org:', '')) = 'owner'
  );
$$;

COMMENT ON FUNCTION public.is_org_owner(uuid) IS
'Returns true if the current user is the owner of the specified organization';

-- Function: can_access_org_resource()
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
  v_org_role text;
  v_member_role text;
  v_org_role_norm text;
  v_member_role_norm text;
  v_is_internal boolean;
  v_policy_match boolean;
BEGIN
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

  -- JWT fast-path (if available)
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
      AND m.user_id = auth.uid()::text
    LIMIT 1;
  END IF;

  IF v_is_internal IS NULL THEN
    SELECT u.is_internal_yn
    INTO v_is_internal
    FROM public.users u
    WHERE u.clerk_user_id = auth.uid()::text
    LIMIT 1;
  END IF;

  v_org_role_norm := lower(replace(coalesce(v_org_role, ''), 'org:', ''));
  v_member_role_norm := lower(replace(coalesce(v_member_role, ''), 'org:', ''));

  SELECT EXISTS (
    SELECT 1
    FROM public.org_policies op
    WHERE op.org_id = v_org_id
      AND op.resource_type = p_resource_type
      AND (op.resource_name = '*' OR op.resource_name = p_resource_name)
      AND (op.action = p_action OR op.action = 'all')
      AND op.is_active = true
      AND (
        (COALESCE((op.compiled_config ->> 'allow_internal_users')::boolean, false) = true AND v_is_internal = true)
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(op.compiled_config -> 'allowed_role_pairs', '[]'::jsonb)) AS pair
          WHERE
            (split_part(pair, '|', 1) = '*' OR split_part(pair, '|', 1) = v_org_role_norm)
            AND (split_part(pair, '|', 2) = '*' OR split_part(pair, '|', 2) = v_member_role_norm)
        )
      )
  ) INTO v_policy_match;

  RETURN v_policy_match;
END;
$$;

COMMENT ON FUNCTION public.can_access_org_resource(text, text, text) IS
'Checks org-scoped access using compiled policy config with wildcard resource support';

GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_org_resource(text, text, text) TO authenticated;

-- =====================================================
-- PART 3: RLS for org_policies
-- =====================================================
ALTER TABLE public.org_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_policies_read_own_org" ON public.org_policies;
CREATE POLICY "org_policies_read_own_org"
  ON public.org_policies
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "org_policies_write_owner_only" ON public.org_policies;
CREATE POLICY "org_policies_write_owner_only"
  ON public.org_policies
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (org_id = public.get_active_org_id() AND public.is_org_owner(public.get_active_org_id()))
  WITH CHECK (org_id = public.get_active_org_id() AND public.is_org_owner(public.get_active_org_id()));

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - Canonical global scope uses resource_name='*'
-- - JWT claim paths (org_role/org_member_role/is_internal) may need alignment
-- =====================================================
