-- =====================================================
-- CHECK: Storage Bucket Configuration
-- =====================================================
-- Run this in Supabase Dashboard SQL Editor
-- to see all storage buckets and their settings
-- =====================================================

-- 1. List all storage buckets with configuration
SELECT 
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  avif_autodetection,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY created_at;

-- 2. Count objects per bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- 3. Check storage policies per bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- 4. Recent uploads (last 20)
SELECT 
  name as file_path,
  bucket_id,
  owner,
  created_at,
  pg_size_pretty((metadata->>'size')::bigint) as file_size,
  metadata->>'mimetype' as mime_type
FROM storage.objects
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- Expected Buckets:
-- - documents (private)
-- - broker-assets (public)
-- - credit-reports (private)
-- - program-docs (private)
-- - deals (private) - if created
-- =====================================================
