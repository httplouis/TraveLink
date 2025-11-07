-- ============================================
-- TEMPORARY: DISABLE RLS FOR TESTING
-- (Re-enable after fixing the issue!)
-- ============================================

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- ============================================
-- ✅ NOW TRY LOGGING IN!
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph  
-- Password: Trizzia@2024

-- If login works, the issue was RLS policies
-- Then we'll create proper policies and re-enable RLS
