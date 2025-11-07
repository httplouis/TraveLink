-- ============================================
-- FORCE TRIZZIA TO ADMIN (BYPASS TRIGGERS)
-- ============================================

-- Step 1: Disable triggers temporarily
ALTER TABLE public.users DISABLE TRIGGER ALL;
ALTER TABLE public.admins DISABLE TRIGGER ALL;

-- Step 2: Insert into admins table
INSERT INTO public.admins (user_id, super_admin)
SELECT 
  id,
  false
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Update role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Step 4: Re-enable triggers
ALTER TABLE public.users ENABLE TRIGGER ALL;
ALTER TABLE public.admins ENABLE TRIGGER ALL;

-- Step 5: Verify
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.super_admin,
  CASE 
    WHEN u.role = 'admin' AND a.user_id IS NOT NULL THEN '✅ ADMIN SETUP COMPLETE!'
    ELSE '❌ Something wrong'
  END as status
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ NOW LOGOUT AND LOGIN AGAIN!
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
-- Should go to /admin dashboard!
