-- Run this to verify deals bucket policies were created
SELECT policyname, cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'deals_%'
ORDER BY policyname;
