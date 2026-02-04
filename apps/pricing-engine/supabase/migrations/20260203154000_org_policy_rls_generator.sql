-- =====================================================
-- Migration: Org Policy RLS Generator (Global v1)
-- Date: 2026-02-03
-- Description:
--   - Attach org policy checks to public tables (allow-list driven)
--   - Add storage.objects policies using can_access_org_resource()
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Public table policies (idempotent)
-- =====================================================
DO $$
DECLARE
  target_table record;
  excluded_tables text[] := ARRAY[
    'org_policies',
    'organizations',
    'organization_members',
    'users'
  ];
  action_name text;
  policy_name text;
BEGIN
  FOR target_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> ALL (excluded_tables)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table.tablename);

    -- SELECT policy
    policy_name := 'org_policy_select';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_access_org_resource(''table'',''%s'',''select''))',
        policy_name,
        target_table.tablename,
        target_table.tablename
      );
    END IF;

    -- INSERT policy
    policy_name := 'org_policy_insert';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_org_resource(''table'',''%s'',''insert''))',
        policy_name,
        target_table.tablename,
        target_table.tablename
      );
    END IF;

    -- UPDATE policy
    policy_name := 'org_policy_update';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_access_org_resource(''table'',''%s'',''update'')) WITH CHECK (public.can_access_org_resource(''table'',''%s'',''update''))',
        policy_name,
        target_table.tablename,
        target_table.tablename,
        target_table.tablename
      );
    END IF;

    -- DELETE policy
    policy_name := 'org_policy_delete';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.tablename
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_access_org_resource(''table'',''%s'',''delete''))',
        policy_name,
        target_table.tablename,
        target_table.tablename
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PART 2: Storage policies (idempotent)
-- =====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_policy_storage_select" ON storage.objects;
CREATE POLICY "org_policy_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  public.can_access_org_resource('storage_bucket', bucket_id, 'select')
);

DROP POLICY IF EXISTS "org_policy_storage_insert" ON storage.objects;
CREATE POLICY "org_policy_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_org_resource('storage_bucket', bucket_id, 'insert')
);

DROP POLICY IF EXISTS "org_policy_storage_update" ON storage.objects;
CREATE POLICY "org_policy_storage_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  public.can_access_org_resource('storage_bucket', bucket_id, 'update')
)
WITH CHECK (
  public.can_access_org_resource('storage_bucket', bucket_id, 'update')
);

DROP POLICY IF EXISTS "org_policy_storage_delete" ON storage.objects;
CREATE POLICY "org_policy_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  public.can_access_org_resource('storage_bucket', bucket_id, 'delete')
);

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - Policies are idempotent per table/policy name
-- - Excluded tables can be updated in excluded_tables array
-- - Storage policies coexist with existing policies; remove broader policies if needed
-- =====================================================
