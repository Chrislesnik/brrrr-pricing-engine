-- Add a dedicated JSONB column to store BlockNote Block[] documents.
-- This keeps blocknote_document (Block[]) separate from editor_json (Tiptap JSON)
-- so each format lives in its own column without format-sniffing.

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS blocknote_document jsonb;

COMMENT ON COLUMN public.email_templates.blocknote_document
  IS 'BlockNote Block[] document (used when editor engine = blocknote). Null when Tiptap is the active engine.';
