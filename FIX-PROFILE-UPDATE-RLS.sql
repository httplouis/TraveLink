-- ===============================================
-- FIX: Allow Users to Update Their Own Profile Picture
-- ===============================================
-- Run this in Supabase SQL Editor

-- Step 1: Check current policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ===============================================
-- Step 2: Create UPDATE Policy for Profile Picture
-- ===============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile picture" ON public.users;

-- Create policy to allow users to update their own profile
-- This allows updating avatar_url, profile_picture, and other profile fields
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- ===============================================
-- Step 3: Verify the policy was created
-- ===============================================

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

