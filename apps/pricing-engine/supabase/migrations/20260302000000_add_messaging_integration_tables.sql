-- =====================================================
-- Migration: Add messaging integration tables
-- Date: 2026-03-02
-- Description:
--   Creates tables for the /messages chat feature:
--   1. comment_bridge_threads — maps document/task comment threads
--      to their parent deal channel threads in Liveblocks (idempotent
--      deduplication via UNIQUE constraint).
--   2. slack_channel_map — maps deal Liveblocks rooms to Slack channels
--      for bidirectional message sync.
--   3. teams_channel_map — maps deal Liveblocks rooms to Microsoft Teams
--      channels for bidirectional message sync.
--   4. external_user_map — maps Clerk user IDs to Slack/Teams user IDs
--      for message attribution.
-- =====================================================

BEGIN;

-- ─── 1. comment_bridge_threads ──────────────────────────────────────
-- Tracks which document/task entity has a linked thread in the parent
-- deal channel. The UNIQUE constraint ensures exactly one deal thread
-- per source entity, even under concurrent requests.
CREATE TABLE IF NOT EXISTS public.comment_bridge_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('document', 'task')),
  source_id uuid NOT NULL,
  source_name text NOT NULL,
  deal_thread_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, source_type, source_id)
);

COMMENT ON TABLE public.comment_bridge_threads IS
  'Maps document/task comment threads to parent deal channel threads in Liveblocks';
COMMENT ON COLUMN public.comment_bridge_threads.deal_thread_id IS
  'Liveblocks thread ID in the deal:* room';

-- Index for looking up bridge threads by deal
CREATE INDEX IF NOT EXISTS idx_comment_bridge_threads_deal
  ON public.comment_bridge_threads(deal_id);

-- ─── 2. slack_channel_map ───────────────────────────────────────────
-- Maps each deal to a corresponding Slack channel for bidirectional
-- message sync. One Slack channel per deal per org.
CREATE TABLE IF NOT EXISTS public.slack_channel_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  liveblocks_room_id text NOT NULL,
  slack_channel_id text NOT NULL,
  slack_channel_name text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, deal_id)
);

COMMENT ON TABLE public.slack_channel_map IS
  'Maps deal Liveblocks rooms to Slack channels for bidirectional messaging';

CREATE INDEX IF NOT EXISTS idx_slack_channel_map_slack_channel
  ON public.slack_channel_map(slack_channel_id);

-- ─── 3. teams_channel_map ───────────────────────────────────────────
-- Maps each deal to a corresponding Microsoft Teams channel for
-- bidirectional message sync. One Teams channel per deal per org.
CREATE TABLE IF NOT EXISTS public.teams_channel_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  liveblocks_room_id text NOT NULL,
  teams_team_id text NOT NULL,
  teams_channel_id text NOT NULL,
  teams_channel_name text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, deal_id)
);

COMMENT ON TABLE public.teams_channel_map IS
  'Maps deal Liveblocks rooms to Microsoft Teams channels for bidirectional messaging';

CREATE INDEX IF NOT EXISTS idx_teams_channel_map_teams_channel
  ON public.teams_channel_map(teams_team_id, teams_channel_id);

-- ─── 4. external_user_map ───────────────────────────────────────────
-- Maps Clerk user IDs to Slack/Teams user IDs so that messages sent
-- from external platforms can be attributed to the correct app user.
CREATE TABLE IF NOT EXISTS public.external_user_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('slack', 'teams')),
  external_user_id text NOT NULL,
  external_display_name text,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, provider, organization_id)
);

COMMENT ON TABLE public.external_user_map IS
  'Maps Clerk user IDs to external platform (Slack/Teams) user IDs';

-- Index for reverse lookups (external user → Clerk user)
CREATE INDEX IF NOT EXISTS idx_external_user_map_external
  ON public.external_user_map(external_user_id, provider, organization_id);

-- ─── RLS Policies ───────────────────────────────────────────────────
-- Enable RLS on all new tables (service-role key bypasses RLS)
ALTER TABLE public.comment_bridge_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_channel_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_channel_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_user_map ENABLE ROW LEVEL SECURITY;

-- Service-role access (API routes use supabaseAdmin which bypasses RLS).
-- No anon/authenticated policies needed since these tables are only
-- accessed via server-side API routes.

COMMIT;
