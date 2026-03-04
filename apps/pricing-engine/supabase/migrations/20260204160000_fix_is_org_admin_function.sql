-- =====================================================
-- Migration: Fix is_org_admin() function
-- Date: 2026-02-04
-- Description:
--   Update is_org_admin() to use correct column name after
--   migration 20260203130000 renamed 'role' to 'clerk_org_role'
-- Dependencies: 20260203130000_add_organization_columns_and_member_roles.sql
-- Breaking Changes: None (fix for broken function)
-- Risk Level: LOW
-- =====================================================

BEGIN;

-- =====================================================
-- Update is_org_admin() to use clerk_org_role column
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is an admin or owner of the organization
  -- Supports both Clerk role formats: 'admin', 'org:admin', 'owner', 'org:owner'
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()::text
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

COMMENT ON FUNCTION public.is_org_admin(uuid) IS 
'Returns true if the current user is an admin or owner of the specified organization. Checks clerk_org_role column with support for org: prefix.';

-- =====================================================
-- Verification
-- =====================================================
DO $$
BEGIN
  -- Verify function exists and can be called
  PERFORM public.is_org_admin(gen_random_uuid());
  
  RAISE NOTICE 'Migration completed: is_org_admin() function updated to use clerk_org_role column';
END $$;

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - Fixed is_org_admin() to use clerk_org_role instead of role column
-- - Now supports both 'admin' and 'owner' roles
-- - Handles both direct role names and 'org:' prefixed format
-- - This fixes the RLS policies for document_access_permissions table
-- =====================================================
