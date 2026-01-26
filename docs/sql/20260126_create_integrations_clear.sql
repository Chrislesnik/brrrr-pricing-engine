-- Create clear-specific subtable linked to integrations of type 'clear'
create table if not exists integrations_clear (
  integration_id uuid primary key references integrations(id) on delete cascade,
  username text not null,
  password text not null
);

-- Enforce that the parent integration is type='clear'
create or replace function ensure_clear_integration()
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
  if v_type <> 'clear' then
    raise exception 'integration % is type %, expected clear', new.integration_id, v_type;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_clear_integration on integrations_clear;
create trigger trg_ensure_clear_integration
before insert or update on integrations_clear
for each row execute function ensure_clear_integration();
