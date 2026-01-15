-- Sync applications borrower/guarantor IDs from primary loan scenarios
-- Adds explicit columns to loan_scenarios and wiring triggers both ways.

-- Ensure applications has entity_id for borrower entity linkage
alter table if exists public.applications
  add column if not exists entity_id uuid references public.entities(id) on delete set null;

-- Add structured borrower/guarantor columns to loan_scenarios (no backfill)
alter table if exists public.loan_scenarios
  add column if not exists borrower_entity_id uuid references public.entities(id) on delete set null,
  add column if not exists guarantor_borrower_ids uuid[];

-- Helper to copy primary scenario values into the applications row for a loan
create or replace function public.sync_application_from_primary_scenario(p_loan_id uuid)
returns void
language plpgsql
as $$
declare
begin
  with primary_scenario as (
    select ls.borrower_entity_id, ls.guarantor_borrower_ids
    from public.loan_scenarios ls
    where ls.loan_id = p_loan_id
      and coalesce(ls.primary, false) = true
    order by ls.created_at desc nulls last, ls.id desc
    limit 1
  ),
  src as (
    select * from primary_scenario
    union all
    select null::uuid as borrower_entity_id, null::uuid[] as guarantor_borrower_ids
    where not exists (select 1 from primary_scenario)
    limit 1
  )
  update public.applications a
  set entity_id = src.borrower_entity_id,
      guarantor_ids = src.guarantor_borrower_ids
  from src
  where a.loan_id = p_loan_id;
end;
$$;

-- Trigger wrapper for applications inserts/updates
create or replace function public.trg_applications_sync_from_primary_scenario()
returns trigger
language plpgsql
as $$
begin
  if new.loan_id is not null then
    perform public.sync_application_from_primary_scenario(new.loan_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_applications_sync_from_primary_scenario on public.applications;
create trigger trg_applications_sync_from_primary_scenario
after insert or update of loan_id on public.applications
for each row
execute function public.trg_applications_sync_from_primary_scenario();

-- Trigger wrapper for loan_scenarios changes (insert/update/delete)
create or replace function public.trg_loan_scenarios_sync_applications()
returns trigger
language plpgsql
as $$
declare
  affected_old uuid;
  affected_new uuid;
  needs_new boolean := false;
  needs_old boolean := false;
begin
  if tg_op = 'INSERT' then
    affected_new := new.loan_id;
    needs_new := true;
  elsif tg_op = 'UPDATE' then
    affected_new := new.loan_id;
    affected_old := old.loan_id;

    if affected_new is distinct from affected_old then
      needs_old := affected_old is not null;
      needs_new := affected_new is not null;
    end if;

    if coalesce(new.primary, false) is distinct from coalesce(old.primary, false)
       or new.borrower_entity_id is distinct from old.borrower_entity_id
       or new.guarantor_borrower_ids is distinct from old.guarantor_borrower_ids then
      needs_new := true;
    end if;
  elsif tg_op = 'DELETE' then
    affected_old := old.loan_id;
    needs_old := affected_old is not null;
  end if;

  if needs_old then
    perform public.sync_application_from_primary_scenario(affected_old);
  end if;
  if needs_new then
    perform public.sync_application_from_primary_scenario(affected_new);
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

drop trigger if exists trg_loan_scenarios_sync_applications on public.loan_scenarios;
create trigger trg_loan_scenarios_sync_applications
after insert or update or delete on public.loan_scenarios
for each row
execute function public.trg_loan_scenarios_sync_applications();
