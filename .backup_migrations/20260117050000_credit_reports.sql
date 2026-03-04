-- Credit reports storage bucket, tables, and RLS
-- Bucket: credit-reports (private)

insert into storage.buckets (id, name, public)
values ('credit-reports', 'credit-reports', false)
on conflict (id) do update set public = false;

-- Core tables
create table if not exists public.credit_reports (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'credit-reports',
  storage_path text not null,
  assigned_to text[] not null, -- clerk user ids (text), supports multiple owners
  borrower_id uuid not null references public.borrowers (id) on delete cascade,
  status text default 'stored',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_reports_bucket_path_idx
  on public.credit_reports (bucket, storage_path);

create index if not exists credit_reports_assigned_to_idx
  on public.credit_reports using gin (assigned_to);

create index if not exists credit_reports_borrower_idx
  on public.credit_reports (borrower_id);

create table if not exists public.credit_report_viewers (
  report_id uuid not null references public.credit_reports (id) on delete cascade,
  user_id text not null, -- clerk user id
  added_by text, -- who granted access (clerk user id)
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index if not exists credit_report_viewers_user_idx
  on public.credit_report_viewers (user_id);

-- Enable RLS
alter table public.credit_reports enable row level security;
alter table public.credit_report_viewers enable row level security;

-- credit_reports policies
create policy "credit_reports service role all"
  on public.credit_reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "credit_reports owner or viewer select"
  on public.credit_reports
  for select
  using (
    auth.role() = 'service_role'
    or auth.uid()::text = any (assigned_to)
    or exists (
      select 1
      from public.credit_report_viewers v
      where v.report_id = credit_reports.id
        and v.user_id = auth.uid()::text
    )
  );

-- credit_report_viewers policies
create policy "credit_report_viewers service role all"
  on public.credit_report_viewers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "credit_report_viewers readable by owner/viewer"
  on public.credit_report_viewers
  for select
  using (
    auth.role() = 'service_role'
    or user_id = auth.uid()::text
    or added_by = auth.uid()::text
    or exists (
      select 1
      from public.credit_reports cr
      where cr.id = credit_report_viewers.report_id
        and auth.uid()::text = any (cr.assigned_to)
    )
  );

-- Storage object policies for credit-reports bucket
create policy "credit reports storage read for owner/viewer"
  on storage.objects
  for select
  using (
    bucket_id = 'credit-reports'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1
        from public.credit_reports cr
        left join public.credit_report_viewers v
          on v.report_id = cr.id and v.user_id = auth.uid()
        where cr.bucket = 'credit-reports'
          and cr.storage_path = storage.objects.name
          and (
            auth.uid()::text = any (cr.assigned_to)
            or v.user_id is not null
          )
      )
    )
  );

create policy "credit reports storage write service role"
  on storage.objects
  for all
  using (
    bucket_id = 'credit-reports'
    and auth.role() = 'service_role'
  )
  with check (
    bucket_id = 'credit-reports'
    and auth.role() = 'service_role'
  );
