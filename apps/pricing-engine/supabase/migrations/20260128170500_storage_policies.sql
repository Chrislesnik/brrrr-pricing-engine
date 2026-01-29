-- =====================================================
-- Migration 7: Storage Policies for Documents Bucket
-- Date: 2026-01-28
-- Description: Create storage policies for documents bucket
-- Dependencies: 
--   - Migration 3 (document_files table)
--   - Migration 6 (helper functions)
--   - MANUAL: documents storage bucket must exist
-- Breaking Changes: None
-- Risk Level: LOW
-- =====================================================

-- ⚠️  IMPORTANT: PREREQUISITE ⚠️
-- Before running this migration, you MUST manually create the storage bucket:
--
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Configure:
--    - Name: "documents"
--    - Public: NO (unchecked)
--    - File size limit: 50 MB
--    - Allowed MIME types: application/pdf, image/*, text/*, application/zip
-- 4. Click "Create bucket"
--
-- If the bucket doesn't exist, this migration will fail.

BEGIN;

-- =====================================================
-- Verify dependencies
-- =====================================================
DO $$
BEGIN
  -- Check document_files table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'document_files'
  ) THEN
    RAISE EXCEPTION 'Migration 7 failed: document_files table not found. Run Migration 3 first.';
  END IF;
  
  -- Check helper functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_internal_admin'
  ) THEN
    RAISE EXCEPTION 'Migration 7 failed: is_internal_admin() function not found. Run Migration 6 first.';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'can_access_deal_document'
  ) THEN
    RAISE EXCEPTION 'Migration 7 failed: can_access_deal_document() function not found. Run Migration 6 first.';
  END IF;
  
  -- Check storage bucket exists (query storage.buckets)
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'documents'
  ) THEN
    RAISE EXCEPTION 'Migration 7 failed: documents storage bucket not found. Please create it manually via Supabase Dashboard before running this migration. See migration file comments for instructions.';
  END IF;
  
  RAISE NOTICE 'All dependencies verified, proceeding with storage policies creation';
END $$;

-- =====================================================
-- Storage Policy 1: Admin Full Access
-- Allows internal admins to perform any operation on documents
-- =====================================================
DROP POLICY IF EXISTS "documents_admin_full_access" ON storage.objects;

CREATE POLICY "documents_admin_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  (bucket_id = 'documents'::text) AND is_internal_admin()
)
WITH CHECK (
  (bucket_id = 'documents'::text) AND is_internal_admin()
);

-- =====================================================
-- Storage Policy 2: Select (View/Download) via document_files
-- Allows users to view/download documents if authorized
-- =====================================================
DROP POLICY IF EXISTS "documents_select_via_document_files" ON storage.objects;

CREATE POLICY "documents_select_via_document_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (bucket_id = 'documents'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents'::text) 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- Using document file ID as deal ID for now - adjust based on your schema
          df.document_category_id, 
          'view'::text
        )
    )
  )
);

-- =====================================================
-- Storage Policy 3: Insert (Upload) via document_files
-- Allows users to upload documents if authorized
-- =====================================================
DROP POLICY IF EXISTS "documents_insert_via_document_files" ON storage.objects;

CREATE POLICY "documents_insert_via_document_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'documents'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents'::text) 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- Using document file ID as deal ID for now - adjust based on your schema
          df.document_category_id, 
          'upload'::text
        )
    )
  )
);

-- =====================================================
-- Storage Policy 4: Update via document_files
-- Allows users to update documents if authorized
-- =====================================================
DROP POLICY IF EXISTS "documents_update_via_document_files" ON storage.objects;

CREATE POLICY "documents_update_via_document_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (bucket_id = 'documents'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents'::text) 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- Using document file ID as deal ID for now - adjust based on your schema
          df.document_category_id, 
          'upload'::text
        )
    )
  )
)
WITH CHECK (
  (bucket_id = 'documents'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents'::text) 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- Using document file ID as deal ID for now - adjust based on your schema
          df.document_category_id, 
          'upload'::text
        )
    )
  )
);

-- =====================================================
-- Storage Policy 5: Delete via document_files
-- Allows users to delete documents if authorized
-- =====================================================
DROP POLICY IF EXISTS "documents_delete_via_document_files" ON storage.objects;

CREATE POLICY "documents_delete_via_document_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (bucket_id = 'documents'::text) AND (
    EXISTS (
      SELECT 1
      FROM document_files df
      WHERE (df.storage_bucket = 'documents'::text) 
        AND (df.storage_path = objects.name) 
        AND can_access_deal_document(
          df.id,  -- Using document file ID as deal ID for now - adjust based on your schema
          df.document_category_id, 
          'delete'::text
        )
    )
  )
);

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
  v_policy_count integer;
BEGIN
  -- Count policies created on storage.objects for documents bucket
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'documents_%';
  
  IF v_policy_count < 5 THEN
    RAISE EXCEPTION 'Migration 7 failed: Expected 5 policies, found %', v_policy_count;
  END IF;
  
  RAISE NOTICE 'Migration 7 completed successfully (% storage policies created)', v_policy_count;
END $$;

COMMIT;

-- =====================================================
-- Post-migration notes:
-- - 5 storage policies created for documents bucket:
--   1. Admin full access (all operations)
--   2. Select/view access via can_access_deal_document()
--   3. Insert/upload access via can_access_deal_document()
--   4. Update access via can_access_deal_document()
--   5. Delete access via can_access_deal_document()
-- - All policies check document_files table for authorization
-- - Policies use can_access_deal_document() which needs business logic implementation
-- - NOTE: Policies currently use df.id as deal_id - adjust this based on your schema
--   (you may need to add a deal_id column to document_files table)
-- - Test document upload/download after implementing access control logic
-- =====================================================
