-- Normalize clerk_org_role and clerk_member_role to bare format
-- (strip "org:" prefix) in organization_members and pending_invite_roles.

UPDATE public.organization_members
   SET clerk_org_role = REPLACE(clerk_org_role, 'org:', '')
 WHERE clerk_org_role LIKE 'org:%';

UPDATE public.organization_members
   SET clerk_member_role = REPLACE(clerk_member_role, 'org:', '')
 WHERE clerk_member_role LIKE 'org:%';

UPDATE public.pending_invite_roles
   SET clerk_org_role = REPLACE(clerk_org_role, 'org:', '')
 WHERE clerk_org_role LIKE 'org:%';

UPDATE public.pending_invite_roles
   SET clerk_member_role = REPLACE(clerk_member_role, 'org:', '')
 WHERE clerk_member_role LIKE 'org:%';
