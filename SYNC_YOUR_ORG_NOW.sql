-- =====================================================
-- QUICK FIX: Sync Your Clerk Organization to Supabase
-- =====================================================
-- Run this in Supabase SQL Editor NOW to fix the error
-- =====================================================

-- Your organization ID from the error message
-- Replace the name with your actual organization name from Clerk Dashboard

INSERT INTO public.organizations (clerk_organization_id, name, slug)
VALUES (
  'org_38MVrtrQBrhnDmbz9w90xrm24uT',  -- ✓ Your Clerk org ID (from error message)
  'Brrrr Funder LLC',                   -- ⚠️ CHANGE THIS to your actual org name
  NULL                                 -- Leave as NULL if you don't have a slug
)
ON CONFLICT (clerk_organization_id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  updated_at = now();

-- Verify it was created
SELECT 
  id, 
  clerk_organization_id, 
  name, 
  slug,
  created_at
FROM public.organizations 
WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT';

-- =====================================================
-- After running this:
-- 1. You should see your organization in the results
-- 2. Refresh your browser at the /org/.../settings/documents/permissions page
-- 3. The RBAC matrix should now load successfully!
-- =====================================================

-- Optional: Check if your user is a member of this org
-- SELECT 
--   om.id,
--   om.user_id,
--   om.clerk_org_role,
--   om.clerk_member_role,
--   o.name as org_name
-- FROM organization_members om
-- JOIN organizations o ON o.id = om.organization_id
-- WHERE o.clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT';
