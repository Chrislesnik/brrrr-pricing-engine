-- Applications table to track borrower applications per loan
-- One row per loan (loan_id is the primary key)
create table if not exists public.applications (
  loan_id uuid primary key references public.loans(id) on delete cascade,
  organization_id uuid not null,
  -- Structured property address (from loan_scenarios.inputs.address)
  property_street text,
  property_city text,
  property_state text,
  property_zip text,
  -- Borrower + guarantors (store both names and IDs where known)
  borrower_id uuid null references public.borrowers(id) on delete set null,
  borrower_name text,
  guarantor_ids uuid[] null,
  guarantor_names text[] null,
  -- External document / application tracking
  documenso_document_id text,
  application_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_org_idx on public.applications(organization_id);
create index if not exists applications_updated_idx on public.applications(updated_at desc);
create index if not exists applications_documenso_idx on public.applications(documenso_document_id);

-- Updated-at trigger
create or replace function public.set_current_timestamp_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_applications_set_updated on public.applications;
create trigger trg_applications_set_updated
before update on public.applications
for each row execute function public.set_current_timestamp_updated_at();

-- Row Level Security (enable + org-scoped stubs)
-- NOTE: adjust to match your project's auth model. Service role bypasses RLS.
alter table public.applications enable row level security;

-- Allow org members to read application rows for their org.
drop policy if exists "applications_select_org" on public.applications;
create policy "applications_select_org"
  on public.applications
  for select
  using (
    -- Replace with your org-membership predicate as needed.
    -- For now, allow all rows to be selected; API routes should filter by org_id.
    true
  );

-- Allow inserts/updates/deletes for service role or trusted backend.
-- If you have session-based org matching, add WITH CHECK organization_id=...
drop policy if exists "applications_modify_org" on public.applications;
create policy "applications_modify_org"
  on public.applications
  for all
  using (true)
  with check (true);

-- Backfill from existing loans using their primary (or most recent) scenario
insert into public.applications (
  loan_id,
  organization_id,
  property_street,
  property_city,
  property_state,
  property_zip,
  borrower_name,
  guarantor_names,
  status
)
select
  l.id as loan_id,
  l.organization_id,
  (s.inputs->'address'->>'street')::text as property_street,
  (s.inputs->'address'->>'city')::text as property_city,
  (s.inputs->'address'->>'state')::text as property_state,
  (s.inputs->'address'->>'zip')::text as property_zip,
  (s.inputs->>'borrower_name')::text as borrower_name,
  coalesce(
    array(
      select jsonb_array_elements_text(coalesce(s.inputs->'guarantors', '[]'::jsonb))
    ),
    '{}'::text[]
  ) as guarantor_names,
  'draft'::text as status
from public.loans l
join lateral (
  select s.*
  from public.loan_scenarios s
  where s.loan_id = l.id
  order by s.primary desc nulls last, s.created_at desc nulls last
  limit 1
) s on true
where not exists (
  select 1 from public.applications a where a.loan_id = l.id
);


