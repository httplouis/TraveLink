-- ===============================================
-- FIX: Allow Users to Update Their Own Profile Picture
-- SAFE VERSION - No DROP statements
-- ===============================================

-- Step 1: Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create UPDATE policy
-- Note: PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY
-- So we drop it first if it exists, then create it
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- This allows users to update their own profile picture and other profile fields
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Step 3: Verify the policy was created
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'UPDATE'
ORDER BY policyname;

-- ===============================================
-- ✅ DONE! Try uploading profile picture again
-- ===============================================

