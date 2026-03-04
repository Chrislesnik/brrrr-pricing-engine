-- Add an auto-generating UUID column to email_templates.
-- This UUID becomes the canonical template identifier used in URLs
-- and Liveblocks room IDs (email_template:{uuid}).

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS uuid uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_uuid_idx
  ON public.email_templates (uuid);

-- Backfill liveblocks_room_id for existing rows to use the new UUID.
UPDATE public.email_templates
SET liveblocks_room_id = 'email_template:' || uuid::text
WHERE liveblocks_room_id IS NULL
   OR liveblocks_room_id NOT LIKE 'email_template:________-____-____-____-____________';
