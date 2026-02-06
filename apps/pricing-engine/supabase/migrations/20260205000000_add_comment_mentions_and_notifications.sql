-- =====================================================
-- Migration: Add comment mentions and notifications
-- Date: 2026-02-05
-- Description: Adds support for @mentions in comments
--              and user notifications system
-- =====================================================

BEGIN;

-- =====================================================
-- Table: deal_comment_mentions
-- Tracks which users were mentioned in comments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deal_comment_mentions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.deal_comments(id) ON DELETE CASCADE,
  mentioned_user_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS deal_comment_mentions_comment_id_idx
  ON public.deal_comment_mentions (comment_id);

CREATE INDEX IF NOT EXISTS deal_comment_mentions_user_id_idx
  ON public.deal_comment_mentions (mentioned_user_id);

-- =====================================================
-- Table: notifications
-- General notification system for users
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL, -- 'mention', 'assignment', 'deal_update', etc.
  title text NOT NULL,
  message text NOT NULL,
  link text, -- URL to navigate to when clicking notification
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional data about the notification
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS notifications_read_idx
  ON public.notifications (user_id, read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON public.notifications (created_at DESC);

-- =====================================================
-- RLS Policies for deal_comment_mentions
-- Users can see mentions related to their accessible deals
-- =====================================================
ALTER TABLE public.deal_comment_mentions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view mentions on comments they can access
CREATE POLICY "Users can view mentions on accessible comments"
  ON public.deal_comment_mentions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_comments dc
      WHERE dc.id = deal_comment_mentions.comment_id
    )
  );

-- Policy: Users can insert mentions when creating comments
CREATE POLICY "Users can create mentions"
  ON public.deal_comment_mentions
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS Policies for notifications
-- Users can only see their own notifications
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Policy: System can insert notifications for any user
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

COMMIT;
