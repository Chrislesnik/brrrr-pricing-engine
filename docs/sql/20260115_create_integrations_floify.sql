-- Create floify-specific subtable linked to integrations of type 'floify'
create table if not exists integrations_floify (
  integration_id uuid primary key references integrations(id) on delete cascade,
  api_key text not null
);

-- Enforce that the parent integration is type='floify'
create or replace function ensure_floify_integration()
returns trigger
language plpgsql
as $$
declare
  v_type text;
begin
  select type into v_type from integrations where id = new.integration_id;
  if v_type is null then
    raise exception 'integration % not found', new.integration_id;
  end if;
  if v_type <> 'floify' then
    raise exception 'integration % is type %, expected floify', new.integration_id, v_type;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_floify_integration on integrations_floify;
create trigger trg_ensure_floify_integration
before insert or update on integrations_floify
for each row execute function ensure_floify_integration();
