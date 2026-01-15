-- Enable RLS
alter table integrations_floify enable row level security;

-- Policy helpers: use parent integrations row for org/user scoping
create policy integrations_floify_select on integrations_floify
for select using (
  exists (
    select 1 from integrations i
    where i.id = integrations_floify.integration_id
      and i.organization_id = current_setting('app.org_id', true)::uuid
      and (i.user_id is null or i.user_id = current_setting('app.user_id', true))
  )
);

create policy integrations_floify_mod on integrations_floify
for all using (
  exists (
    select 1 from integrations i
    where i.id = integrations_floify.integration_id
      and i.organization_id = current_setting('app.org_id', true)::uuid
      and (i.user_id is null or i.user_id = current_setting('app.user_id', true))
  )
)
with check (
  exists (
    select 1 from integrations i
    where i.id = integrations_floify.integration_id
      and i.organization_id = current_setting('app.org_id', true)::uuid
      and (i.user_id is null or i.user_id = current_setting('app.user_id', true))
  )
);
