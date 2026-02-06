-- =====================================================
-- SEED: Default Organization Member Roles
-- =====================================================
-- Run this AFTER creating organization_member_roles table
-- This seeds global default roles that all orgs can use
-- =====================================================

-- Note: If organization_member_roles is org-scoped, you'll need to 
-- insert these for each organization. For now, this assumes a global
-- roles table OR you're seeding for a specific org.

-- Option 1: If table has organization_id (org-scoped roles)
-- Replace 'YOUR_ORG_UUID_HERE' with actual org UUID

INSERT INTO public.organization_member_roles 
  (organization_id, role_code, role_name, description, display_order, is_active)
VALUES
  (
    (SELECT id FROM organizations WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
    'admin',
    'Admin',
    'Full administrative access to organization settings and data',
    1,
    true
  ),
  (
    (SELECT id FROM organizations WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
    'manager',
    'Manager',
    'Can manage deals, contacts, and team members',
    2,
    true
  ),
  (
    (SELECT id FROM organizations WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
    'member',
    'Member',
    'Standard team member with basic access',
    3,
    true
  ),
  (
    (SELECT id FROM organizations WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
    'analyst',
    'Analyst',
    'View and analyze data without modification rights',
    4,
    true
  ),
  (
    (SELECT id FROM organizations WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'),
    'processor',
    'Processor',
    'Process deals and documents',
    5,
    true
  )
ON CONFLICT (organization_id, role_code) 
DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Verify
SELECT 
  role_code,
  role_name,
  description,
  display_order,
  is_active
FROM public.organization_member_roles
WHERE organization_id = (
  SELECT id FROM organizations 
  WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT'
)
ORDER BY display_order;

-- =====================================================
-- Expected Results:
-- admin     | Admin     | Full administrative access... | 1 | true
-- manager   | Manager   | Can manage deals...           | 2 | true  
-- member    | Member    | Standard team member...       | 3 | true
-- analyst   | Analyst   | View and analyze data...      | 4 | true
-- processor | Processor | Process deals...              | 5 | true
-- =====================================================
