-- =====================================================
-- Migration: Fix auth.uid() -> auth.jwt()->>'sub' in helper functions
-- Date: 2026-02-10
-- Description:
--   is_org_owner() and is_org_admin() use auth.uid()::text which fails
--   with Clerk JWTs because Clerk user IDs (e.g. user_xxx) are not UUIDs.
--   auth.uid() tries to cast the sub claim to UUID internally, causing
--   error 22P02. Fix: use auth.jwt() ->> 'sub' directly.
-- =====================================================

BEGIN;

-- =====================================================
-- Fix is_org_owner(): auth.uid()::text -> auth.jwt() ->> 'sub'
-- =====================================================
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
      AND m.user_id = (auth.jwt() ->> 'sub')
      AND lower(replace(coalesce(m.clerk_org_role, ''), 'org:', '')) = 'owner'
  );
$$;

COMMENT ON FUNCTION public.is_org_owner(uuid) IS
'Returns true if the current user is the owner of the specified organization. Uses auth.jwt()->>sub for Clerk compatibility.';

-- =====================================================
-- Fix is_org_admin(): auth.uid()::text -> auth.jwt() ->> 'sub'
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = (auth.jwt() ->> 'sub')
      AND (
        lower(om.clerk_org_role) IN ('admin', 'owner')
        OR
        lower(replace(om.clerk_org_role, 'org:', '')) IN ('admin', 'owner')
      )
  );
END;
$$;

COMMENT ON FUNCTION public.is_org_admin(uuid) IS
'Returns true if the current user is an admin or owner of the specified organization. Uses auth.jwt()->>sub for Clerk compatibility.';

-- =====================================================
-- Fix get_clerk_user_id(): auth.uid()::text -> auth.jwt() ->> 'sub'
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.jwt() ->> 'sub';
$$;

COMMENT ON FUNCTION public.get_clerk_user_id() IS
'Returns the Clerk user ID from the JWT sub claim. Uses auth.jwt()->>sub for Clerk compatibility.';

-- =====================================================
-- Add get_public_table_names() for policy builder UI
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_public_table_names()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tablename::text AS table_name
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_table_names() TO authenticated;

COMMIT;
