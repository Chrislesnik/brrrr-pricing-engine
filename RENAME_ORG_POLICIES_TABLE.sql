-- =====================================================
-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR (DEV ONLY!)
-- =====================================================
-- Renames org_policies to organization_policies
-- =====================================================

BEGIN;

-- Step 1: Rename the table
ALTER TABLE IF EXISTS public.org_policies 
  RENAME TO organization_policies;

-- Step 2: Rename constraints
DO $$
BEGIN
  -- Foreign key constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_policies_org_id_fkey') THEN
    ALTER TABLE public.organization_policies
      RENAME CONSTRAINT org_policies_org_id_fkey 
      TO organization_policies_org_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_policies_created_by_user_id_fkey') THEN
    ALTER TABLE public.organization_policies
      RENAME CONSTRAINT org_policies_created_by_user_id_fkey 
      TO organization_policies_created_by_user_id_fkey;
  END IF;

  -- Unique constraint
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_policies_unique') THEN
    ALTER TABLE public.organization_policies
      RENAME CONSTRAINT org_policies_unique 
      TO organization_policies_unique;
  END IF;

  -- Check constraints
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_policies_resource_type_check') THEN
    ALTER TABLE public.organization_policies
      RENAME CONSTRAINT org_policies_resource_type_check 
      TO organization_policies_resource_type_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_policies_action_check') THEN
    ALTER TABLE public.organization_policies
      RENAME CONSTRAINT org_policies_action_check 
      TO organization_policies_action_check;
  END IF;
END $$;

-- Step 3: Rename index
ALTER INDEX IF EXISTS idx_org_policies_lookup 
  RENAME TO idx_organization_policies_lookup;

-- Step 4: Rename RLS policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'organization_policies'
      AND schemaname = 'public'
      AND policyname LIKE 'org_policies_%'
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON public.organization_policies RENAME TO %I',
      policy_record.policyname,
      replace(policy_record.policyname, 'org_policies_', 'organization_policies_')
    );
    RAISE NOTICE 'Renamed policy: % to %', 
      policy_record.policyname, 
      replace(policy_record.policyname, 'org_policies_', 'organization_policies_');
  END LOOP;
END $$;

-- Step 5: Verification
SELECT 
  'Table renamed successfully' as status,
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'organization_policies'
  AND schemaname = 'public';

-- Check constraints
SELECT 
  'Constraints' as check_type,
  conname as constraint_name
FROM pg_constraint
WHERE conrelid = 'public.organization_policies'::regclass
ORDER BY conname;

-- Check policies
SELECT 
  'RLS Policies' as check_type,
  policyname as policy_name
FROM pg_policies
WHERE tablename = 'organization_policies'
  AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- =====================================================
-- SUCCESS! Table renamed from org_policies to organization_policies
-- 
-- NEXT STEPS:
-- Update application code references from:
--   - "org_policies" → "organization_policies"
-- =====================================================
