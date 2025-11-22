-- ============================================
-- CREATE ACCOUNT FOR MAAM TRIZZIA MAREE CASINO
-- Run this in Supabase SQL Editor
-- ============================================
-- STEP 1: CREATE AUTH USER FIRST
-- ============================================
-- Create this in Supabase Dashboard > Authentication > Users > Add User
-- OR use this SQL to create directly:

INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'casinotrizzia@mseuf.edu.ph',
  crypt('Trizzia@2024', gen_salt('bf')),  -- Temporary password: Trizzia@2024
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Verify auth user created
SELECT id, email, email_confirmed_at
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- STEP 2: INSERT INTO PUBLIC.USERS TABLE
-- ============================================
-- This links the auth user to the application users table

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
  'admin',                        -- Admin role for Transport/Treasury Office
  'Treasury Department',          -- Department name (not ID)
  false,
  false,
  false
FROM auth.users au 
WHERE au.email = 'casinotrizzia@mseuf.edu.ph'
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  auth_user_id = EXCLUDED.auth_user_id;

-- ============================================
-- STEP 3: VERIFY USER CREATED
-- ============================================

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

-- Expected output:
-- Name: Trizzia Maree Casino
-- Email: casinotrizzia@mseuf.edu.ph
-- Role: admin
-- Department: Treasury Department
-- Temporary password: Trizzia@2024

-- ============================================
-- ✅ DONE!
-- ============================================
-- The account is now created and Maam Trizzia can login with:
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024 (she should change this after first login)
