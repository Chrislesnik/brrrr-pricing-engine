-- =====================================================
-- UPDATE: Make organization_member_roles support both global and org-scoped
-- =====================================================
-- Changes:
-- 1. Make organization_id NULLABLE (NULL = global role)
-- 2. Update unique constraint to handle NULL properly
-- 3. Seed global default roles
-- =====================================================

BEGIN;

-- Step 1: Make organization_id nullable
ALTER TABLE public.organization_member_roles 
  ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Drop old unique constraint and create new one
ALTER TABLE public.organization_member_roles
  DROP CONSTRAINT IF EXISTS organization_member_roles_unique;

-- New constraint: role_code must be unique within an org (or globally if NULL)
-- This allows same role_code to exist as both global and org-specific
CREATE UNIQUE INDEX organization_member_roles_unique_per_org
  ON public.organization_member_roles (organization_id, role_code)
  WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX organization_member_roles_unique_global
  ON public.organization_member_roles (role_code)
  WHERE organization_id IS NULL;

-- Step 3: Seed GLOBAL default roles (organization_id = NULL)
INSERT INTO public.organization_member_roles 
  (organization_id, role_code, role_name, description, display_order, is_active)
VALUES
  (NULL, 'admin', 'Admin', 'Full administrative access to organization settings and data', 1, true),
  (NULL, 'manager', 'Manager', 'Can manage deals, contacts, and team members', 2, true),
  (NULL, 'member', 'Member', 'Standard team member with basic access', 3, true),
  (NULL, 'account_executive', 'Account Executive', 'Manage client relationships and close deals', 4, true),
  (NULL, 'loan_processor', 'Loan Processor', 'Process loan applications and manage documentation', 5, true)
ON CONFLICT DO NOTHING;

-- Verification
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
-- Expected Results:
-- GLOBAL        | admin              | Admin              | 1 | true
-- GLOBAL        | manager            | Manager            | 2 | true
-- GLOBAL        | member             | Member             | 3 | true
-- GLOBAL        | account_executive  | Account Executive  | 4 | true
-- GLOBAL        | loan_processor     | Loan Processor     | 5 | true
-- (any org-specific roles would appear below)
-- =====================================================
