-- Migration: Make organizations.is_internal_yn NOT NULL with DEFAULT FALSE
-- Date: 2026-02-16
-- Description:
--   - Backfill any NULL values to FALSE
--   - Set column default to FALSE
--   - Add NOT NULL constraint

BEGIN;

-- Backfill existing NULLs
UPDATE public.organizations
SET is_internal_yn = FALSE
WHERE is_internal_yn IS NULL;

-- Set default and NOT NULL
ALTER TABLE public.organizations
  ALTER COLUMN is_internal_yn SET DEFAULT FALSE,
  ALTER COLUMN is_internal_yn SET NOT NULL;

COMMIT;
