-- ============================================
-- FIX RLS POLICIES FOR LOGIN
-- ============================================

-- Check current RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users';

-- ============================================
-- Add policy to allow users to read their own profile after login
-- ============================================

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to read own data" ON public.users;

-- Create a policy that allows authenticated users to read their own profile
CREATE POLICY "Users can read own profile during login"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Also allow service role (for admin operations)
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================
-- TEST THE LOGIN QUERY
-- ============================================
-- This simulates what the login route does

-- First, authenticate (this would normally happen via Supabase Auth)
-- Then try to query the profile
SELECT id, role, department, is_head, is_hr, is_exec
FROM public.users
WHERE auth_user_id = '28ae63b0-fb91-4710-a77f-2fac3bb224e0'; -- Trizzia's auth ID

-- If this returns data, RLS is working!
-- If empty or error, RLS is blocking

-- ============================================
-- ✅ After running this, try logging in again!
-- ============================================
