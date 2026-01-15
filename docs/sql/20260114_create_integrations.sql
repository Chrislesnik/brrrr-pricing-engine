create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status boolean not null default false,
  user_id text,
  organization_id uuid not null
);

create index if not exists idx_integrations_org on integrations (organization_id);
create index if not exists idx_integrations_type on integrations (type);
create unique index if not exists uq_integrations_org_user_type on integrations (organization_id, user_id, type);
