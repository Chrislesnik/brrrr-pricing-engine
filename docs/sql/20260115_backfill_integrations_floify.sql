-- Backfill integrations_floify for existing floify integrations
insert into integrations_floify (integration_id, api_key)
select i.id, null::text
from integrations i
where i.type = 'floify'
on conflict (integration_id) do nothing;
