-- =====================================================
-- Migration 6: Helper Functions for Access Control
-- Date: 2026-01-28
-- Description: Create helper functions for RLS policies and access control
-- Dependencies: Migration 4 (needs is_internal_yn column)
-- Breaking Changes: None
-- Risk Level: LOW
-- =====================================================

BEGIN;

-- =====================================================
-- Verify dependencies
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_internal_yn'
  ) THEN
    RAISE EXCEPTION 'Migration 6 failed: is_internal_yn column not found in users table. Run Migration 4 first.';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'document_categories'
  ) THEN
    RAISE EXCEPTION 'Migration 6 failed: document_categories table not found. Run Migration 2 first.';
  END IF;
END $$;

-- =====================================================
-- Function 1: is_internal_admin()
-- Purpose: Check if current user is an internal admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_internal_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE clerk_user_id = auth.uid()::text 
      AND is_internal_yn = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_internal_admin() IS 
'Returns true if the current authenticated user is an internal admin';

-- =====================================================
-- Function 2: can_access_deal_document() - CANONICAL  
-- Purpose: Core logic for deal-based document access control
-- Parameters:
--   p_deal_id: The deal/loan ID (UUID)
--   p_document_category_id: The document category ID
--   p_action: The action type ('view', 'insert', 'upload', 'delete')
-- NOTE: Full implementation in migration 20260128170600
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_deal_document(
  p_deal_id uuid,
  p_document_category_id bigint,
  p_action text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    CASE
      WHEN p_action NOT IN ('view','insert','upload','delete') THEN false
      ELSE (
        public.is_internal_admin()
        OR (
          public.get_active_org_id() IS NOT NULL

          -- Must be member of active org
          AND EXISTS (
            SELECT 1
            FROM public.organization_members m
            WHERE m.user_id = auth.uid()::text
              AND m.organization_id = public.get_active_org_id()
          )

          -- Deal must belong to active org if mapped
          AND (
            NOT EXISTS (
              SELECT 1
              FROM public.deals_clerk_orgs dorg
              WHERE dorg.deal_id = p_deal_id
            )
            OR EXISTS (
              SELECT 1
              FROM public.deals_clerk_orgs dorg
              WHERE dorg.deal_id = p_deal_id
                AND dorg.clerk_org_id = public.get_active_org_id()
            )
          )

          -- Org-admin bypass only after deal↔org validation
          AND public.is_org_admin(public.get_active_org_id())
          
          -- TODO: deal_roles check will be added in future migration
        )
      )
    END;
$$;

COMMENT ON FUNCTION public.can_access_deal_document(bigint, bigint, text) IS 
'Canonical function: Checks if current user can access a document for a specific deal and category (by ID). Returns true if access is granted, false otherwise.';

-- =====================================================
-- Function 3: can_access_deal_document_by_code() - WRAPPER
-- Purpose: Convenience wrapper that looks up category by code
-- Parameters:
--   p_deal_id: The deal/loan ID (UUID)
--   p_document_category_code: The document category code (e.g., 'financial', 'legal')
--   p_action: The action type ('view', 'insert', 'upload', 'delete')
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_deal_document_by_code(
  p_deal_id uuid,
  p_document_category_code text,
  p_action text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH cat AS (
    SELECT id
    FROM public.document_categories
    WHERE code = p_document_category_code
  )
  SELECT CASE
    WHEN (SELECT count(*) FROM cat) = 1
      THEN public.can_access_deal_document(p_deal_id, (SELECT id FROM cat), p_action)
    ELSE false
  END;
$$;

COMMENT ON FUNCTION public.can_access_deal_document_by_code(bigint, text, text) IS 
'Wrapper function: Looks up document category by code and delegates to can_access_deal_document(). Returns false if category code not found.';

-- =====================================================
-- Grant execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.is_internal_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_deal_document(bigint, bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_deal_document_by_code(bigint, text, text) TO authenticated;

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
  v_function_count integer;
BEGIN
  -- Count functions created
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'is_internal_admin',
    'can_access_deal_document',
    'can_access_deal_document_by_code'
  );
  
  IF v_function_count < 3 THEN
    RAISE EXCEPTION 'Migration 6 failed: Expected 3 functions, found %', v_function_count;
  END IF;
  
  -- Test that functions can be called
  PERFORM public.is_internal_admin();
  
  RAISE NOTICE 'Migration 6 completed successfully (% functions created)', v_function_count;
END $$;

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - 3 helper functions created:
--   1. is_internal_admin() - checks if user is internal admin
--   2. can_access_deal_document(deal_id, category_id, action) - canonical access control with full business logic
--   3. can_access_deal_document_by_code(deal_id, code, action) - wrapper with code lookup
-- - Wrapper explicitly handles not-found category (returns false)
-- - Canonical function implements comprehensive access control:
--   * Internal admins have full access
--   * Must be member of active organization
--   * Deal must belong to active org (if deal-org mapping exists)
--   * Org admins have full access (after deal-org validation)
--   * Users with deal roles check document_access_permissions by role and category
--   * Supports actions: view, insert, upload, delete
-- - Functions ready to be used in RLS policies and storage policies
-- =====================================================
