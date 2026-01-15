-- Backfill integrations for existing organization_members
-- Types: floify, xactus, clear
with types as (
  select unnest(array['floify','xactus','clear']) as type
),
members as (
  select organization_id, user_id::text
  from organization_members
)
insert into integrations (organization_id, user_id, type, status)
select m.organization_id, m.user_id, t.type, false
from members m
cross join types t
on conflict (organization_id, user_id, type) do nothing;
