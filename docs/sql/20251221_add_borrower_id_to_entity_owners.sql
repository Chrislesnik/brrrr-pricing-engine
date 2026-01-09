-- Add borrower_id to entity_owners to link an owner to an existing borrower
alter table if exists public.entity_owners
  add column if not exists borrower_id uuid references public.borrowers(id);

-- Helpful index for lookups by borrower
create index if not exists entity_owners_borrower_idx on public.entity_owners(borrower_id);





