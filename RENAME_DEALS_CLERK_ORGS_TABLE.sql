-- =====================================================
-- Migration: Rename deals_clerk_orgs to deal_clerk_orgs
-- Date: 2026-02-05
-- Description: Rename table for consistency (singular 'deal')
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Rename the table
-- =====================================================
ALTER TABLE IF EXISTS public.deals_clerk_orgs 
  RENAME TO deal_clerk_orgs;

-- =====================================================
-- STEP 2: Rename the primary key constraint
-- =====================================================
ALTER TABLE IF EXISTS public.deal_clerk_orgs 
  RENAME CONSTRAINT deals_orgs_pkey TO deal_orgs_pkey;

-- =====================================================
-- STEP 3: Rename the unique constraint
-- =====================================================
ALTER TABLE IF EXISTS public.deal_clerk_orgs 
  RENAME CONSTRAINT deals_orgs_deal_id_clerk_org_id_key 
  TO deal_orgs_deal_id_clerk_org_id_key;

-- =====================================================
-- STEP 4: Rename foreign key constraints
-- =====================================================
ALTER TABLE IF EXISTS public.deal_clerk_orgs 
  RENAME CONSTRAINT deals_clerk_orgs_clerk_org_id_fkey 
  TO deal_clerk_orgs_clerk_org_id_fkey;

ALTER TABLE IF EXISTS public.deal_clerk_orgs 
  RENAME CONSTRAINT deals_clerk_orgs_deal_id_fkey 
  TO deal_clerk_orgs_deal_id_fkey;

-- =====================================================
-- STEP 5: Rename indexes
-- =====================================================
ALTER INDEX IF EXISTS public.idx_deals_orgs_clerk_org_id 
  RENAME TO idx_deal_orgs_clerk_org_id;

ALTER INDEX IF EXISTS public.idx_deals_orgs_deal_id 
  RENAME TO idx_deal_orgs_deal_id;

-- =====================================================
-- STEP 6: Update function references
-- Replace deals_clerk_orgs with deal_clerk_orgs in functions
-- =====================================================

-- Drop and recreate can_access_deal_document function with updated table name
DROP FUNCTION IF EXISTS public.can_access_deal_document(uuid, uuid);

CREATE OR REPLACE FUNCTION public.can_access_deal_document(
  p_deal_id uuid, 
  p_document_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_clerk_id text;
  v_active_org_id uuid;
  v_user_role text;
  v_org_role text;
  v_is_org_admin boolean;
BEGIN
  -- Get user's Clerk ID
  v_user_clerk_id := auth.jwt() ->> 'sub';
  
  -- Get active organization
  v_active_org_id := public.get_active_org_id();
  
  -- Get user's organization role
  v_is_org_admin := public.is_org_admin(v_user_clerk_id);
  
  -- Check if user has direct access
  IF EXISTS (
    SELECT 1 
    FROM public.deal_roles dr
    WHERE dr.deal_id = p_deal_id 
      AND dr.clerk_user_id = v_user_clerk_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check organization-level access
  IF v_is_org_admin 
    AND EXISTS (
      SELECT 1 
      FROM public.deal_clerk_orgs dorg
      WHERE dorg.deal_id = p_deal_id
        AND dorg.clerk_org_id = v_active_org_id
    )
  THEN
    RETURN true;
  END IF;
  
  -- Check if deal has no org restrictions (accessible to all internal users)
  IF v_is_org_admin
    AND NOT EXISTS (
      SELECT 1
      FROM public.deal_clerk_orgs dorg
      WHERE dorg.deal_id = p_deal_id
    )
  THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.can_access_deal_document(uuid, uuid) IS 
'Updated to use deal_clerk_orgs table. Checks if user can access a deal document based on their role and organization membership.';

-- =====================================================
-- VERIFICATION QUERIES (commented out - uncomment to verify)
-- =====================================================

-- Verify table was renamed
-- SELECT 'deal_clerk_orgs' AS expected_table, 
--        EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deal_clerk_orgs') AS exists;

-- Verify old table doesn't exist
-- SELECT 'deals_clerk_orgs' AS old_table, 
--        EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals_clerk_orgs') AS should_not_exist;

-- Verify constraints
-- SELECT conname AS constraint_name
-- FROM pg_constraint 
-- WHERE conrelid = 'public.deal_clerk_orgs'::regclass
-- ORDER BY conname;

-- Verify indexes
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename = 'deal_clerk_orgs'
-- ORDER BY indexname;

COMMIT;

-- =====================================================
-- POST-MIGRATION STEPS
-- =====================================================
-- 1. Regenerate TypeScript types:
--    cd apps/pricing-engine && npm run db:generate-types
--
-- 2. Update application code references:
--    - src/lib/deal-access.ts (line 68)
--    - src/app/api/pipeline/route.ts (line 132)
--
-- 3. Search and replace in codebase:
--    Find: deals_clerk_orgs
--    Replace: deal_clerk_orgs
--
-- =====================================================
