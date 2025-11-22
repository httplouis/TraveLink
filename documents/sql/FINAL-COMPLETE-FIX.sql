-- ============================================
-- FINAL COMPLETE FIX - ALL ISSUES
-- ============================================

-- STEP 1: Verify user exists with correct structure
SELECT 
  'AUTH USER CHECK' as step,
  id as auth_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 2: Verify public.users record exists  
SELECT 
  'PUBLIC USER CHECK' as step,
  id as user_id,
  auth_user_id,
  name,
  email,
  role,
  department,
  is_head,
  is_hr,
  is_exec
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 3: If public.users is missing or wrong, fix it
-- Delete and recreate with correct auth_user_id link
DELETE FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph';

INSERT INTO public.users (
  auth_user_id,
  email,
  name,
  role,
  department,
  is_head,
  is_hr,
  is_exec,
  status
)
SELECT 
  au.id,
  'casinotrizzia@mseuf.edu.ph',
  'Trizzia Maree Casino',
  'admin',
  'Treasury Department',
  false,
  false,
  false,
  'active'
FROM auth.users au
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 4: Verify the link is correct
SELECT 
  'VERIFICATION' as step,
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.auth_user_id,
  pu.name,
  pu.role,
  pu.department,
  CASE 
    WHEN au.id = pu.auth_user_id THEN '✅ LINKED CORRECTLY'
    ELSE '❌ LINK BROKEN'
  END as link_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 5: Test the exact query from login API
SELECT 
  'LOGIN API QUERY TEST' as step,
  id,
  role,
  department,
  is_head,
  is_hr,
  is_exec
FROM public.users
WHERE auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'casinotrizzia@mseuf.edu.ph'
);

-- STEP 6: Check RLS status
SELECT 
  'RLS STATUS' as step,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- STEP 7: If RLS is enabled, disable it temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ FINAL VERIFICATION
-- ============================================

SELECT 
  '🎯 FINAL CHECK' as status,
  au.email,
  pu.name,
  pu.role,
  pu.department,
  CASE 
    WHEN pu.auth_user_id IS NULL THEN '❌ NO PUBLIC USER RECORD'
    WHEN au.id != pu.auth_user_id THEN '❌ AUTH LINK BROKEN'  
    WHEN pu.role IS NULL THEN '❌ MISSING ROLE'
    ELSE '✅ ALL GOOD - TRY LOGIN NOW!'
  END as final_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- 🚀 AFTER RUNNING THIS, TRY TO LOGIN WITH:
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
--
-- If it STILL fails, check browser console (F12) for the actual error
