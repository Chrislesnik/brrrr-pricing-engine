
-- pe_term_sheets: parent record linking a document template to the PE term sheet system
CREATE TABLE pe_term_sheets (
  id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_template_id uuid NOT NULL UNIQUE
    REFERENCES document_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- pe_term_sheet_rules: rule groups (1:many per term sheet), each with AND/OR logic
CREATE TABLE pe_term_sheet_rules (
  id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pe_term_sheet_id int8 NOT NULL
    REFERENCES pe_term_sheets(id) ON DELETE CASCADE,
  logic_type text NOT NULL DEFAULT 'AND'
    CHECK (logic_type IN ('AND', 'OR')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- pe_term_sheet_conditions: flat conditions per rule (mirrors program_conditions pattern)
CREATE TABLE pe_term_sheet_conditions (
  id int8 GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pe_term_sheet_rule_id int8 NOT NULL
    REFERENCES pe_term_sheet_rules(id) ON DELETE CASCADE,
  field bigint,
  operator text,
  value_type text DEFAULT 'value'
    CHECK (value_type IN ('value', 'field', 'expression')),
  value text,
  value_field bigint,
  value_expression text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pe_term_sheets_display_order ON pe_term_sheets(display_order);
CREATE INDEX idx_pe_term_sheet_rules_sheet_id ON pe_term_sheet_rules(pe_term_sheet_id);
CREATE INDEX idx_pe_term_sheet_conditions_rule_id ON pe_term_sheet_conditions(pe_term_sheet_rule_id);
