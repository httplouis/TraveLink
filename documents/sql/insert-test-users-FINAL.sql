-- ============================================================================
-- INSERT TEST USERS - FINAL VERSION (Based on actual schema)
-- ============================================================================

-- Step 1: Insert into public.users table (linking auth.users)
-- Note: Users must already exist in auth.users (created via Supabase Dashboard)

-- 1. Faculty User
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'John Doe',
    'faculty@mseuf.edu.ph',
    'faculty',
    'CCMS',
    false,
    false,
    false
FROM auth.users au
WHERE au.email = 'faculty@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'faculty',
    department = 'CCMS',
    is_head = false,
    is_hr = false,
    is_exec = false;

-- 2. Department Head
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'Dr. Maria Santos',
    'head.nursing@mseuf.edu.ph',
    'head',
    'CNAHS',
    true,
    false,
    false
FROM auth.users au
WHERE au.email = 'head.nursing@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'head',
    department = 'CNAHS',
    is_head = true,
    is_hr = false,
    is_exec = false;

-- 3. HR Admin
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'HR Administrator',
    'hr.admin@mseuf.edu.ph',
    'hr',
    NULL,
    false,
    true,
    false
FROM auth.users au
WHERE au.email = 'hr.admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'hr',
    is_head = false,
    is_hr = true,
    is_exec = false;

-- 4. Comptroller
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'Finance Officer',
    'comptroller@mseuf.edu.ph',
    'faculty',
    NULL,
    false,
    false,
    false
FROM auth.users au
WHERE au.email = 'comptroller@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'faculty',
    is_head = false,
    is_hr = false,
    is_exec = false;

-- 5. Executive
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'University President',
    'exec.president@mseuf.edu.ph',
    'exec',
    NULL,
    false,
    false,
    true
FROM auth.users au
WHERE au.email = 'exec.president@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'exec',
    is_head = false,
    is_hr = false,
    is_exec = true;

-- 6. Admin
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    department,
    is_head,
    is_hr,
    is_exec
)
SELECT 
    au.id,
    'System Administrator',
    'admin@mseuf.edu.ph',
    'admin',
    NULL,
    false,
    false,
    false
FROM auth.users au
WHERE au.email = 'admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO UPDATE
SET 
    role = 'admin',
    is_head = false,
    is_hr = false,
    is_exec = false;

-- ============================================================================
-- Verify Insertion
-- ============================================================================

SELECT 
    u.name,
    u.email,
    u.role,
    u.department,
    u.is_head,
    u.is_hr,
    u.is_exec,
    u.auth_user_id IS NOT NULL as has_auth_link
FROM public.users u
WHERE u.email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
ORDER BY u.email;

-- Expected output:
-- admin@mseuf.edu.ph        | admin    | NULL  | false  | false  | false  | true
-- comptroller@mseuf.edu.ph  | faculty  | NULL  | false  | false  | false  | true
-- exec.president@...        | exec     | NULL  | false  | false  | true   | true
-- faculty@mseuf.edu.ph      | faculty  | CCMS  | false  | false  | false  | true
-- head.nursing@...          | head     | CNAHS | true   | false  | false  | true
-- hr.admin@mseuf.edu.ph     | hr       | NULL  | false  | true   | false  | true

-- ============================================================================
-- DONE! Now test login
-- ============================================================================
