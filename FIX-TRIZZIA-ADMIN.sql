-- ============================================
-- FIX TRIZZIA'S ADMIN ROLE
-- ============================================

-- Step 1: Get Trizzia's user ID
SELECT 
  id as user_id,
  email,
  name,
  role
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Step 2: Insert into admins table FIRST
-- (Copy the user_id from Step 1 and use it here)
INSERT INTO public.admins (user_id, super_admin)
SELECT 
  id,
  false  -- Set to true if you want super admin
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: NOW update the role to 'admin'
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Step 4: Verify everything
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.department,
  a.super_admin,
  CASE 
    WHEN a.user_id IS NOT NULL THEN '✅ Admin record exists'
    ELSE '❌ No admin record'
  END as admin_status
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ DONE! Now logout and login again
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
-- Should redirect to /admin now!
