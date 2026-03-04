-- Add RLS policies for lookup/reference tables
-- These tables are used throughout the app and should be readable by all authenticated users

-- deal_role_types table
ALTER TABLE public.deal_role_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read deal_role_types" ON public.deal_role_types;

-- Create policy to allow all authenticated users to read roles
CREATE POLICY "Allow authenticated users to read deal_role_types"
  ON public.deal_role_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to deal_role_types" ON public.deal_role_types;

CREATE POLICY "Service role full access to deal_role_types"
  ON public.deal_role_types
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- document_categories table  
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read document_categories" ON public.document_categories;

-- Create policy to allow all authenticated users to read categories
CREATE POLICY "Allow authenticated users to read document_categories"
  ON public.document_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to document_categories" ON public.document_categories;

CREATE POLICY "Service role full access to document_categories"
  ON public.document_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- document_access_permissions table
ALTER TABLE public.document_access_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read org permissions" ON public.document_access_permissions;
DROP POLICY IF EXISTS "Org admins can manage permissions" ON public.document_access_permissions;

-- Allow users to read permissions for their organization
CREATE POLICY "Users can read org permissions"
  ON public.document_access_permissions
  FOR SELECT
  TO authenticated
  USING (
    clerk_org_id IN (
      SELECT id FROM public.organizations
      WHERE clerk_organization_id = (auth.jwt() -> 'org_id')::text
    )
  );

-- Allow org admins to manage permissions
CREATE POLICY "Org admins can manage permissions"
  ON public.document_access_permissions
  FOR ALL
  TO authenticated
  USING (
    clerk_org_id IN (
      SELECT id FROM public.organizations
      WHERE clerk_organization_id = (auth.jwt() -> 'org_id')::text
    )
    AND public.is_org_admin(clerk_org_id)
  )
  WITH CHECK (
    clerk_org_id IN (
      SELECT id FROM public.organizations
      WHERE clerk_organization_id = (auth.jwt() -> 'org_id')::text
    )
    AND public.is_org_admin(clerk_org_id)
  );

-- Allow service role full access
DROP POLICY IF EXISTS "Service role full access to document_access_permissions" ON public.document_access_permissions;

CREATE POLICY "Service role full access to document_access_permissions"
  ON public.document_access_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
