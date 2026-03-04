-- =====================================================
-- Migration: Connect storage buckets to organization_policies
-- Date: 2026-02-11
-- Description:
--   Add check_org_access() enforcement to companies and persons
--   storage buckets. The deals bucket already has fine-grained
--   can_access_document() policies. org-assets is public read.
--
--   This ensures that storage_bucket policies in organization_policies
--   actually affect file access in companies and persons buckets.
-- =====================================================

BEGIN;

-- =====================================================
-- Companies bucket: add org policy check
-- =====================================================
DO $$
BEGIN
  BEGIN
    -- SELECT: must pass org policy check
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_companies_select" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_companies_select"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'companies'
        AND (public.check_org_access('storage_bucket', 'companies', 'select')).allowed
      )$policy$;

    -- INSERT
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_companies_insert" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_companies_insert"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'companies'
        AND (public.check_org_access('storage_bucket', 'companies', 'insert')).allowed
      )$policy$;

    -- UPDATE
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_companies_update" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_companies_update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'companies'
        AND (public.check_org_access('storage_bucket', 'companies', 'update')).allowed
      )
      WITH CHECK (
        bucket_id = 'companies'
        AND (public.check_org_access('storage_bucket', 'companies', 'update')).allowed
      )$policy$;

    -- DELETE
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_companies_delete" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_companies_delete"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'companies'
        AND (public.check_org_access('storage_bucket', 'companies', 'delete')).allowed
      )$policy$;

  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping companies bucket policies due to insufficient privilege';
  END;
END $$;

-- =====================================================
-- Persons bucket: add org policy check
-- =====================================================
DO $$
BEGIN
  BEGIN
    -- SELECT
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_persons_select" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_persons_select"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'persons'
        AND (public.check_org_access('storage_bucket', 'persons', 'select')).allowed
      )$policy$;

    -- INSERT
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_persons_insert" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_persons_insert"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'persons'
        AND (public.check_org_access('storage_bucket', 'persons', 'insert')).allowed
      )$policy$;

    -- UPDATE
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_persons_update" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_persons_update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'persons'
        AND (public.check_org_access('storage_bucket', 'persons', 'update')).allowed
      )
      WITH CHECK (
        bucket_id = 'persons'
        AND (public.check_org_access('storage_bucket', 'persons', 'update')).allowed
      )$policy$;

    -- DELETE
    EXECUTE 'DROP POLICY IF EXISTS "org_policy_storage_persons_delete" ON storage.objects';
    EXECUTE $policy$CREATE POLICY "org_policy_storage_persons_delete"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'persons'
        AND (public.check_org_access('storage_bucket', 'persons', 'delete')).allowed
      )$policy$;

  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping persons bucket policies due to insufficient privilege';
  END;
END $$;

COMMIT;

-- =====================================================
-- Summary:
--   companies bucket: 4 new policies using check_org_access()
--   persons bucket: 4 new policies using check_org_access()
--   deals bucket: unchanged (uses can_access_document())
--   org-assets bucket: unchanged (public read, authenticated write)
-- =====================================================
