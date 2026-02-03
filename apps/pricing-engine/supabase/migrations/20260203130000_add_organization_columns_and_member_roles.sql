-- =====================================================
-- Migration: Add organization columns and member roles
-- Date: 2026-02-03
-- Description:
--   - Add is_internal_yn/org_id to organizations
--   - Backfill org_id and enforce NOT NULL + UNIQUE
--   - Rename organization_members.role to clerk_org_role
--   - Add clerk_member_role column
-- =====================================================

BEGIN;

-- Organizations columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_internal_yn bool;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_id bigint;

-- Backfill org_id and enforce NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'organizations_org_id_seq'
  ) THEN
    CREATE SEQUENCE organizations_org_id_seq;
  END IF;

  ALTER TABLE organizations
    ALTER COLUMN org_id SET DEFAULT nextval('organizations_org_id_seq');

  UPDATE organizations
  SET org_id = nextval('organizations_org_id_seq')
  WHERE org_id IS NULL;

  ALTER TABLE organizations
    ALTER COLUMN org_id SET NOT NULL;
END $$;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_org_id_key UNIQUE (org_id);

-- Organization members role changes
ALTER TABLE IF EXISTS organization_members
  RENAME COLUMN "role" TO "clerk_org_role";

ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS clerk_member_role text;

COMMIT;
