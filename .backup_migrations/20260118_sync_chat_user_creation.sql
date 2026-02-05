-- Ensure a chat exists and mapping is created for (report,user)
create or replace function public.ensure_user_chat(p_report_id uuid, p_org_id uuid, p_user_id text)
returns void
language plpgsql
as $$
declare
  v_chat_id uuid;
begin
  if p_report_id is null or p_user_id is null then
    return;
  end if;

  -- If mapping already exists, nothing to do
  select chat_id into v_chat_id
  from public.credit_report_user_chats
  where report_id = p_report_id and user_id = p_user_id;

  if v_chat_id is not null then
    return;
  end if;

  -- Reuse most recent chat for this user/org, otherwise create one
  select id into v_chat_id
  from public.credit_report_chats
  where user_id = p_user_id and organization_id = p_org_id
  order by created_at desc
  limit 1;

  if v_chat_id is null then
    insert into public.credit_report_chats (user_id, organization_id, name)
    values (p_user_id, p_org_id, 'Credit report chat')
    returning id into v_chat_id;
  end if;

  insert into public.credit_report_user_chats (report_id, user_id, chat_id)
  values (p_report_id, p_user_id, v_chat_id)
  on conflict (report_id, user_id) do update
  set chat_id = excluded.chat_id;
end;
$$;

-- Extend existing sync to also create chats for assigned users
create or replace function public.sync_viewers_from_credit_reports()
returns trigger
language plpgsql
as $$
declare
  user_id_var text;
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

  -- ensure chats + mappings for all assigned users
  foreach user_id_var in array coalesce(NEW.assigned_to, '{}'::text[]) loop
    perform public.ensure_user_chat(NEW.id, NEW.organization_id, user_id_var);
  end loop;

  return NEW;
end;
$$;

drop trigger if exists trg_sync_viewers_from_credit_reports on public.credit_reports;
create trigger trg_sync_viewers_from_credit_reports
after insert or update on public.credit_reports
for each row
execute function public.sync_viewers_from_credit_reports();

-- Viewer insert also ensures assignment and chat mapping
create or replace function public.sync_assigned_from_viewers_ins()
returns trigger
language plpgsql
as $$
declare
  v_org uuid;
begin
  update public.credit_reports r
  set assigned_to = (
    select array_agg(distinct x)
    from unnest(coalesce(r.assigned_to, '{}'::text[]) || array[NEW.user_id]) as t(x)
  )
  where r.id = NEW.report_id;

  select organization_id into v_org from public.credit_reports where id = NEW.report_id;
  perform public.ensure_user_chat(NEW.report_id, v_org, NEW.user_id);
  return NEW;
end;
$$;

drop trigger if exists trg_sync_assigned_from_viewers_ins on public.credit_report_viewers;
create trigger trg_sync_assigned_from_viewers_ins
after insert on public.credit_report_viewers
for each row
execute function public.sync_assigned_from_viewers_ins();

-- Do not delete chats; on viewer delete just remove assignment (access control)
create or replace function public.sync_assigned_from_viewers_del()
returns trigger
language plpgsql
as $$
begin
  update public.credit_reports r
  set assigned_to = array_remove(coalesce(r.assigned_to, '{}'::text[]), OLD.user_id)
  where r.id = OLD.report_id;
  return OLD;
end;
$$;

drop trigger if exists trg_sync_assigned_from_viewers_del on public.credit_report_viewers;
create trigger trg_sync_assigned_from_viewers_del
after delete on public.credit_report_viewers
for each row
execute function public.sync_assigned_from_viewers_del();

-- One-time backfill to ensure chats + mappings exist for all current assignments/viewers
do $$
declare
  r record;
  user_id_var text;
begin
  for r in
    select id as report_id, organization_id, assigned_to
    from public.credit_reports
  loop
    if r.assigned_to is not null then
      foreach user_id_var in array r.assigned_to loop
        perform public.ensure_user_chat(r.report_id, r.organization_id, user_id_var);
      end loop;
    end if;
    for user_id_var in
      select v.user_id from public.credit_report_viewers v where v.report_id = r.report_id
    loop
      perform public.ensure_user_chat(r.report_id, r.organization_id, user_id_var);
    end loop;
  end loop;
end;
$$;

