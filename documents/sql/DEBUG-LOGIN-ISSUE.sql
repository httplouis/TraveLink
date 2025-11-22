-- ============================================
-- DEBUG LOGIN ISSUE
-- ============================================

-- 1. Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if Trizzia's record exists and which ID column it uses
SELECT * FROM public.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- 3. Check auth user ID
SELECT id, email FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- 4. Test the exact query from login route
SELECT id, role, department, is_head, is_hr, is_exec
FROM public.users
WHERE auth_user_id = '28ae63b0-fb91-4710-a77f-2fac3bb224e0';

-- 5. Alternative: try with just 'id' column
SELECT id, role, department, is_head, is_hr, is_exec
FROM public.users
WHERE id = '28ae63b0-fb91-4710-a77f-2fac3bb224e0';

-- 6. Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- ============================================
-- ✅ Based on results, we'll know which column to use
-- ============================================
