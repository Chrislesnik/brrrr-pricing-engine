-- Replace structured "database" conditions with raw SQL conditions
-- Adds sql_expression column and updates source_type constraint

-- Add sql_expression column for raw SQL queries
ALTER TABLE task_logic_conditions
  ADD COLUMN IF NOT EXISTS sql_expression text;

-- Migrate any existing 'database' source_type rows to 'sql'
UPDATE task_logic_conditions SET source_type = 'sql' WHERE source_type = 'database';

-- Drop old constraint and add new one allowing 'input' and 'sql'
ALTER TABLE task_logic_conditions
  DROP CONSTRAINT IF EXISTS task_logic_conditions_source_type_check;
ALTER TABLE task_logic_conditions
  ADD CONSTRAINT task_logic_conditions_source_type_check
    CHECK (source_type IN ('input', 'sql'));

COMMENT ON COLUMN task_logic_conditions.sql_expression IS 'Raw SQL query for SQL-type conditions';
