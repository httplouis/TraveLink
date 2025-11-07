-- ============================================
-- COMPLETE FIX FOR TRIZZIA ACCOUNT
-- ============================================

-- STEP 1: Check current state
SELECT '=== AUTH.USERS ===' as check_type;
SELECT id, email, email_confirmed_at, role, created_at
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

SELECT '=== PUBLIC.USERS ===' as check_type;
SELECT * FROM public.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- STEP 2: Check the public.users table structure
SELECT '=== TABLE STRUCTURE ===' as check_type;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- STEP 3: DELETE OLD ENTRY IF EXISTS (to clean up)
-- ============================================
DELETE FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- STEP 4: INSERT FRESH ENTRY INTO PUBLIC.USERS
-- ============================================

-- Check what columns exist first
DO $$
DECLARE
  has_auth_user_id BOOLEAN;
  has_id BOOLEAN;
  has_department_id BOOLEAN;
  user_auth_id UUID;
BEGIN
  -- Check column existence
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) INTO has_auth_user_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
  ) INTO has_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'department_id'
  ) INTO has_department_id;
  
  -- Get auth user id
  SELECT id INTO user_auth_id FROM auth.users WHERE email = 'casinotrizzia@mseuf.edu.ph';
  
  RAISE NOTICE 'Auth User ID: %', user_auth_id;
  RAISE NOTICE 'Has auth_user_id column: %', has_auth_user_id;
  RAISE NOTICE 'Has id column: %', has_id;
  RAISE NOTICE 'Has department_id column: %', has_department_id;
  
  -- Insert based on schema
  IF has_auth_user_id THEN
    -- Schema with auth_user_id and department as VARCHAR
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
      user_auth_id,
      'casinotrizzia@mseuf.edu.ph',
      'Trizzia Maree Casino',
      'admin',
      'Treasury Department',
      false,
      false,
      false
    );
    RAISE NOTICE 'Inserted with auth_user_id schema';
  ELSIF has_id AND has_department_id THEN
    -- Schema with id = auth_user_id and department_id as UUID
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      department_id
    ) 
    SELECT 
      user_auth_id,
      'casinotrizzia@mseuf.edu.ph',
      'Trizzia Maree Casino',
      'admin',
      d.id
    FROM public.departments d
    WHERE d.name = 'Treasury Department' OR d.code = 'TRES'
    LIMIT 1;
    RAISE NOTICE 'Inserted with id/department_id schema';
  ELSE
    RAISE EXCEPTION 'Unknown schema structure';
  END IF;
END $$;

-- ============================================
-- STEP 5: VERIFY COMPLETE SETUP
-- ============================================

SELECT '=== FINAL VERIFICATION ===' as check_type;

-- Full join to see both tables
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.role as auth_role,
  pu.email as public_email,
  pu.name,
  pu.role as app_role,
  COALESCE(pu.department, d.name) as department
FROM auth.users au
LEFT JOIN public.users pu ON (au.id = pu.auth_user_id OR au.id = pu.id)
LEFT JOIN public.departments d ON pu.department_id = d.id
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ CREDENTIALS FOR LOGIN
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: trizzia@2U24 (or whatever you set in Supabase Dashboard)
-- 
-- If login still fails, reset password via:
-- Supabase Dashboard > Authentication > Users > 
-- Find casinotrizzia@mseuf.edu.ph > Menu (3 dots) > Send password reset
