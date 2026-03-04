-- API request activity logs for API tools observability.
-- Stores webhook tester and API key-related request events by organization.

create table if not exists public.api_request_activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id text null,
  source text not null default 'webhook_tester',
  endpoint text not null,
  method text not null,
  status_code integer null,
  duration_ms integer null,
  api_key_id text null,
  request_headers jsonb null,
  request_body jsonb null,
  response_headers jsonb null,
  response_body jsonb null,
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_request_activity_logs_org_created
  on public.api_request_activity_logs (org_id, created_at desc);

create index if not exists idx_api_request_activity_logs_org_status
  on public.api_request_activity_logs (org_id, status_code, created_at desc);

create index if not exists idx_api_request_activity_logs_org_method
  on public.api_request_activity_logs (org_id, method, created_at desc);

alter table public.api_request_activity_logs enable row level security;

drop policy if exists "api_request_activity_logs_select_via_policy_engine"
  on public.api_request_activity_logs;
create policy "api_request_activity_logs_select_via_policy_engine"
  on public.api_request_activity_logs
  for select
  to authenticated
  using (
    can_access_org_resource('feature', 'settings_api_request_logs', 'view')
    and org_id = (
      select o.id
      from public.organizations o
      where o.clerk_organization_id = auth.jwt() ->> 'org_id'
      limit 1
    )
  );
