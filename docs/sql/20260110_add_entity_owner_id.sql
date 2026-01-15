-- Add entity_owner_id to entity_owners to support linking owners to entities
alter table if exists public.entity_owners
  add column if not exists entity_owner_id uuid references public.entities(id);

-- Unique constraint for borrower link upserts (already in schema for borrower_id)
create unique index if not exists entity_owners_borrower_idx
  on public.entity_owners (entity_id, borrower_id)
  where borrower_id is not null;

-- Unique index for entity-linked owners
create unique index if not exists entity_owners_entity_owner_idx
  on public.entity_owners (entity_id, entity_owner_id)
  where entity_owner_id is not null;

-- For linking table symmetry, ensure borrower_entities has the needed constraint
create unique index if not exists borrower_entities_borrower_entity_uid
  on public.borrower_entities (borrower_id, entity_id);

