-- Add primary_user_id to loans; leave existing rows null
alter table public.loans
  add column if not exists primary_user_id text;

create index if not exists idx_loans_primary_user
  on public.loans (primary_user_id);
