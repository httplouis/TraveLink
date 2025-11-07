-- ============================================
-- VERIFY TRIZZIA ACCOUNT EXISTS AND IS COMPLETE
-- ============================================

-- Check auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  role
FROM auth.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Check public.users
SELECT 
  auth_user_id,
  email,
  name,
  role,
  department,
  is_head,
  is_hr,
  is_exec
FROM public.users 
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- If public.users is EMPTY, run this:
-- ============================================

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
  'admin',
  'Treasury Department',
  false,
  false,
  false
FROM auth.users au 
WHERE au.email = 'casinotrizzia@mseuf.edu.ph'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph'
);

-- ============================================
-- FINAL VERIFICATION - COMPLETE USER DATA
-- ============================================

SELECT 
  au.id as auth_id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  pu.name,
  pu.role,
  pu.department
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE au.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ If you see complete data above, try logging in!
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024

-- ============================================
-- IF LOGIN FAILS - Reset password
-- ============================================
-- You can reset the password via Supabase Dashboard:
-- Authentication > Users > Find casinotrizzia@mseuf.edu.ph > Reset Password
