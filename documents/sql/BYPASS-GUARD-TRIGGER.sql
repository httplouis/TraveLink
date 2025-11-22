-- ============================================
-- FIND AND DISABLE SPECIFIC USER TRIGGER
-- ============================================

-- Step 1: List all triggers on users table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Step 2: Disable ONLY the guard trigger (not system triggers)
ALTER TABLE public.users DISABLE TRIGGER guard_users_role_change;

-- Step 3: Update role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Step 4: Insert into admins table
INSERT INTO public.admins (user_id, super_admin)
SELECT id, false
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph'
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Re-enable the trigger
ALTER TABLE public.users ENABLE TRIGGER guard_users_role_change;

-- Step 6: Verify
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.super_admin,
  '✅ SUCCESS!' as status
FROM public.users u
JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ LOGOUT AND LOGIN AGAIN!
-- ============================================
-- Email: casinotrizzia@mseuf.edu.ph
-- Password: Trizzia@2024
-- Should redirect to /admin
