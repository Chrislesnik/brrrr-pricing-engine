-- =====================================================
-- Migration: Add TTL to pending_invite_roles
-- Date: 2026-02-17
-- Description:
--   1. Add expires_at column with 30-day default TTL
--   2. Add index for efficient cleanup queries
-- =====================================================

BEGIN;

-- Add expires_at column (idempotent)
DO $$ BEGIN
  ALTER TABLE public.pending_invite_roles
    ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '30 days');
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_pending_invite_roles_expires_at
  ON public.pending_invite_roles (expires_at)
  WHERE expires_at IS NOT NULL;

COMMIT;
