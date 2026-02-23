ALTER TABLE inputs ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;
