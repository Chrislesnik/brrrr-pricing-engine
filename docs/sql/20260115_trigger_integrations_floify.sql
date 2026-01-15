-- Function to auto-manage child floify rows on integrations insert/delete
create or replace function public.sync_floify_child()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    if new.type = 'floify' then
      insert into integrations_floify (integration_id, api_key)
      values (new.id, null)
      on conflict (integration_id) do nothing;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    if old.type = 'floify' then
      delete from integrations_floify where integration_id = old.id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_floify_child_ins on integrations;
create trigger trg_sync_floify_child_ins
after insert on integrations
for each row execute function public.sync_floify_child();

drop trigger if exists trg_sync_floify_child_del on integrations;
create trigger trg_sync_floify_child_del
after delete on integrations
for each row execute function public.sync_floify_child();
