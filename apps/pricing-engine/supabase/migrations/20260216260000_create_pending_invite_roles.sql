-- Stores intended clerk_member_role for invited members before they accept.
-- When a membership webhook fires, we look up the pending role by email + org
-- and apply it to the organization_members record.

CREATE TABLE IF NOT EXISTS public.pending_invite_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    clerk_org_role text NOT NULL DEFAULT 'org:member',
    clerk_member_role text,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_pending_invite_roles_org_email
    ON public.pending_invite_roles (organization_id, lower(email));

GRANT ALL ON TABLE public.pending_invite_roles TO anon;
GRANT ALL ON TABLE public.pending_invite_roles TO authenticated;
GRANT ALL ON TABLE public.pending_invite_roles TO service_role;
