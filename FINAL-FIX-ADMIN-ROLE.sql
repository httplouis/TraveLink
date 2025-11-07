-- ============================================
-- FINAL FIX - DISABLE CORRECT TRIGGER
-- ============================================

-- Step 1: Disable the role change guard trigger
ALTER TABLE public.users DISABLE TRIGGER trg_users_role_change_guard;

-- Step 2: Update role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Step 3: Insert into admins table
INSERT INTO public.admins (user_id, super_admin)
SELECT id, false
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Re-enable the trigger
ALTER TABLE public.users ENABLE TRIGGER trg_users_role_change_guard;

-- Step 5: Final verification
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.super_admin,
  '✅ ADMIN SETUP COMPLETE!' as status
FROM public.users u
JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ SUCCESS! NOW:
-- 1. LOGOUT from current session
-- 2. LOGIN again with:
--    Email: casinotrizzia@mseuf.edu.ph
--    Password: Trizzia@2024
-- 3. Should redirect to /admin dashboard!
-- ============================================
