-- Ensure sequence for display_id exists (matching your default expression)
create sequence if not exists public.borrowers_seq;

-- Drop legacy single phone column if it exists (we now use primary_phone and alt_phone)
alter table public.borrowers
  drop column if exists phone;

-- Change assigned_to from uuid[] -> text[] so we can store Clerk user IDs (user_*)
-- This avoids invalid UUID errors when inserting Clerk IDs
alter table public.borrowers
  alter column assigned_to type text[] using assigned_to::text[];

-- Helpful indexes remain unchanged; keep existing ones
create index if not exists borrowers_org_idx on public.borrowers using btree (organization_id);
create index if not exists borrowers_assigned_to_idx on public.borrowers using gin (assigned_to);
create index if not exists borrowers_zip_idx on public.borrowers using btree (zip);


