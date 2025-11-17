-- ============================================
-- SETUP SUPER ADMIN ACCOUNT
-- ============================================
-- Run this in Supabase SQL Editor
-- This ensures your super admin account is properly configured

-- Step 1: Check current super admin account status
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_admin,
  a.user_id as admin_table_user_id,
  a.super_admin,
  CASE 
    WHEN u.role = 'admin' AND u.is_admin = true AND a.super_admin = true THEN '✅ Super Admin (Correct)'
    WHEN u.role = 'admin' AND u.is_admin = true AND (a.super_admin = false OR a.super_admin IS NULL) THEN '⚠️ Regular Admin (needs super_admin = true)'
    WHEN u.role = 'admin' AND u.is_admin = false THEN '⚠️ Admin role but is_admin flag is false'
    WHEN a.user_id IS NULL THEN '⚠️ No entry in admins table'
    ELSE '❌ Not configured as admin'
  END as status
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email LIKE '%superadmin%' OR u.email = 'superadmin@mseuf.edu.ph'
ORDER BY u.email;

-- Step 2: Find your super admin account email
-- Replace 'your-email@mseuf.edu.ph' with your actual super admin email
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_admin,
  a.super_admin
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'your-email@mseuf.edu.ph';  -- Replace with your email

-- Step 3: Setup super admin (replace 'your-email@mseuf.edu.ph' with your actual email)
-- First, ensure entry in admins table with super_admin = true
INSERT INTO public.admins (user_id, super_admin)
SELECT 
  id,
  true  -- Set to true for super admin
FROM public.users
WHERE email = 'your-email@mseuf.edu.ph'  -- Replace with your email
ON CONFLICT (user_id) DO UPDATE SET super_admin = true;

-- Step 4: Ensure role and is_admin flag are correct
UPDATE public.users
SET 
  role = 'admin',
  is_admin = true
WHERE email = 'your-email@mseuf.edu.ph'  -- Replace with your email
AND (role != 'admin' OR is_admin != true);

-- Step 5: Verify super admin setup
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_admin,
  a.super_admin,
  CASE 
    WHEN u.role = 'admin' AND u.is_admin = true AND a.super_admin = true THEN '✅ SUPER ADMIN READY!'
    ELSE '❌ Setup incomplete'
  END as status
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'your-email@mseuf.edu.ph';  -- Replace with your email

-- ============================================
-- ✅ DONE! Your super admin account is ready
-- ============================================
-- You should now:
-- 1. Logout and login again
-- 2. Be redirected to /super-admin
-- 3. See "Super Admin" badge in users page
-- 4. NOT appear in approvers list (super admins are excluded)

