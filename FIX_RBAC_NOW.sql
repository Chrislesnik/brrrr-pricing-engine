-- =====================================================
-- URGENT FIX: is_org_admin() Function
-- =====================================================
-- This fixes a critical bug preventing RBAC matrix saves
-- Run this in Supabase SQL Editor immediately
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check if user is an admin or owner of the organization
  -- Supports both Clerk role formats: 'admin', 'org:admin', 'owner', 'org:owner'
  -- Uses auth.jwt()->>sub for Clerk compatibility (auth.uid()::text fails with non-UUID Clerk IDs)
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = (auth.jwt() ->> 'sub')
      AND (
        -- Direct role match
        lower(om.clerk_org_role) IN ('admin', 'owner')
        OR
        -- With org: prefix
        lower(replace(om.clerk_org_role, 'org:', '')) IN ('admin', 'owner')
      )
  );
END;
$$;

-- Verify fix
DO $$
BEGIN
  RAISE NOTICE 'is_org_admin() function fixed - now using clerk_org_role column';
END $$;
