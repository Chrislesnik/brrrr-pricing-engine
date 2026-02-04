-- =====================================================
-- Migration: Add Organization Themes and Term Sheet Templates
-- Date: 2026-02-02
-- Description: 
--   - Create organization_themes table for custom theme CSS variables
--   - Create term_sheet_templates table for term sheet builder
--   - Create term_sheet_template_fields table for template custom fields
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Create organization_themes table
-- =====================================================

-- Stores custom theme CSS variables for each organization
CREATE TABLE IF NOT EXISTS public.organization_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NULL,
  theme_light jsonb NOT NULL,
  theme_dark jsonb NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT organization_themes_pkey PRIMARY KEY (id),
  CONSTRAINT organization_themes_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES public.organizations(id) 
    ON DELETE CASCADE
);

-- Add index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_themes_organization_id 
  ON public.organization_themes(organization_id);

-- Add unique constraint to ensure one theme per organization
CREATE UNIQUE INDEX IF NOT EXISTS organization_themes_organization_id_unique 
  ON public.organization_themes(organization_id);

-- Add comment
COMMENT ON TABLE public.organization_themes IS 
'Stores custom theme CSS variables (light and dark mode) for each organization';

-- Enable RLS
ALTER TABLE public.organization_themes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their org themes" ON public.organization_themes;
DROP POLICY IF EXISTS "Org admins can manage themes" ON public.organization_themes;
DROP POLICY IF EXISTS "Service role full access to organization_themes" ON public.organization_themes;

-- Allow users to read themes for their organization
CREATE POLICY "Users can read their org themes"
  ON public.organization_themes
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
    )
  );

-- Allow org admins to manage themes
CREATE POLICY "Org admins can manage themes"
  ON public.organization_themes
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  );

-- Allow service role full access
CREATE POLICY "Service role full access to organization_themes"
  ON public.organization_themes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_organization_themes_updated_at
  BEFORE UPDATE ON public.organization_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- =====================================================
-- PART 2: Create term_sheet_templates table
-- =====================================================

-- Stores term sheet templates with HTML content and GrapesJS data
CREATE TABLE IF NOT EXISTS public.term_sheet_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id text NOT NULL,
  name text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  gjs_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT term_sheet_templates_pkey PRIMARY KEY (id),
  CONSTRAINT term_sheet_templates_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES public.organizations(id) 
    ON DELETE CASCADE
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_term_sheet_templates_organization_id 
  ON public.term_sheet_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_term_sheet_templates_user_id 
  ON public.term_sheet_templates(user_id);

-- Add comment
COMMENT ON TABLE public.term_sheet_templates IS 
'Stores term sheet templates with HTML content and GrapesJS editor data';

-- Enable RLS
ALTER TABLE public.term_sheet_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read org templates" ON public.term_sheet_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.term_sheet_templates;
DROP POLICY IF EXISTS "Org admins can manage all templates" ON public.term_sheet_templates;
DROP POLICY IF EXISTS "Service role full access to term_sheet_templates" ON public.term_sheet_templates;

-- Allow users to read templates for their organization
CREATE POLICY "Users can read org templates"
  ON public.term_sheet_templates
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
    )
  );

-- Allow users to manage their own templates
CREATE POLICY "Users can manage own templates"
  ON public.term_sheet_templates
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Allow org admins to manage all templates in their org
CREATE POLICY "Org admins can manage all templates"
  ON public.term_sheet_templates
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  );

-- Allow service role full access
CREATE POLICY "Service role full access to term_sheet_templates"
  ON public.term_sheet_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_term_sheet_templates_updated_at
  BEFORE UPDATE ON public.term_sheet_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- =====================================================
-- PART 3: Create term_sheet_template_fields table
-- =====================================================

-- Stores custom fields for term sheet templates with their types and required status
CREATE TABLE IF NOT EXISTS public.term_sheet_template_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  name text NOT NULL,
  field_type text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT term_sheet_template_fields_pkey PRIMARY KEY (id),
  CONSTRAINT term_sheet_template_fields_template_id_fkey 
    FOREIGN KEY (template_id) 
    REFERENCES public.term_sheet_templates(id) 
    ON DELETE CASCADE
);

-- Add index on template_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_term_sheet_template_fields_template_id 
  ON public.term_sheet_template_fields(template_id);

-- Add index on position for ordering
CREATE INDEX IF NOT EXISTS idx_term_sheet_template_fields_position 
  ON public.term_sheet_template_fields(template_id, position);

-- Add comment
COMMENT ON TABLE public.term_sheet_template_fields IS 
'Stores custom fields for term sheet templates with their types, required status, and display order';

-- Enable RLS
ALTER TABLE public.term_sheet_template_fields ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read fields for org templates" ON public.term_sheet_template_fields;
DROP POLICY IF EXISTS "Users can manage fields for own templates" ON public.term_sheet_template_fields;
DROP POLICY IF EXISTS "Org admins can manage all template fields" ON public.term_sheet_template_fields;
DROP POLICY IF EXISTS "Service role full access to term_sheet_template_fields" ON public.term_sheet_template_fields;

-- Allow users to read fields for templates in their organization
CREATE POLICY "Users can read fields for org templates"
  ON public.term_sheet_template_fields
  FOR SELECT
  TO authenticated
  USING (
    template_id IN (
      SELECT tst.id 
      FROM public.term_sheet_templates tst
      INNER JOIN public.organization_members om 
        ON tst.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()::text
    )
  );

-- Allow users to manage fields for their own templates
CREATE POLICY "Users can manage fields for own templates"
  ON public.term_sheet_template_fields
  FOR ALL
  TO authenticated
  USING (
    template_id IN (
      SELECT id 
      FROM public.term_sheet_templates
      WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id 
      FROM public.term_sheet_templates
      WHERE user_id = auth.uid()::text
    )
  );

-- Allow org admins to manage fields for all templates in their org
CREATE POLICY "Org admins can manage all template fields"
  ON public.term_sheet_template_fields
  FOR ALL
  TO authenticated
  USING (
    template_id IN (
      SELECT tst.id 
      FROM public.term_sheet_templates tst
      INNER JOIN public.organization_members om 
        ON tst.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT tst.id 
      FROM public.term_sheet_templates tst
      INNER JOIN public.organization_members om 
        ON tst.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()::text
        AND om.role = 'admin'
    )
  );

-- Allow service role full access
CREATE POLICY "Service role full access to term_sheet_template_fields"
  ON public.term_sheet_template_fields
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_term_sheet_template_fields_updated_at
  BEFORE UPDATE ON public.term_sheet_template_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

COMMIT;
