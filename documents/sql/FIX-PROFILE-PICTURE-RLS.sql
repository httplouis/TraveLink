-- ===============================================
-- Fix RLS Policies for Profile Picture Upload
-- ===============================================
-- This allows users to update their own avatar_url and profile_picture

-- First, check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- ===============================================
-- Option 1: Allow users to update their own profile picture
-- ===============================================

-- Drop existing policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Users can update own profile picture" ON public.users;

-- Create policy to allow users to update their own avatar_url and profile_picture
CREATE POLICY "Users can update own profile picture"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (
  auth.uid() = auth_user_id AND
  (
    -- Allow updating avatar_url
    (avatar_url IS NOT NULL OR avatar_url IS NULL) OR
    -- Allow updating profile_picture
    (profile_picture IS NOT NULL OR profile_picture IS NULL) OR
    -- Allow updating other profile fields
    true
  )
);

-- ===============================================
-- Option 2: More permissive - allow updating any profile fields
-- ===============================================

-- Alternative: Allow users to update their own record (all fields)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- ===============================================
-- Verify the policy was created
-- ===============================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND policyname LIKE '%profile%';

-- ===============================================
-- If RLS is enabled but no policies exist, temporarily disable it
-- (Only use this if policies don't work)
-- ===============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- If needed, you can temporarily disable RLS (NOT RECOMMENDED for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

