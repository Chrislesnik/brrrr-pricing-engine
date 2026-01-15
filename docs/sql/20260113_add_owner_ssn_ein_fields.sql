-- Add SSN/EIN separation for entity owners
alter table if exists public.entity_owners
  add column if not exists ssn_encrypted text,
  add column if not exists ssn_last4 text,
  add column if not exists ein text,
  add column if not exists borrower_id uuid,
  add column if not exists entity_owner_id uuid;

-- Optional: keep legacy id_number for backfill, but prefer new columns.
comment on column public.entity_owners.ssn_encrypted is 'Encrypted SSN for individual owners (same scheme as borrowers)';
comment on column public.entity_owners.ssn_last4 is 'Last 4 digits of SSN for masked display';
comment on column public.entity_owners.ein is 'EIN for entity-type owners (stored in plain text)';

-- RLS note: restrict ssn_encrypted access to service role or dedicated functions.
