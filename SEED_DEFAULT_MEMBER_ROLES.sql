-- =====================================================
-- SEED: Global Default Member Roles
-- =====================================================
-- Run this AFTER running UPDATE_MEMBER_ROLES_FOR_HYBRID.sql
-- Seeds GLOBAL member roles (organization_id = NULL)
-- that are available to ALL organizations
-- =====================================================

-- Insert GLOBAL member roles (organization_id = NULL)
INSERT INTO public.organization_member_roles 
  (organization_id, role_code, role_name, description, display_order, is_active)
VALUES
  (NULL, 'admin', 'Admin', 'Full administrative access to organization settings and data', 1, true),
  (NULL, 'manager', 'Manager', 'Can manage deals, contacts, and team members', 2, true),
  (NULL, 'member', 'Member', 'Standard team member with basic access', 3, true),
  (NULL, 'account_executive', 'Account Executive', 'Manage client relationships and close deals', 4, true),
  (NULL, 'loan_processor', 'Loan Processor', 'Process loan applications and manage documentation', 5, true)
ON CONFLICT DO NOTHING;

-- Verify - show ALL roles (global and org-specific)
SELECT 
  CASE 
    WHEN organization_id IS NULL THEN 'GLOBAL'
    ELSE 'ORG-SPECIFIC'
  END as scope,
  role_code,
  role_name,
  description,
  display_order,
  is_active
FROM public.organization_member_roles
ORDER BY 
  CASE WHEN organization_id IS NULL THEN 0 ELSE 1 END,
  display_order;

-- =====================================================
-- Expected Results:
-- admin               | Admin               | Full administrative access...          | 1 | true
-- manager             | Manager             | Can manage deals...                    | 2 | true  
-- member              | Member              | Standard team member...                | 3 | true
-- account_executive   | Account Executive   | Manage client relationships...         | 4 | true
-- loan_processor      | Loan Processor      | Process loan applications...           | 5 | true
-- =====================================================
