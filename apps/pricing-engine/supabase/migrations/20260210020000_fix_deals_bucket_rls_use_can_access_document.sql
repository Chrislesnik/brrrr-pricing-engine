-- =====================================================
-- Migration: Fix deals bucket RLS to use can_access_document()
-- Date: 2026-02-10
-- Description:
--   Switch from can_access_deal_document(df.id, ...) which incorrectly
--   passes document_file_id as deal_id, to can_access_document(df.id, action)
--   which correctly handles document-level access and internally resolves
--   deal_ids via document_file_deal_ids().
-- =====================================================

BEGIN;

-- =====================================================
-- Policy 2: Select (View/Download) - FIXED
-- =====================================================
DROP POLICY IF EXISTS "deals_select_via_document_files" ON storage.objects;

CREATE POLICY "deals_select_via_document_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'deals'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'deals'::text)
        AND (df.storage_path = objects.name)
        AND can_access_document(df.id, 'view'::text)
    )
  )
);

-- =====================================================
-- Policy 3: Insert (Upload) - FIXED
-- =====================================================
DROP POLICY IF EXISTS "deals_insert_via_document_files" ON storage.objects;

CREATE POLICY "deals_insert_via_document_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'deals'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'deals'::text)
        AND (df.storage_path = objects.name)
        AND can_access_document(df.id, 'upload'::text)
    )
  )
);

-- =====================================================
-- Policy 4: Update - FIXED
-- =====================================================
DROP POLICY IF EXISTS "deals_update_via_document_files" ON storage.objects;

CREATE POLICY "deals_update_via_document_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'deals'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'deals'::text)
        AND (df.storage_path = objects.name)
        AND can_access_document(df.id, 'upload'::text)
    )
  )
)
WITH CHECK (
  (bucket_id = 'deals'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'deals'::text)
        AND (df.storage_path = objects.name)
        AND can_access_document(df.id, 'upload'::text)
    )
  )
);

-- =====================================================
-- Policy 5: Delete - FIXED
-- =====================================================
DROP POLICY IF EXISTS "deals_delete_via_document_files" ON storage.objects;

CREATE POLICY "deals_delete_via_document_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'deals'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'deals'::text)
        AND (df.storage_path = objects.name)
        AND can_access_document(df.id, 'delete'::text)
    )
  )
);

-- =====================================================
-- Policy 1: Admin Full Access - UNCHANGED (already correct)
-- deals_admin_full_access stays as-is
-- =====================================================

-- Verification
SELECT policyname, cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'deals_%'
ORDER BY policyname;

COMMIT;
