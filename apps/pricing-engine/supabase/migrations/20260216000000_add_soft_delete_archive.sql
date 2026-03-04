-- ============================================================================
-- Migration: Add soft delete (archive) support
-- Adds archived_at + archived_by to 20 tables, partial indexes,
-- cascade archive trigger, and RLS policy updates.
-- ============================================================================

-- ============================================================================
-- 1. Add archived_at and archived_by columns
-- ============================================================================

-- Tier 1: Core Business
ALTER TABLE loans ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE loan_scenarios ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE loan_scenarios ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE deals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE entities ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE entities ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE guarantor ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE guarantor ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

-- Tier 2: Operational
ALTER TABLE inputs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE inputs ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE input_categories ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE input_categories ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE document_types ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE document_types ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE document_files ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE document_files ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE deal_tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE deal_tasks ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE deal_documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE deal_documents ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE actions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

-- Tier 3: Settings/Config
ALTER TABLE workflow_integrations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE workflow_integrations ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE organization_policies ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE organization_policies ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE organization_member_roles ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE organization_member_roles ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;

ALTER TABLE deal_stages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE deal_stages ADD COLUMN IF NOT EXISTS archived_by TEXT DEFAULT NULL;


-- ============================================================================
-- 2. Create partial indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_loans_not_archived ON loans (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_loan_scenarios_not_archived ON loan_scenarios (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_not_archived ON deals (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_borrowers_not_archived ON borrowers (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entities_not_archived ON entities (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guarantor_not_archived ON guarantor (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inputs_not_archived ON inputs (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_input_categories_not_archived ON input_categories (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_document_types_not_archived ON document_types (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_document_files_not_archived ON document_files (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_tasks_not_archived ON deal_tasks (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_documents_not_archived ON deal_documents (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_templates_not_archived ON task_templates (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_actions_not_archived ON actions (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_programs_not_archived ON programs (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_document_templates_not_archived ON document_templates (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_integrations_not_archived ON workflow_integrations (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organization_policies_not_archived ON organization_policies (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organization_member_roles_not_archived ON organization_member_roles (id) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deal_stages_not_archived ON deal_stages (id) WHERE archived_at IS NULL;


-- ============================================================================
-- 3. Create cascade archive trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION cascade_archive()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive cascade: when archived_at changes from NULL to a value
  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'loans' THEN
        UPDATE loan_scenarios
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE loan_id = NEW.id AND archived_at IS NULL;
      WHEN 'deals' THEN
        UPDATE deal_tasks
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE deal_id = NEW.id AND archived_at IS NULL;
        UPDATE deal_documents
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE deal_id = NEW.id AND archived_at IS NULL;
      WHEN 'borrowers' THEN
        UPDATE guarantor
          SET archived_at = NEW.archived_at, archived_by = NEW.archived_by
          WHERE borrower_id = NEW.display_id AND archived_at IS NULL;
      ELSE
        -- No cascade needed for other tables
        NULL;
    END CASE;
  END IF;

  -- Restore cascade: when archived_at changes from a value to NULL
  -- Only restore children that were cascade-archived at the exact same time
  IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'loans' THEN
        UPDATE loan_scenarios
          SET archived_at = NULL, archived_by = NULL
          WHERE loan_id = NEW.id AND archived_at = OLD.archived_at;
      WHEN 'deals' THEN
        UPDATE deal_tasks
          SET archived_at = NULL, archived_by = NULL
          WHERE deal_id = NEW.id AND archived_at = OLD.archived_at;
        UPDATE deal_documents
          SET archived_at = NULL, archived_by = NULL
          WHERE deal_id = NEW.id AND archived_at = OLD.archived_at;
      WHEN 'borrowers' THEN
        UPDATE guarantor
          SET archived_at = NULL, archived_by = NULL
          WHERE borrower_id = NEW.display_id AND archived_at = OLD.archived_at;
      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to parent tables that have cascade children
DROP TRIGGER IF EXISTS trg_cascade_archive_loans ON loans;
CREATE TRIGGER trg_cascade_archive_loans
  AFTER UPDATE OF archived_at ON loans
  FOR EACH ROW EXECUTE FUNCTION cascade_archive();

DROP TRIGGER IF EXISTS trg_cascade_archive_deals ON deals;
CREATE TRIGGER trg_cascade_archive_deals
  AFTER UPDATE OF archived_at ON deals
  FOR EACH ROW EXECUTE FUNCTION cascade_archive();

DROP TRIGGER IF EXISTS trg_cascade_archive_borrowers ON borrowers;
CREATE TRIGGER trg_cascade_archive_borrowers
  AFTER UPDATE OF archived_at ON borrowers
  FOR EACH ROW EXECUTE FUNCTION cascade_archive();


-- ============================================================================
-- 4. Update RLS SELECT policies to filter archived records
-- Only updating simple policies (qual = true) here. Complex org_policy_select
-- policies are handled at the application level since API routes use
-- supabaseAdmin which bypasses RLS.
-- ============================================================================

-- actions
DROP POLICY IF EXISTS "actions_select_authenticated" ON actions;
CREATE POLICY "actions_select_authenticated" ON actions
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- deal_stages
DROP POLICY IF EXISTS "deal_stages_select_authenticated" ON deal_stages;
CREATE POLICY "deal_stages_select_authenticated" ON deal_stages
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- deal_tasks
DROP POLICY IF EXISTS "deal_tasks_select_authenticated" ON deal_tasks;
CREATE POLICY "deal_tasks_select_authenticated" ON deal_tasks
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- inputs
DROP POLICY IF EXISTS "inputs_authenticated_select" ON inputs;
CREATE POLICY "inputs_authenticated_select" ON inputs
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- input_categories
DROP POLICY IF EXISTS "input_categories_authenticated_select" ON input_categories;
CREATE POLICY "input_categories_authenticated_select" ON input_categories
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- document_types
DROP POLICY IF EXISTS "document_types_authenticated_select" ON document_types;
CREATE POLICY "document_types_authenticated_select" ON document_types
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- task_templates
DROP POLICY IF EXISTS "task_templates_select_authenticated" ON task_templates;
CREATE POLICY "task_templates_select_authenticated" ON task_templates
  FOR SELECT TO authenticated
  USING (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true');

-- workflow_integrations
DROP POLICY IF EXISTS "workflow_integrations_select" ON workflow_integrations;
CREATE POLICY "workflow_integrations_select" ON workflow_integrations
  FOR SELECT TO authenticated
  USING (
    (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true')
    AND organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- organization_policies
DROP POLICY IF EXISTS "organization_policies_read_own_org" ON organization_policies;
CREATE POLICY "organization_policies_read_own_org" ON organization_policies
  FOR SELECT TO authenticated
  USING (
    (archived_at IS NULL OR current_setting('app.show_archived', true) = 'true')
    AND (org_id = get_active_org_id() OR org_id IS NULL)
  );
