-- ============================================
-- QUICK FIX: ADD ADMIN USER
-- ============================================
-- Run this in Supabase SQL Editor
-- This will add is_admin column and help you create an admin

-- 1. Add is_admin column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_admin column';
    ELSE
        RAISE NOTICE 'ℹ️ is_admin column already exists';
    END IF;
END $$;

-- 2. Show all users so you can choose which one to make admin
SELECT 
  id, 
  name, 
  email, 
  role, 
  status,
  created_at
FROM users
ORDER BY created_at DESC;

-- 3. UPDATE: Replace 'YOUR_EMAIL_HERE' with the email of the user you want to make admin
--    Then uncomment and run:
/*
UPDATE users 
SET role = 'admin', is_admin = TRUE
WHERE email = 'YOUR_EMAIL_HERE'
RETURNING id, name, email, role, is_admin, status;
*/

-- 4. Verify admin was created
SELECT 
  id, 
  name, 
  email, 
  role, 
  is_admin,
  status
FROM users 
WHERE role = 'admin' OR is_admin = TRUE;

