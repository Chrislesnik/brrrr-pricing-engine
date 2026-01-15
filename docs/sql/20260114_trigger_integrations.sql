-- Function to insert default integrations for a new org member
create or replace function public.insert_default_integrations_for_member()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into integrations (organization_id, user_id, type, status)
  select new.organization_id, new.user_id::text, t.type, false
  from (values ('floify'), ('xactus'), ('clear')) as t(type)
  on conflict (organization_id, user_id, type) do nothing;
  return new;
end;
$$;

-- Trigger on organization_members AFTER INSERT
drop trigger if exists trg_insert_default_integrations_for_member on organization_members;

create trigger trg_insert_default_integrations_for_member
after insert on organization_members
for each row
execute function public.insert_default_integrations_for_member();
