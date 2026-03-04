ALTER TABLE actions
  ADD COLUMN trigger_type TEXT NOT NULL DEFAULT 'manual'
  CONSTRAINT actions_trigger_type_check CHECK (trigger_type IN ('webhook', 'manual', 'cron'));
