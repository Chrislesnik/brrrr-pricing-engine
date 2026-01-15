-- Persist Schedule A owners for entities
create table if not exists public.entity_owners (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text,
  title text,
  member_type text check (member_type in ('Individual','Entity')),
  id_number text, -- SSN or EIN as selected (consider encryption in production)
  guarantor boolean,
  ownership_percent numeric,
  address text,
  organization_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists entity_owners_entity_idx on public.entity_owners(entity_id);
create index if not exists entity_owners_org_idx on public.entity_owners(organization_id);


