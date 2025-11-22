-- ================================================
-- CREATE DOCUMENTS STORAGE BUCKET AND POLICIES
-- ================================================
-- Run this in Supabase SQL Editor
-- This creates the bucket and sets up policies for file uploads

-- Note: Buckets must be created via Supabase Dashboard or Management API
-- This SQL file sets up the policies only
-- 
-- TO CREATE THE BUCKET:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: documents
-- 4. Public bucket: ✅ YES
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png
-- 7. Click "Create bucket"

-- ================================================
-- Drop existing policies if they exist
-- ================================================
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to documents" ON storage.objects;

-- ================================================
-- Policy 1: Allow INSERT (Upload Files)
-- ================================================
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- ================================================
-- Policy 2: Allow SELECT (Download/View Files)
-- ================================================
CREATE POLICY "Allow public read access to documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- ================================================
-- Policy 3: Allow UPDATE (Update Files)
-- ================================================
CREATE POLICY "Allow authenticated updates to documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- ================================================
-- Policy 4: Allow DELETE (Delete Files)
-- ================================================
CREATE POLICY "Allow authenticated deletes to documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- ================================================
-- Verify policies were created
-- ================================================
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%documents%' OR qual LIKE '%documents%' OR with_check LIKE '%documents%')
ORDER BY policyname;

-- ================================================
-- ✅ DONE! 
-- ================================================
-- After running this:
-- 1. Make sure the 'documents' bucket exists in Supabase Dashboard
-- 2. Try uploading an attachment again
-- 3. Should work now! 🎉

