-- ============================================================================
-- CREATE TEST USERS FOR TRAVILINK
-- Run this in Supabase SQL Editor to create test accounts
-- ============================================================================

-- NOTE: Supabase Auth users are usually created via Dashboard or API
-- This is a WORKAROUND for development only

-- ============================================================================
-- OPTION 1: Manual Creation (RECOMMENDED)
-- ============================================================================
-- Go to Supabase Dashboard → Authentication → Users → "Add User"
-- Create each user manually with these details:

-- 1. Faculty:
--    Email: faculty@mseuf.edu.ph
--    Password: Test@123
--    Auto Confirm: YES

-- 2. Department Head:
--    Email: head.nursing@mseuf.edu.ph
--    Password: Test@123
--    Auto Confirm: YES

-- 3. HR:
--    Email: hr.admin@mseuf.edu.ph
--    Password: Test@123
--    Auto Confirm: YES

-- 4. Comptroller:
--    Email: comptroller@mseuf.edu.ph
--    Password: Test@123
--    Auto Confirm: YES

-- 5. Executive:
--    Email: exec.president@mseuf.edu.ph
--    Password: Test@123
--    Auto Confirm: YES

-- 6. Admin:
--    Email: admin@mseuf.edu.ph
--    Password: Admin@123
--    Auto Confirm: YES

-- ============================================================================
-- OPTION 2: After creating in Dashboard, link to app users table
-- ============================================================================

-- First, check what auth users exist:
-- SELECT id, email FROM auth.users;

-- Then insert into app users table:

-- 1. Faculty
INSERT INTO public.users (auth_user_id, email, role_base, department_id)
SELECT 
    au.id, 
    'faculty@mseuf.edu.ph',
    'faculty',
    d.id
FROM auth.users au
CROSS JOIN public.departments d
WHERE au.email = 'faculty@mseuf.edu.ph'
  AND d.code = 'CCMS'
ON CONFLICT (auth_user_id) DO NOTHING;

-- 2. Department Head
INSERT INTO public.users (auth_user_id, email, role_base, department_id)
SELECT 
    au.id,
    'head.nursing@mseuf.edu.ph',
    'faculty',
    d.id
FROM auth.users au
CROSS JOIN public.departments d
WHERE au.email = 'head.nursing@mseuf.edu.ph'
  AND d.code = 'CNAHS'
ON CONFLICT (auth_user_id) DO NOTHING;

-- 3. HR
INSERT INTO public.users (auth_user_id, email, role_base)
SELECT 
    id,
    'hr.admin@mseuf.edu.ph',
    'faculty'
FROM auth.users 
WHERE email = 'hr.admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO NOTHING;

-- 4. Comptroller
INSERT INTO public.users (auth_user_id, email, role_base)
SELECT 
    id,
    'comptroller@mseuf.edu.ph',
    'faculty'
FROM auth.users 
WHERE email = 'comptroller@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO NOTHING;

-- 5. Executive
INSERT INTO public.users (auth_user_id, email, role_base)
SELECT 
    id,
    'exec.president@mseuf.edu.ph',
    'faculty'
FROM auth.users 
WHERE email = 'exec.president@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO NOTHING;

-- 6. Admin
INSERT INTO public.users (auth_user_id, email, role_base)
SELECT 
    id,
    'admin@mseuf.edu.ph',
    'admin'
FROM auth.users 
WHERE email = 'admin@mseuf.edu.ph'
ON CONFLICT (auth_user_id) DO NOTHING;

-- ============================================================================
-- OPTION 3: Grant Roles via RBAC System
-- ============================================================================

-- After users created, grant roles:

-- 1. Grant HEAD role to head.nursing@mseuf.edu.ph
DO $$
DECLARE
    v_user_id UUID;
    v_dept_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM public.users WHERE email = 'head.nursing@mseuf.edu.ph';
    
    -- Get CNAHS department ID
    SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CNAHS';
    
    IF v_user_id IS NOT NULL AND v_dept_id IS NOT NULL THEN
        -- Add to roster_heads for auto-grant
        INSERT INTO public.roster_heads (department_id, head_email, is_active)
        VALUES (v_dept_id, 'head.nursing@mseuf.edu.ph', TRUE)
        ON CONFLICT (department_id, head_email) DO NOTHING;
        
        -- Grant role directly
        INSERT INTO public.role_grants (user_id, role, granted_by, reason)
        VALUES (v_user_id, 'head', NULL, 'Initial setup - test account')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Map to department_heads
        INSERT INTO public.department_heads (department_id, user_id, is_primary)
        VALUES (v_dept_id, v_user_id, TRUE)
        ON CONFLICT (department_id, user_id, valid_from) DO NOTHING;
    END IF;
END $$;

-- 2. Grant HR role
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE email = 'hr.admin@mseuf.edu.ph';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.role_grants (user_id, role, granted_by, reason)
        VALUES (v_user_id, 'hr', NULL, 'Initial setup - test account')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- 3. Grant EXEC role
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE email = 'exec.president@mseuf.edu.ph';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.role_grants (user_id, role, granted_by, reason)
        VALUES (v_user_id, 'exec', NULL, 'Initial setup - test account')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- 4. Grant ADMIN role
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE email = 'admin@mseuf.edu.ph';
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.role_grants (user_id, role, granted_by, reason)
        VALUES (v_user_id, 'admin', NULL, 'Initial setup - test account')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- Verify Users Created
-- ============================================================================

SELECT 
    u.email,
    u.role_base,
    d.name as department,
    STRING_AGG(rg.role, ', ') as granted_roles
FROM public.users u
LEFT JOIN public.role_grants rg ON rg.user_id = u.id AND rg.revoked_at IS NULL
LEFT JOIN public.departments d ON d.id = u.department_id
WHERE u.email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
GROUP BY u.id, u.email, u.role_base, d.name
ORDER BY u.email;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
