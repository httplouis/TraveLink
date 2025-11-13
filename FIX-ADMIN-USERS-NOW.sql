-- ============================================
-- FIX EXISTING ADMIN USERS
-- ============================================
-- Run this in Supabase SQL Editor
-- This will set is_admin = TRUE for all users with role = 'admin'

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

-- 2. Update all existing admin users to have is_admin = TRUE
UPDATE users 
SET is_admin = TRUE
WHERE role = 'admin' AND (is_admin = FALSE OR is_admin IS NULL)
RETURNING id, name, email, role, is_admin, status;

-- 3. Verify all admins are fixed
SELECT 
  id, 
  name, 
  email, 
  role, 
  is_admin,
  status
FROM users 
WHERE role = 'admin'
ORDER BY name;

