-- Keep assigned_to (text[]) and credit_report_viewers in sync both ways
-- 1) From credit_reports.assigned_to -> credit_report_viewers
create or replace function public.sync_viewers_from_credit_reports()
returns trigger
language plpgsql
as $$
begin
  -- insert missing viewers for each assigned user
  insert into public.credit_report_viewers (report_id, user_id)
  select NEW.id, t.user_id
  from unnest(coalesce(NEW.assigned_to, '{}'::text[])) as t(user_id)
  on conflict (report_id, user_id) do nothing;

  -- delete viewers that are no longer assigned
  delete from public.credit_report_viewers v
  where v.report_id = NEW.id
    and not (v.user_id = any(coalesce(NEW.assigned_to, '{}'::text[])));

  return NEW;
end;
$$;

drop trigger if exists trg_sync_viewers_from_credit_reports on public.credit_reports;
create trigger trg_sync_viewers_from_credit_reports
after insert or update on public.credit_reports
for each row
execute function public.sync_viewers_from_credit_reports();

-- 2) From credit_report_viewers -> credit_reports.assigned_to (insert)
create or replace function public.sync_assigned_from_viewers_ins()
returns trigger
language plpgsql
as $$
begin
  update public.credit_reports r
  set assigned_to = (
    select array_agg(distinct x)
    from unnest(coalesce(r.assigned_to, '{}'::text[]) || array[NEW.user_id]) as t(x)
  )
  where r.id = NEW.report_id;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_assigned_from_viewers_ins on public.credit_report_viewers;
create trigger trg_sync_assigned_from_viewers_ins
after insert on public.credit_report_viewers
for each row
execute function public.sync_assigned_from_viewers_ins();

-- 3) From credit_report_viewers -> credit_reports.assigned_to (delete)
create or replace function public.sync_assigned_from_viewers_del()
returns trigger
language plpgsql
as $$
begin
  update public.credit_reports r
  set assigned_to = array_remove(r.assigned_to, OLD.user_id)
  where r.id = OLD.report_id;
  return OLD;
end;
$$;

drop trigger if exists trg_sync_assigned_from_viewers_del on public.credit_report_viewers;
create trigger trg_sync_assigned_from_viewers_del
after delete on public.credit_report_viewers
for each row
execute function public.sync_assigned_from_viewers_del();

