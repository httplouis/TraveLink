-- ============================================
-- FIX: Add RLS Policy for public.users table
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Policy 1: Admins can view all users
CREATE POLICY "Admin can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin
  auth.email() IN (
    'admin@mseuf.edu.ph',
    'admin.cleofe@mseuf.edu.ph'
  )
);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy 3: Service role can do everything (bypass RLS)
-- This is automatic with service_role key, but we make it explicit
CREATE POLICY "Service role full access"
ON public.users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users';
