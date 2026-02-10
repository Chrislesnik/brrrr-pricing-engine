-- =====================================================
-- Copy RLS policies from "documents" bucket to "deals" bucket
-- =====================================================
-- Run this in Supabase Dashboard SQL Editor (DEV only)
-- =====================================================

BEGIN;

-- =====================================================
-- Policy 1: Admin Full Access on "deals" bucket
-- =====================================================
DROP POLICY IF EXISTS "deals_admin_full_access" ON storage.objects;

CREATE POLICY "deals_admin_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  (bucket_id = 'deals'::text) AND is_internal_admin()
)
WITH CHECK (
  (bucket_id = 'deals'::text) AND is_internal_admin()
);

-- =====================================================
-- Policy 2: Select (View/Download) via document_files
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
        AND can_access_deal_document(
          df.id,
          df.document_category_id, 
          'view'::text
        )
    )
  )
);

-- =====================================================
-- Policy 3: Insert (Upload) via document_files
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
        AND can_access_deal_document(
          df.id,
          df.document_category_id, 
          'upload'::text
        )
    )
  )
);

-- =====================================================
-- Policy 4: Update via document_files
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
        AND can_access_deal_document(
          df.id,
          df.document_category_id, 
          'upload'::text
        )
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
        AND can_access_deal_document(
          df.id,
          df.document_category_id, 
          'upload'::text
        )
    )
  )
);

-- =====================================================
-- Policy 5: Delete via document_files
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
        AND can_access_deal_document(
          df.id,
          df.document_category_id, 
          'delete'::text
        )
    )
  )
);

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'deals_%'
ORDER BY policyname;

-- Expected: 5 policies
-- deals_admin_full_access        | ALL
-- deals_delete_via_document_files | DELETE
-- deals_insert_via_document_files | INSERT
-- deals_select_via_document_files | SELECT
-- deals_update_via_document_files | UPDATE

COMMIT;
