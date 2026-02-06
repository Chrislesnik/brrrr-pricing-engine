-- =====================================================
-- CLEANUP: Remove Duplicate Member Roles
-- =====================================================
-- Problem: Both org-specific AND global versions exist
-- Solution: Keep only the global versions (organization_id = NULL)
-- =====================================================

BEGIN;

-- Step 1: Show current duplicates
SELECT 
  id,
  CASE 
    WHEN organization_id IS NULL THEN 'GLOBAL'
    ELSE 'ORG-SPECIFIC'
  END as scope,
  role_code,
  role_name,
  organization_id
FROM public.organization_member_roles
ORDER BY role_code, organization_id NULLS FIRST;

-- Step 2: Delete org-specific duplicates where global version exists
DELETE FROM public.organization_member_roles
WHERE id IN (
  SELECT org_specific.id
  FROM public.organization_member_roles org_specific
  INNER JOIN public.organization_member_roles global_version
    ON org_specific.role_code = global_version.role_code
  WHERE org_specific.organization_id IS NOT NULL
    AND global_version.organization_id IS NULL
);

-- Step 3: Verify cleanup - should only show global roles
SELECT 
  CASE 
    WHEN organization_id IS NULL THEN 'GLOBAL'
    ELSE 'ORG-SPECIFIC'
  END as scope,
  role_code,
  role_name,
  display_order,
  is_active
FROM public.organization_member_roles
ORDER BY 
  CASE WHEN organization_id IS NULL THEN 0 ELSE 1 END,
  display_order;

COMMIT;

-- =====================================================
-- Expected Results After Cleanup:
-- GLOBAL | admin              | Admin              | 1 | true
-- GLOBAL | manager            | Manager            | 2 | true
-- GLOBAL | member             | Member             | 3 | true
-- GLOBAL | account_executive  | Account Executive  | 4 | true
-- GLOBAL | loan_processor     | Loan Processor     | 5 | true
-- (no org-specific duplicates)
-- =====================================================
