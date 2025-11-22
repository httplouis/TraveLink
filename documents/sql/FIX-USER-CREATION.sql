-- ============================================
-- FIX USER CREATION ISSUE
-- ============================================

-- STEP 1: Check if user already exists
SELECT email FROM auth.users WHERE email = 'casinotrizzia@mseuf.edu.ph';
SELECT email FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 2: Check RLS policies on users table
SELECT * FROM pg_policies WHERE tablename = 'users';

-- STEP 3: Temporarily disable RLS for user creation (ADMIN ONLY)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 4: Check if there are any triggers
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'public.users'::regclass;

-- ============================================
-- ALTERNATIVE: CREATE USER VIA SQL DIRECTLY
-- ============================================

-- First, make sure email doesn't exist
DELETE FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph';
DELETE FROM auth.users WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Create via Supabase Auth API wrapper (if available)
-- Or use this simpler INSERT without the problematic fields

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users with minimal fields
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
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'casinotrizzia@mseuf.edu.ph',
    crypt('Trizzia@2024', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- Insert into public.users
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    department,
    is_head,
    is_hr,
    is_exec
  ) VALUES (
    new_user_id,
    'casinotrizzia@mseuf.edu.ph',
    'Trizzia Maree Casino',
    'admin',
    'Treasury Department',
    false,
    false,
    false
  );

  RAISE NOTICE 'User created with ID: %', new_user_id;
END $$;

-- STEP 5: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify user was created
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.role as auth_role,
  pu.name,
  pu.role as app_role,
  pu.department
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ If successful, login credentials:
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
