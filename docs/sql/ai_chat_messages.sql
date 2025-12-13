-- Create table to store AI chat messages
-- Run this in your Supabase SQL editor or via migrations.
create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  ai_chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id text not null, -- Clerk user id
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_type text not null check (user_type in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_chat_messages_chat_time
  on public.ai_chat_messages (ai_chat_id, created_at);

-- Optional: keep ai_chats.last_used_at fresh
create or replace function public.touch_ai_chat_last_used()
returns trigger language plpgsql as $$
begin
  update public.ai_chats
     set last_used_at = now()
   where id = new.ai_chat_id;
  return new;
end;
$$;

drop trigger if exists trg_ai_chat_messages_touch_chat on public.ai_chat_messages;
create trigger trg_ai_chat_messages_touch_chat
after insert on public.ai_chat_messages
for each row execute function public.touch_ai_chat_last_used();

-- RLS policy stubs (adjust if you enable RLS)
-- alter table public.ai_chat_messages enable row level security;
-- create policy "org members can read their chat messages"
--   on public.ai_chat_messages
--   for select
--   using (true);
-- create policy "service role inserts"
--   on public.ai_chat_messages
--   for insert
--   with check (true);


