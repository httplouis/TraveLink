-- ============================================================================
-- VERIFY TEST USERS - Diagnostic Script
-- ============================================================================

-- 1. Check if users exist in Supabase Auth
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
ORDER BY email;

-- Expected: Should show 6 rows
-- If 0 rows → Users not created in Auth yet!

-- ============================================================================

-- 2. Check if users exist in public.users table
SELECT 
    u.id,
    u.auth_user_id,
    u.email,
    u.role_base,
    d.name as department
FROM public.users u
LEFT JOIN public.departments d ON d.id = u.department_id
WHERE u.email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
ORDER BY u.email;

-- Expected: Should show 6 rows
-- If 0 rows → Users not linked to app database yet!

-- ============================================================================

-- 3. Check role_grants
SELECT 
    u.email,
    rg.role,
    rg.granted_at,
    rg.revoked_at
FROM public.users u
LEFT JOIN public.role_grants rg ON rg.user_id = u.id
WHERE u.email IN (
    'faculty@mseuf.edu.ph',
    'head.nursing@mseuf.edu.ph',
    'hr.admin@mseuf.edu.ph',
    'comptroller@mseuf.edu.ph',
    'exec.president@mseuf.edu.ph',
    'admin@mseuf.edu.ph'
)
ORDER BY u.email, rg.role;

-- Expected:
-- admin@mseuf.edu.ph → role: 'admin'
-- head.nursing@mseuf.edu.ph → role: 'head'
-- hr.admin@mseuf.edu.ph → role: 'hr'
-- exec.president@mseuf.edu.ph → role: 'exec'
-- faculty@mseuf.edu.ph → (no role grants, just regular user)

-- ============================================================================

-- 4. Check departments table
SELECT id, code, name 
FROM public.departments 
WHERE code IN ('CCMS', 'CNAHS')
ORDER BY code;

-- Expected: Should show CCMS and CNAHS
-- If 0 rows → Need to run database-comprehensive-rbac.sql first!

-- ============================================================================
-- DIAGNOSIS:
-- ============================================================================

-- If Query 1 returns 0 rows:
--   → Go to Supabase Dashboard → Authentication → Users → Add User
--   → Create all 6 users manually

-- If Query 1 has users but Query 2 is empty:
--   → Run: \i database-create-test-users.sql

-- If Query 2 has users but Query 3 shows NULL roles:
--   → The role grants didn't work
--   → Re-run: \i database-create-test-users.sql

-- If Query 4 is empty:
--   → Run: \i database-comprehensive-rbac.sql first!

-- ============================================================================
