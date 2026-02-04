-- =====================================================
-- Migration: Add deal comments and read tracking
-- Date: 2026-02-04
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.deal_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id text NOT NULL,
  author_clerk_user_id text NOT NULL,
  author_name text NOT NULL,
  author_avatar_url text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS deal_comments_deal_id_idx
  ON public.deal_comments (deal_id);

CREATE TABLE IF NOT EXISTS public.deal_comment_reads (
  deal_id text NOT NULL,
  clerk_user_id text NOT NULL,
  last_read_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (deal_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS deal_comment_reads_user_idx
  ON public.deal_comment_reads (clerk_user_id);

COMMIT;
