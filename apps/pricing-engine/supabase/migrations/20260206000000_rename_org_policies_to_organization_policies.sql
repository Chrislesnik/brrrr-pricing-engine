-- =====================================================
-- Migration: Rename org_policies to organization_policies
-- Date: 2026-02-06
-- Description: Rename table for consistency with other table naming
-- Risk Level: LOW
-- Note: All renames are fully idempotent — safe if already applied
-- =====================================================

BEGIN;

-- Rename the table (IF EXISTS handles already-renamed case)
ALTER TABLE IF EXISTS public.org_policies 
  RENAME TO organization_policies;

-- Rename constraints (idempotent: skip if old name doesn't exist)
DO $$ BEGIN
  ALTER TABLE public.organization_policies
    RENAME CONSTRAINT org_policies_org_id_fkey 
    TO organization_policies_org_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.organization_policies
    RENAME CONSTRAINT org_policies_unique 
    TO organization_policies_unique;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.organization_policies
    RENAME CONSTRAINT org_policies_created_by_user_id_fkey 
    TO organization_policies_created_by_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.organization_policies
    RENAME CONSTRAINT org_policies_resource_type_check 
    TO organization_policies_resource_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.organization_policies
    RENAME CONSTRAINT org_policies_action_check 
    TO organization_policies_action_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Rename the index (IF EXISTS handles already-renamed case)
ALTER INDEX IF EXISTS idx_org_policies_lookup 
  RENAME TO idx_organization_policies_lookup;

-- Rename RLS policies (idempotent: skip if target name already exists)
DO $$ BEGIN
  ALTER POLICY "org_policies_read_own_org" 
    ON public.organization_policies 
    RENAME TO "organization_policies_read_own_org";
EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER POLICY "org_policies_insert_owner_only" 
    ON public.organization_policies 
    RENAME TO "organization_policies_insert_owner_only";
EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER POLICY "org_policies_update_owner_only" 
    ON public.organization_policies 
    RENAME TO "organization_policies_update_owner_only";
EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER POLICY "org_policies_delete_owner_only" 
    ON public.organization_policies 
    RENAME TO "organization_policies_delete_owner_only";
EXCEPTION WHEN undefined_object OR duplicate_object THEN NULL;
END $$;

-- Verify
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'organization_policies';

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - Table renamed from org_policies to organization_policies
-- - All constraints renamed for consistency (idempotent)
-- - Index renamed
-- - RLS policies renamed
-- - Application code will need updates to reference new table name
-- =====================================================
