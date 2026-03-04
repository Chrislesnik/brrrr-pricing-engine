-- =====================================================
-- QUICK FIX: Manually sync your Clerk organization to Supabase
-- =====================================================
-- Run this in Supabase SQL Editor to sync your organization
-- Replace the values with your actual Clerk org data
-- =====================================================

-- Option 1: If you know your org details
INSERT INTO public.organizations (clerk_organization_id, name, slug)
VALUES ('org_38MVrtrQBrhnDmbz9w90xrm24uT', 'Your Org Name', 'your-org-slug')
ON CONFLICT (clerk_organization_id) DO NOTHING;

-- Option 2: Just create with minimal data (name will update later)
-- INSERT INTO public.organizations (clerk_organization_id, name)
-- VALUES ('org_38MVrtrQBrhnDmbz9w90xrm24uT', 'My Organization')
-- ON CONFLICT (clerk_organization_id) DO NOTHING;

-- Verify it was created
SELECT id, clerk_organization_id, name, slug 
FROM public.organizations 
WHERE clerk_organization_id = 'org_38MVrtrQBrhnDmbz9w90xrm24uT';
