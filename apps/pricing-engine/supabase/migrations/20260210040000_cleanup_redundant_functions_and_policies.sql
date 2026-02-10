-- =====================================================
-- Migration: Cleanup redundant functions and legacy policies
-- Date: 2026-02-10
-- Description:
--   1. Drop 3 redundant can_access_* function overloads
--   2. Drop broken RLS policies on legacy "documents" bucket
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Drop broken RLS policies on "documents" bucket FIRST
-- (Must drop before functions because policies depend on them)
-- =====================================================

DROP POLICY IF EXISTS "documents_admin_full_access" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_via_document_files" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_via_document_files" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_via_document_files" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_via_document_files" ON storage.objects;

-- =====================================================
-- PART 2: Drop redundant function overloads
-- (Now safe - dependent policies are gone)
-- =====================================================

-- 2a. Drop can_access_deal_document(uuid, uuid) - wrong 2-arg signature, unused
DROP FUNCTION IF EXISTS public.can_access_deal_document(uuid, uuid);

-- 2b. Drop can_access_deal_document(bigint, bigint, text) - outdated bigint shim
DROP FUNCTION IF EXISTS public.can_access_deal_document(bigint, bigint, text);

-- 2c. Drop can_access_deal_document_by_code(bigint, text, text) - outdated bigint shim
DROP FUNCTION IF EXISTS public.can_access_deal_document_by_code(bigint, text, text);

-- =====================================================
-- Verification
-- =====================================================

-- Verify remaining can_access_* functions (should be 4)
SELECT 
  proname as name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE 'can_access_%'
  AND pronamespace = 'public'::regnamespace
ORDER BY proname, pronargs;

-- Verify no policies remain on documents bucket
SELECT 
  policyname
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'documents_%';

COMMIT;

-- =====================================================
-- Summary:
--
-- DELETED functions:
--   - can_access_deal_document(uuid, uuid) - unused 2-arg overload
--   - can_access_deal_document(bigint, bigint, text) - outdated bigint shim
--   - can_access_deal_document_by_code(bigint, text, text) - outdated bigint shim
--
-- DELETED policies (documents bucket):
--   - documents_admin_full_access
--   - documents_select_via_document_files
--   - documents_insert_via_document_files
--   - documents_update_via_document_files
--   - documents_delete_via_document_files
--
-- REMAINING functions:
--   - can_access_deal_document(uuid, bigint, text) - core RBAC enforcement
--   - can_access_deal_document_by_code(uuid, text, text) - convenience wrapper
--   - can_access_document(bigint, text) - storage RLS entry point
--   - can_access_org_resource(text, text, text) - org policy enforcement
--
-- REMAINING policies (deals bucket):
--   - deals_admin_full_access
--   - deals_select_via_document_files
--   - deals_insert_via_document_files
--   - deals_update_via_document_files
--   - deals_delete_via_document_files
-- =====================================================
