-- Create join table to link borrowers and entities (many-to-many)
create table if not exists public.borrower_entities (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references public.borrowers(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  role text null,
  guarantor boolean null,
  ownership_percent numeric null,
  organization_id uuid not null,
  created_at timestamptz not null default now()
);

-- Optional helpful index
create index if not exists borrower_entities_borrower_idx on public.borrower_entities(borrower_id);
create index if not exists borrower_entities_entity_idx on public.borrower_entities(entity_id);
create index if not exists borrower_entities_org_idx on public.borrower_entities(organization_id);


