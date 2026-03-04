-- Add database condition support to task_logic_conditions
-- Allows conditions to check values from related database tables (not just input fields)

ALTER TABLE task_logic_conditions
  ADD COLUMN source_type text NOT NULL DEFAULT 'input',
  ADD COLUMN db_table text,
  ADD COLUMN db_column text,
  ADD COLUMN db_match_type text;

-- Add check constraint for valid source types
ALTER TABLE task_logic_conditions
  ADD CONSTRAINT task_logic_conditions_source_type_check
    CHECK (source_type IN ('input', 'database'));

-- Add check constraint for valid match types
ALTER TABLE task_logic_conditions
  ADD CONSTRAINT task_logic_conditions_db_match_type_check
    CHECK (db_match_type IS NULL OR db_match_type IN ('any', 'all'));

COMMENT ON COLUMN task_logic_conditions.source_type IS 'Condition source: input (form field) or database (table lookup)';
COMMENT ON COLUMN task_logic_conditions.db_table IS 'Table name for database conditions';
COMMENT ON COLUMN task_logic_conditions.db_column IS 'Column name for database conditions';
COMMENT ON COLUMN task_logic_conditions.db_match_type IS 'For one-to-many: any (OR) or all (AND)';
