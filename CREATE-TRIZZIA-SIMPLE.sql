-- ============================================
-- CREATE ACCOUNT FOR MAAM TRIZZIA - SIMPLE VERSION
-- ============================================

-- ============================================
-- OPTION 1: Create via Supabase Dashboard (RECOMMENDED)
-- ============================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" (or "Invite User")
-- 3. Fill in:
--    Email: casinotrizzia@mseuf.edu.ph
--    Password: Trizzia@2024
--    Auto Confirm User: ✓ (check this)
-- 4. Click "Create User"
-- 5. Copy the user ID that was created
-- 6. Then run STEP 2 below

-- ============================================
-- OPTION 2: Create via SQL (if you have pgcrypto extension)
-- ============================================
-- Only run this if Option 1 doesn't work

-- Check if user already exists
SELECT id, email FROM auth.users WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- If no user found, create new auth user
-- Note: Remove ON CONFLICT to see actual error if any
INSERT INTO auth.users (
  id, 
  instance_id,
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'casinotrizzia@mseuf.edu.ph',
  crypt('Trizzia@2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Trizzia Maree Casino"}',
  'authenticated',
  'authenticated',
  '',
  '',
  ''
);

-- Verify auth user was created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- STEP 2: INSERT INTO PUBLIC.USERS TABLE
-- ============================================
-- Run this AFTER creating auth user (via Option 1 or 2)

INSERT INTO public.users (
  auth_user_id,
  email,
  name,
  role,
  department,
  is_head,
  is_hr,
  is_exec
)
SELECT 
  au.id,
  'casinotrizzia@mseuf.edu.ph',
  'Trizzia Maree Casino',
  'admin',
  'Treasury Department',
  false,
  false,
  false
FROM auth.users au 
WHERE au.email = 'casinotrizzia@mseuf.edu.ph'
AND NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.email = 'casinotrizzia@mseuf.edu.ph'
);

-- ============================================
-- STEP 3: VERIFY ACCOUNT CREATED
-- ============================================

-- Check auth user
SELECT id, email, email_confirmed_at, role
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Check public user
SELECT 
  u.auth_user_id,
  u.email,
  u.name,
  u.role,
  u.department,
  u.is_head,
  u.is_hr,
  u.is_exec
FROM public.users u
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ LOGIN CREDENTIALS
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
-- Department: Treasury Department
-- Role: admin
