-- Create mapping table: one chat per report per user
create table if not exists public.credit_report_user_chats (
  report_id uuid not null references public.credit_reports(id) on delete cascade,
  user_id text not null,
  chat_id uuid not null references public.credit_report_chats(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
) tablespace pg_default;

create index if not exists credit_report_user_chats_chat_idx on public.credit_report_user_chats using btree (chat_id);

