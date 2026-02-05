-- =====================================================
-- Migration: Add RLS Policies for Organizations Table
-- Date: 2026-02-04
-- Description:
--   The organizations table was excluded from automatic
--   RLS policy generation, but needs policies for users
--   to query their own organizations
-- Risk Level: LOW
-- =====================================================

BEGIN;

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policy 1: Users can view organizations they are members of
-- =====================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    -- User is a member of this organization
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()::text
    )
  );

-- =====================================================
-- Policy 2: Service role has full access
-- =====================================================
DROP POLICY IF EXISTS "Service role full access to organizations" ON public.organizations;

CREATE POLICY "Service role full access to organizations"
  ON public.organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Policy 3: Internal admins can view all organizations
-- =====================================================
DROP POLICY IF EXISTS "Internal admins can view all organizations" ON public.organizations;

CREATE POLICY "Internal admins can view all organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_admin()
  );

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
  v_policy_count integer;
BEGIN
  -- Count policies on organizations table
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'organizations';
  
  IF v_policy_count < 2 THEN
    RAISE WARNING 'Expected at least 2 policies on organizations table, found %', v_policy_count;
  ELSE
    RAISE NOTICE 'Migration completed: % policies created on organizations table', v_policy_count;
  END IF;
END $$;

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - 3 policies created for organizations table
-- - Users can SELECT organizations they are members of
-- - Service role has full access
-- - Internal admins can view all organizations
-- - This fixes the issue where user queries couldn't find their orgs
-- =====================================================
