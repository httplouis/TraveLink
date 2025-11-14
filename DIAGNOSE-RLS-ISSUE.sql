-- ===============================================
-- DIAGNOSE RLS ISSUE FOR PROFILE PICTURE UPLOAD
-- ===============================================

-- Step 1: Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Step 2: Check all UPDATE policies
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 3: Check if auth_user_id column exists and has correct data
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'auth_user_id';

-- Step 4: Test query - see if current user can see their own record
-- (Replace 'YOUR_AUTH_USER_ID' with actual auth.uid() value)
-- This simulates what the UPDATE policy checks
SELECT 
  id,
  email,
  auth_user_id,
  avatar_url,
  profile_picture
FROM public.users
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- ===============================================
-- FIX: Ensure RLS is enabled and policy is correct
-- ===============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;

-- Create a single, clear UPDATE policy
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Verify
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'UPDATE';

