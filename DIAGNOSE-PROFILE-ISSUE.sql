-- ============================================
-- DIAGNOSE: Profile Not Found Issue
-- ============================================

-- Check 1: Do we have the requester_name column?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name = 'requester_name';
-- Expected: Should return 1 row

-- Check 2: Check auth.users
SELECT 
  id as auth_id,
  email,
  created_at
FROM auth.users
WHERE email LIKE '%cnahs%' OR email LIKE '%nursing%'
ORDER BY created_at DESC;
-- Should show your test users

-- Check 3: Check public.users and their departments
SELECT 
  u.id,
  u.auth_user_id,
  u.email,
  u.name,
  u.department_id,
  u.is_head,
  d.code as dept_code,
  d.name as dept_name,
  d.parent_department_id
FROM public.users u
LEFT JOIN public.departments d ON u.department_id = d.id
WHERE u.email LIKE '%cnahs%' OR u.email LIKE '%nursing%' OR u.email LIKE '%jose%'
ORDER BY u.created_at DESC;
-- Should show users with their departments

-- Check 4: Orphaned users (have auth but no public profile)
SELECT 
  au.id as auth_id,
  au.email,
  pu.id as public_id
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
WHERE pu.id IS NULL
  AND au.email NOT LIKE '%@supabase%';
-- Should be EMPTY (no orphaned users)

-- Check 5: Check if departments table has parent_department_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'departments' 
  AND column_name = 'parent_department_id';
-- Expected: Should return 1 row if we ran ADD-PARENT-HEAD-SUPPORT.sql

-- Check 6: Check current user's full profile
-- REPLACE 'YOUR_EMAIL_HERE' with the actual email you're logged in as
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  pu.id as public_id,
  pu.name,
  pu.department_id,
  pu.is_head,
  d.code as dept_code,
  d.name as dept_name,
  d.parent_department_id
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
LEFT JOIN public.departments d ON pu.department_id = d.id
WHERE au.email = 'faculty.cnahs@mseuf.edu.ph';  -- Change this to your logged-in email
-- Should return 1 complete row

-- ============================================
-- FIXES (Run only if needed based on checks above)
-- ============================================

-- Fix 1: If requester_name column is missing
-- ALTER TABLE public.requests
-- ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);

-- Fix 2: If public.users entry is missing for an auth user
-- First, get the auth_user_id and department_id
-- Then run:
-- INSERT INTO public.users (auth_user_id, email, name, role, department_id, is_head)
-- VALUES (
--   'AUTH_USER_ID_HERE',
--   'EMAIL_HERE',
--   'NAME_HERE',
--   'faculty',
--   'DEPARTMENT_ID_HERE',
--   false
-- );

-- Fix 3: If department_id is NULL
-- UPDATE public.users 
-- SET department_id = (SELECT id FROM public.departments WHERE code = 'CNAHS')
-- WHERE email = 'faculty.cnahs@mseuf.edu.ph';

-- Fix 4: If parent_department_id column is missing
-- Run ADD-PARENT-HEAD-SUPPORT.sql
