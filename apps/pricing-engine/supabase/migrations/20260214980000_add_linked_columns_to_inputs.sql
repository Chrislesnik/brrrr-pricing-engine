-- Add database-linked input support
-- Allows inputs to reference columns in related tables (borrowers, entities, entity_owners, property)
-- so values auto-populate from the source table and edits sync back.

-- inputs: store the link configuration
ALTER TABLE inputs
  ADD COLUMN IF NOT EXISTS linked_table text,
  ADD COLUMN IF NOT EXISTS linked_column text;

-- deal_inputs: store which record the user selected for this linked input
ALTER TABLE deal_inputs
  ADD COLUMN IF NOT EXISTS linked_record_id text;

COMMENT ON COLUMN inputs.linked_table IS 'Source table for database-linked inputs (e.g. borrowers, entities, property)';
COMMENT ON COLUMN inputs.linked_column IS 'Source column for database-linked inputs (e.g. fico_score, entity_name)';
COMMENT ON COLUMN deal_inputs.linked_record_id IS 'PK of the selected record in the linked table';
