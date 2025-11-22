-- ============================================
-- FIX ADMIN USERS AND ADD MISSING COLUMNS
-- ============================================
-- Run this in Supabase SQL Editor
-- This will add missing columns and create/update admin users

-- ============================================
-- STEP 1: Check current state
-- ============================================
SELECT 
  'Current Users' as info,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
  COUNT(*) FILTER (WHERE role = 'faculty') as faculty_count,
  COUNT(*) FILTER (WHERE role = 'head') as head_count,
  COUNT(*) FILTER (WHERE is_vp = true) as vp_count,
  COUNT(*) FILTER (WHERE role = 'comptroller') as comptroller_count,
  COUNT(*) FILTER (WHERE is_president = true) as president_count
FROM users;

-- Show all users with their roles (only select columns that exist)
SELECT 
  id, 
  name, 
  email, 
  role, 
  is_head, 
  is_vp, 
  is_president, 
  is_hr,
  is_admin,
  status
FROM users
ORDER BY role, name;

-- ============================================
-- STEP 2: Add missing is_admin column (if it doesn't exist)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = TRUE;
        RAISE NOTICE 'Added is_admin column';
    ELSE
        RAISE NOTICE 'is_admin column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Create or update admin user
-- ============================================
-- OPTION A: Update an existing user to be admin
-- Replace 'your-email@mseuf.edu.ph' with the actual email of the user you want to make admin
-- Uncomment and modify the line below:

-- UPDATE users 
-- SET role = 'admin', is_admin = TRUE
-- WHERE email = 'your-email@mseuf.edu.ph';

-- OPTION B: If you want to create a new admin user
-- First, you need to have the user in auth.users
-- Check if auth user exists:
-- SELECT id, email FROM auth.users WHERE email = 'admin@mseuf.edu.ph';

-- Then create the public.users entry (uncomment and replace AUTH_USER_ID):
/*
INSERT INTO public.users (
  id,
  auth_user_id,
  email,
  name,
  role,
  is_admin,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'AUTH_USER_ID_HERE',  -- Replace with actual auth.users.id from above query
  'admin@mseuf.edu.ph',
  'System Administrator',
  'admin',
  TRUE,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', is_admin = TRUE, updated_at = NOW();
*/

-- ============================================
-- STEP 4: Quick fix - Make first active user an admin (TEMPORARY)
-- ============================================
-- This will make the first active user an admin (use with caution!)
-- Uncomment only if you want to quickly test:
/*
UPDATE users 
SET role = 'admin', is_admin = TRUE
WHERE id = (
  SELECT id FROM users 
  WHERE status = 'active' OR status IS NULL
  ORDER BY created_at ASC
  LIMIT 1
)
RETURNING id, name, email, role, is_admin;
*/

-- ============================================
-- STEP 5: Verify admin users exist
-- ============================================
SELECT 
  'Admin Users' as info,
  id, 
  name, 
  email, 
  role, 
  is_admin,
  status
FROM users 
WHERE role = 'admin' OR is_admin = TRUE
ORDER BY name;

-- ============================================
-- STEP 6: Check all role columns exist
-- ============================================
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND (column_name LIKE 'is_%' OR column_name = 'role')
ORDER BY column_name;

