-- =====================================================
-- Migration: Fix organization_policies RLS for admins
-- Date: 2026-02-11
-- Description:
--   1. Allow admins (not just owners) to manage policies
--   2. Allow reading global defaults (org_id IS NULL)
-- =====================================================

BEGIN;

-- Fix SELECT: allow reading org-specific AND global defaults
DROP POLICY IF EXISTS "organization_policies_read_own_org" ON public.organization_policies;
CREATE POLICY "organization_policies_read_own_org"
  ON public.organization_policies
  FOR SELECT
  TO authenticated
  USING (org_id = get_active_org_id() OR org_id IS NULL);

-- Fix INSERT: allow admins AND owners
DROP POLICY IF EXISTS "organization_policies_insert_owner_only" ON public.organization_policies;
DROP POLICY IF EXISTS "organization_policies_insert_admin_or_owner" ON public.organization_policies;
CREATE POLICY "organization_policies_insert_admin_or_owner"
  ON public.organization_policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = get_active_org_id()
    AND (is_org_owner(get_active_org_id()) OR is_org_admin(get_active_org_id()))
  );

-- Fix UPDATE: allow admins AND owners
DROP POLICY IF EXISTS "organization_policies_update_owner_only" ON public.organization_policies;
DROP POLICY IF EXISTS "organization_policies_update_admin_or_owner" ON public.organization_policies;
CREATE POLICY "organization_policies_update_admin_or_owner"
  ON public.organization_policies
  FOR UPDATE
  TO authenticated
  USING (
    org_id = get_active_org_id()
    AND (is_org_owner(get_active_org_id()) OR is_org_admin(get_active_org_id()))
  )
  WITH CHECK (
    org_id = get_active_org_id()
    AND (is_org_owner(get_active_org_id()) OR is_org_admin(get_active_org_id()))
  );

-- Fix DELETE: allow admins AND owners
DROP POLICY IF EXISTS "organization_policies_delete_owner_only" ON public.organization_policies;
DROP POLICY IF EXISTS "organization_policies_delete_admin_or_owner" ON public.organization_policies;
CREATE POLICY "organization_policies_delete_admin_or_owner"
  ON public.organization_policies
  FOR DELETE
  TO authenticated
  USING (
    org_id = get_active_org_id()
    AND (is_org_owner(get_active_org_id()) OR is_org_admin(get_active_org_id()))
  );

COMMIT;
