-- =====================================================
-- Migration: Fix remaining auth.uid() -> auth.jwt()->>'sub' in RLS policies
-- Date: 2026-02-11
-- Description:
--   15 RLS policies across 8 tables still use (auth.uid())::text which
--   fails with Clerk JWTs (Clerk user IDs are not UUIDs).
--   Replace all with (auth.jwt() ->> 'sub').
--
-- Affected tables:
--   organizations (1 policy)
--   organization_themes (2 policies)
--   credit_reports (1 policy)
--   credit_report_viewers (1 policy)
--   document_categories (1 policy)
--   document_files (2 policies)
--   rbac_permissions (1 policy)
--   term_sheet_templates (3 policies)
--   term_sheet_template_fields (3 policies)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. organizations: "Users can view their organizations"
-- =====================================================
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =====================================================
-- 2. organization_themes: 2 policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read their org themes" ON public.organization_themes;
CREATE POLICY "Users can read their org themes"
  ON public.organization_themes
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "Org admins can manage themes" ON public.organization_themes;
CREATE POLICY "Org admins can manage themes"
  ON public.organization_themes
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  );

-- =====================================================
-- 3. credit_reports: "credit_reports owner or viewer select"
-- =====================================================
DROP POLICY IF EXISTS "credit_reports owner or viewer select" ON public.credit_reports;
CREATE POLICY "credit_reports owner or viewer select"
  ON public.credit_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() ->> 'sub') = ANY (assigned_to)
    OR EXISTS (
      SELECT 1 FROM credit_report_viewers v
      WHERE v.report_id = credit_reports.id
        AND v.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- =====================================================
-- 4. credit_report_viewers: "credit_report_viewers readable by owner/viewer"
-- =====================================================
DROP POLICY IF EXISTS "credit_report_viewers readable by owner/viewer" ON public.credit_report_viewers;
CREATE POLICY "credit_report_viewers readable by owner/viewer"
  ON public.credit_report_viewers
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'service_role'
    OR user_id = (auth.jwt() ->> 'sub')
    OR added_by = (auth.jwt() ->> 'sub')
    OR EXISTS (
      SELECT 1 FROM credit_reports cr
      WHERE cr.id = credit_report_viewers.report_id
        AND (auth.jwt() ->> 'sub') = ANY (cr.assigned_to)
    )
  );

-- =====================================================
-- 5. document_categories: "Internal admins can manage categories"
-- =====================================================
DROP POLICY IF EXISTS "Internal admins can manage categories" ON public.document_categories;
CREATE POLICY "Internal admins can manage categories"
  ON public.document_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  );

-- =====================================================
-- 6. document_files: 2 policies
-- =====================================================
DROP POLICY IF EXISTS "Internal admins have full access to documents" ON public.document_files;
CREATE POLICY "Internal admins have full access to documents"
  ON public.document_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  );

DROP POLICY IF EXISTS "Users can view their own documents (placeholder)" ON public.document_files;
CREATE POLICY "Users can view their own documents (placeholder)"
  ON public.document_files
  FOR SELECT
  TO authenticated
  USING (uploaded_by = (auth.jwt() ->> 'sub'));

-- =====================================================
-- 7. rbac_permissions: "Internal admins can manage permissions"
-- =====================================================
DROP POLICY IF EXISTS "Internal admins can manage permissions" ON public.rbac_permissions;
CREATE POLICY "Internal admins can manage permissions"
  ON public.rbac_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.clerk_user_id = (auth.jwt() ->> 'sub')
        AND users.is_internal_yn = true
    )
  );

-- =====================================================
-- 8. term_sheet_templates: 3 policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read org templates" ON public.term_sheet_templates;
CREATE POLICY "Users can read org templates"
  ON public.term_sheet_templates
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "Org admins can manage all templates" ON public.term_sheet_templates;
CREATE POLICY "Org admins can manage all templates"
  ON public.term_sheet_templates
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can manage own templates" ON public.term_sheet_templates;
CREATE POLICY "Users can manage own templates"
  ON public.term_sheet_templates
  FOR ALL
  TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- =====================================================
-- 9. term_sheet_template_fields: 3 policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read fields for org templates" ON public.term_sheet_template_fields;
CREATE POLICY "Users can read fields for org templates"
  ON public.term_sheet_template_fields
  FOR SELECT
  TO authenticated
  USING (
    template_id IN (
      SELECT tst.id
      FROM term_sheet_templates tst
      JOIN organization_members om ON tst.organization_id = om.organization_id
      WHERE om.user_id = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "Org admins can manage all template fields" ON public.term_sheet_template_fields;
CREATE POLICY "Org admins can manage all template fields"
  ON public.term_sheet_template_fields
  FOR ALL
  TO authenticated
  USING (
    template_id IN (
      SELECT tst.id
      FROM term_sheet_templates tst
      JOIN organization_members om ON tst.organization_id = om.organization_id
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT tst.id
      FROM term_sheet_templates tst
      JOIN organization_members om ON tst.organization_id = om.organization_id
      WHERE om.user_id = (auth.jwt() ->> 'sub')
        AND om.clerk_org_role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can manage fields for own templates" ON public.term_sheet_template_fields;
CREATE POLICY "Users can manage fields for own templates"
  ON public.term_sheet_template_fields
  FOR ALL
  TO authenticated
  USING (
    template_id IN (
      SELECT term_sheet_templates.id
      FROM term_sheet_templates
      WHERE term_sheet_templates.user_id = (auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT term_sheet_templates.id
      FROM term_sheet_templates
      WHERE term_sheet_templates.user_id = (auth.jwt() ->> 'sub')
    )
  );

COMMIT;

-- =====================================================
-- Summary: Fixed 15 RLS policies across 8 tables
-- All (auth.uid())::text replaced with (auth.jwt() ->> 'sub')
-- =====================================================
