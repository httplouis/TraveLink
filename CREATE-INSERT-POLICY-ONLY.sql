-- ===============================================
-- CREATE INSERT POLICY FOR PROFILES BUCKET
-- ===============================================
-- This is the missing policy for uploading files

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create INSERT policy (only WITH CHECK, no USING for INSERT)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- ===============================================
-- Verify the policy was created
-- ===============================================
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ===============================================
-- ✅ DONE! Now you should have all 3 policies:
-- 1. INSERT (upload)
-- 2. UPDATE (update)
-- 3. SELECT (download)
-- ===============================================

