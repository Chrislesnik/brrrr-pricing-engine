-- Create role_assignments table: unified junction for role-based member assignments
CREATE TABLE IF NOT EXISTS public.role_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resource_type text NOT NULL CHECK (resource_type IN ('deal', 'loan', 'borrower', 'entity', 'deal_task')),
  resource_id text NOT NULL,
  role_type_id bigint NOT NULL REFERENCES public.deal_role_types(id),
  user_id text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  created_at timestamptz DEFAULT now(),
  created_by text,
  UNIQUE (resource_type, resource_id, role_type_id, user_id)
);

-- Index for fast lookups by resource
CREATE INDEX IF NOT EXISTS idx_role_assignments_resource 
  ON public.role_assignments (resource_type, resource_id);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_role_assignments_user 
  ON public.role_assignments (user_id);

-- Index for fast lookups by organization
CREATE INDEX IF NOT EXISTS idx_role_assignments_org 
  ON public.role_assignments (organization_id);

-- Backfill from loans.assigned_to_user_id -> role_assignments with Account Executive (id=6)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 
  'loan',
  l.id::text,
  6,
  uid.value::text,
  l.organization_id
FROM public.loans l,
  jsonb_array_elements_text(l.assigned_to_user_id) AS uid(value)
WHERE l.assigned_to_user_id IS NOT NULL 
  AND l.assigned_to_user_id != '[]'::jsonb
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;

-- Backfill from deals.assigned_to_user_id -> role_assignments with Account Executive (id=6)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 
  'deal',
  d.id::text,
  6,
  uid.value::text,
  d.organization_id
FROM public.deals d,
  jsonb_array_elements_text(d.assigned_to_user_id) AS uid(value)
WHERE d.assigned_to_user_id IS NOT NULL 
  AND d.assigned_to_user_id != '[]'::jsonb
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;

-- Backfill from borrowers.assigned_to -> role_assignments with Account Executive (id=6)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 
  'borrower',
  b.id::text,
  6,
  unnest(b.assigned_to),
  b.organization_id
FROM public.borrowers b
WHERE b.assigned_to IS NOT NULL 
  AND array_length(b.assigned_to, 1) > 0
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;

-- Backfill from entities.assigned_to -> role_assignments with Account Executive (id=6)
INSERT INTO public.role_assignments (resource_type, resource_id, role_type_id, user_id, organization_id)
SELECT 
  'entity',
  e.id::text,
  6,
  unnest(e.assigned_to),
  e.organization_id
FROM public.entities e
WHERE e.assigned_to IS NOT NULL 
  AND array_length(e.assigned_to, 1) > 0
ON CONFLICT (resource_type, resource_id, role_type_id, user_id) DO NOTHING;
