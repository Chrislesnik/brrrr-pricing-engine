ALTER TABLE pricing_engine_inputs ADD COLUMN IF NOT EXISTS require_recalculate boolean NOT NULL DEFAULT false;
