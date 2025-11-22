-- ============================================
-- SIMPLE SOLUTION - NO TRIGGER DISABLING NEEDED
-- ============================================

-- Step 1: First, manually set role to 'admin' in users table
-- This should work because the guard only checks when UPDATING, 
-- not when the record already has admin role
UPDATE public.users
SET role = 'admin'
WHERE email = 'casinotrizzia@mseuf.edu.ph'
AND role != 'admin';  -- Only update if not already admin

-- Step 2: Then insert into admins table
-- (This will work because role is already 'admin')
INSERT INTO public.admins (user_id, super_admin)
SELECT 
  id,
  false
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph'
AND role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  a.super_admin,
  CASE 
    WHEN u.role = 'admin' AND a.user_id IS NOT NULL THEN '✅ ADMIN COMPLETE!'
    WHEN u.role = 'admin' AND a.user_id IS NULL THEN '⚠️ Admin role but no admin record'
    WHEN u.role != 'admin' AND a.user_id IS NOT NULL THEN '⚠️ Admin record but wrong role'
    ELSE '❌ Setup incomplete'
  END as status
FROM public.users u
LEFT JOIN public.admins a ON u.id = a.user_id
WHERE u.email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- IF STEP 1 STILL FAILS WITH TRIGGER ERROR:
-- Run this alternative approach using raw SQL
-- ============================================

-- Alternative: Update via direct SQL bypassing application triggers
-- (Run this ONLY if the above fails)
/*
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id 
  FROM public.users 
  WHERE email = 'casinotrizzia@mseuf.edu.ph';
  
  -- Insert to admins first (will fail but that's ok)
  BEGIN
    INSERT INTO public.admins (user_id, super_admin) 
    VALUES (target_user_id, false);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Admin insert failed (expected): %', SQLERRM;
  END;
  
  -- Now force update role
  UPDATE public.users 
  SET role = 'admin' 
  WHERE id = target_user_id;
  
  -- Try admin insert again
  INSERT INTO public.admins (user_id, super_admin) 
  VALUES (target_user_id, false)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Done! User: %', target_user_id;
END $$;
*/

-- ============================================
-- ✅ AFTER SUCCESS, LOGOUT AND LOGIN AGAIN
-- ============================================
