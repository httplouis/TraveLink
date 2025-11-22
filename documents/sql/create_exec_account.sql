-- Create Executive Test Account
-- Run this in Supabase SQL Editor

-- 1. First, create the auth user (if not exists)
-- You'll need to do this in Supabase Dashboard > Authentication > Users > Add User
-- OR run this SQL:

-- Create auth user with email and password
-- Note: This requires Supabase admin privileges
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
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'exec@mseuf.edu.ph',
  crypt('exec123', gen_salt('bf')), -- bcrypt hash
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 2. Get the auth user ID (run this to find the UUID)
SELECT id, email FROM auth.users WHERE email = 'exec@mseuf.edu.ph';

-- 3. Create the executive user in the users table
-- Replace <AUTH_USER_ID> with the UUID from step 2
INSERT INTO public.users (
  auth_user_id,
  email,
  name,
  role
) VALUES (
  '<AUTH_USER_ID>', -- Replace this with the actual UUID from step 2
  'exec@mseuf.edu.ph',
  'Dr. Executive Officer',
  'executive'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- 4. Verify the account was created
SELECT u.id, u.email, u.name, u.role, u.auth_user_id
FROM public.users u
WHERE u.email = 'exec@mseuf.edu.ph';
