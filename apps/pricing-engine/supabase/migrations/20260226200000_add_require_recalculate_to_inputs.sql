ALTER TABLE inputs ADD COLUMN IF NOT EXISTS require_recalculate boolean NOT NULL DEFAULT false;
