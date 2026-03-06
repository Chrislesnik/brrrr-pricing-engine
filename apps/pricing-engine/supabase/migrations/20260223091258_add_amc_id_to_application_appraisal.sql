-- Replay-safe migration:
-- integration_setup is introduced in a later migration in this repo.
-- Add the column here; the FK is added later once integration_setup exists.
ALTER TABLE IF EXISTS public.application_appraisal
  ADD COLUMN IF NOT EXISTS amc_id uuid NULL;
