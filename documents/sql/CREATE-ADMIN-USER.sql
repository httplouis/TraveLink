-- ============================================
-- CREATE ADMIN USER FOR TRAVILINK
-- ============================================
-- This script helps you create an admin user or check existing users
-- Run this in Supabase SQL Editor

-- 1. Check all existing users and their roles
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

-- 2. Check if there are any users that could be admins
SELECT 
  id, 
  name, 
  email, 
  role,
  status
FROM users
WHERE role IN ('admin', 'faculty', 'staff')
ORDER BY role;

-- 3. OPTION A: Update an existing user to be admin
-- Replace 'user@example.com' with the email of the user you want to make admin
-- UPDATE users 
-- SET role = 'admin'
-- WHERE email = 'user@example.com';

-- 4. OPTION B: Create a new admin user (if you have auth.users entry)
-- First, check if auth user exists:
-- SELECT id, email FROM auth.users WHERE email = 'admin@mseuf.edu.ph';

-- Then create the public.users entry (replace the auth_user_id with actual ID from above):
-- INSERT INTO public.users (
--   id,
--   auth_user_id,
--   email,
--   name,
--   role,
--   status,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'AUTH_USER_ID_FROM_ABOVE',  -- Replace with actual auth.users.id
--   'admin@mseuf.edu.ph',
--   'System Administrator',
--   'admin',
--   'active',
--   NOW(),
--   NOW()
-- );

-- 5. Verify admin was created/updated
-- SELECT id, name, email, role, status 
-- FROM users 
-- WHERE role = 'admin';
