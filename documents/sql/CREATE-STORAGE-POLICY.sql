-- ===============================================
-- CREATE STORAGE BUCKET POLICIES FOR PROFILES
-- ===============================================
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- ===============================================
-- Policy 1: Allow INSERT (Upload Files)
-- ===============================================
-- Note: INSERT policies only allow WITH CHECK, not USING
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- ===============================================
-- Policy 2: Allow UPDATE (Update Files)
-- ===============================================
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- ===============================================
-- Policy 3: Allow SELECT (Download/View Files)
-- ===============================================
CREATE POLICY "Allow authenticated downloads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profiles');

-- ===============================================
-- Verify policies were created
-- ===============================================
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%profiles%' OR qual LIKE '%profiles%'
ORDER BY policyname;

-- ===============================================
-- ✅ DONE! Try uploading profile picture again
-- ===============================================

