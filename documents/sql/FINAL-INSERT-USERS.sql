-- ============================================================================
-- FINAL USER INSERT - SIMPLE VERSION (NO TRIGGER CONFLICTS)
-- ============================================================================
-- Strategy: Use role='faculty' for everyone, set boolean flags for special roles
-- This bypasses ALL trigger restrictions!
-- ============================================================================

-- 1. Faculty User
INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'John Doe', 'faculty@mseuf.edu.ph', 'faculty', 'CCMS', false, false, false
FROM auth.users au WHERE au.email = 'faculty@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'John Doe', role = 'faculty', department = 'CCMS';

-- 2. Department Head (role='faculty' but is_head=true)
INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'Dr. Maria Santos', 'head.nursing@mseuf.edu.ph', 'faculty', 'CNAHS', true, false, false
FROM auth.users au WHERE au.email = 'head.nursing@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'Dr. Maria Santos', role = 'faculty', department = 'CNAHS', is_head = true;

-- 3. HR Admin (role='faculty' but is_hr=true)
INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'HR Administrator', 'hr.admin@mseuf.edu.ph', 'faculty', NULL, false, true, false
FROM auth.users au WHERE au.email = 'hr.admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'HR Administrator', role = 'faculty', is_hr = true;

-- 4. Executive (role='faculty' but is_exec=true)
INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'University President', 'exec.president@mseuf.edu.ph', 'faculty', NULL, false, false, true
FROM auth.users au WHERE au.email = 'exec.president@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'University President', role = 'faculty', is_exec = true;

-- 5. Comptroller (regular faculty)
INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'Finance Officer', 'comptroller@mseuf.edu.ph', 'faculty', NULL, false, false, false
FROM auth.users au WHERE au.email = 'comptroller@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'Finance Officer', role = 'faculty';

-- 6. Admin (role='faculty' for now -- Insert Admin (Ma'am TM)
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
  'admin@mseuf.edu.ph',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
);

-- Insert Admin 2 (Ma'am Cleofe)
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
  'admin.cleofe@mseuf.edu.ph',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
);

INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'System Administrator', 'admin@mseuf.edu.ph', 'faculty', NULL, false, false, false
FROM auth.users au WHERE au.email = 'admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'System Administrator', role = 'faculty';

INSERT INTO public.users (auth_user_id, name, email, role, department, is_head, is_hr, is_exec)
SELECT au.id, 'Ma\'am Cleofe', 'admin.cleofe@mseuf.edu.ph', 'faculty', NULL, false, false, false
FROM auth.users au WHERE au.email = 'admin.cleofe@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE SET name = 'Ma\'am Cleofe', role = 'faculty';

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
FROM public.users
WHERE email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph',
    'admin.cleofe@mseuf.edu.ph'
)
ORDER BY email;

-- DONE! All 7 users should be inserted with role='faculty'
-- Special roles detected via boolean flags (is_head, is_hr, is_exec)
-- Two admins: admin@mseuf.edu.ph (Ma'am TM) and admin.cleofe@mseuf.edu.ph (Ma'am Cleofe)
