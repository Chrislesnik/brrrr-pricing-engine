-- =====================================================
-- Migration: Rename org_policies to organization_policies
-- Date: 2026-02-06
-- Description: Rename table for consistency with other table naming
-- Risk Level: LOW
-- =====================================================

BEGIN;

-- Rename the table
ALTER TABLE IF EXISTS public.org_policies 
  RENAME TO organization_policies;

-- Rename the unique constraint
ALTER TABLE IF EXISTS public.organization_policies
  RENAME CONSTRAINT org_policies_org_id_fkey 
  TO organization_policies_org_id_fkey;

ALTER TABLE IF EXISTS public.organization_policies
  RENAME CONSTRAINT org_policies_unique 
  TO organization_policies_unique;

ALTER TABLE IF EXISTS public.organization_policies
  RENAME CONSTRAINT org_policies_created_by_user_id_fkey 
  TO organization_policies_created_by_user_id_fkey;

ALTER TABLE IF EXISTS public.organization_policies
  RENAME CONSTRAINT org_policies_resource_type_check 
  TO organization_policies_resource_type_check;

ALTER TABLE IF EXISTS public.organization_policies
  RENAME CONSTRAINT org_policies_action_check 
  TO organization_policies_action_check;

-- Rename the index
ALTER INDEX IF EXISTS idx_org_policies_lookup 
  RENAME TO idx_organization_policies_lookup;

-- Rename RLS policies
ALTER POLICY IF EXISTS "org_policies_read_own_org" 
  ON public.organization_policies 
  RENAME TO "organization_policies_read_own_org";

ALTER POLICY IF EXISTS "org_policies_insert_owner_only" 
  ON public.organization_policies 
  RENAME TO "organization_policies_insert_owner_only";

ALTER POLICY IF EXISTS "org_policies_update_owner_only" 
  ON public.organization_policies 
  RENAME TO "organization_policies_update_owner_only";

ALTER POLICY IF EXISTS "org_policies_delete_owner_only" 
  ON public.organization_policies 
  RENAME TO "organization_policies_delete_owner_only";

-- Verify
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'organization_policies';

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - Table renamed from org_policies to organization_policies
-- - All constraints renamed for consistency
-- - Index renamed
-- - RLS policies renamed
-- - Application code will need updates to reference new table name
-- =====================================================
