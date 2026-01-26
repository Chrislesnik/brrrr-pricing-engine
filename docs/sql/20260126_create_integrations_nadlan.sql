-- Create integrations_nadlan table
create table if not exists integrations_nadlan (
  integration_id uuid primary key references integrations(id) on delete cascade,
  username text,
  password text
);

-- Create trigger function for nadlan
create or replace function sync_nadlan_child()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    if new.type = 'nadlan' then
      insert into integrations_nadlan (integration_id, username, password)
      values (new.id, null, null)
      on conflict (integration_id) do nothing;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.type = 'nadlan' then
      delete from integrations_nadlan where integration_id = old.id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

-- Create triggers for INSERT and DELETE
drop trigger if exists trg_sync_nadlan_child_ins on integrations;
create trigger trg_sync_nadlan_child_ins
  after insert on integrations
  for each row execute function sync_nadlan_child();

drop trigger if exists trg_sync_nadlan_child_del on integrations;
create trigger trg_sync_nadlan_child_del
  after delete on integrations
  for each row execute function sync_nadlan_child();

-- Backfill: create nadlan integration rows for all existing user/org combinations
-- and their corresponding child rows
insert into integrations (organization_id, user_id, type, status)
select distinct i.organization_id, i.user_id, 'nadlan', false
from integrations i
where not exists (
  select 1 from integrations i2 
  where i2.organization_id = i.organization_id 
    and i2.user_id = i.user_id 
    and i2.type = 'nadlan'
)
on conflict do nothing;

-- Backfill: create child rows for any nadlan integrations missing them
insert into integrations_nadlan (integration_id, username, password)
select i.id, null, null
from integrations i
where i.type = 'nadlan'
  and not exists (
    select 1 from integrations_nadlan n where n.integration_id = i.id
  )
on conflict do nothing;
