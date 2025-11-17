-- ============================================
-- FIX REQUESTS ADMIN_APPROVED_BY FOREIGN KEY
-- ============================================
-- This script fixes the foreign key constraint on requests.admin_approved_by
-- to allow NULL values when the referenced user is deleted
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if admin_approved_by column exists and its current constraint
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'requests'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'admin_approved_by'
  AND ccu.table_name = 'users';

-- Step 2: Drop the existing constraint if it exists
ALTER TABLE public.requests 
DROP CONSTRAINT IF EXISTS requests_admin_approved_by_fkey;

-- Step 3: Recreate the constraint with ON DELETE SET NULL
-- This allows the admin_approved_by field to be set to NULL when the user is deleted
ALTER TABLE public.requests
ADD CONSTRAINT requests_admin_approved_by_fkey
FOREIGN KEY (admin_approved_by)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Step 4: Verify the constraint was created correctly
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'requests'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'admin_approved_by'
  AND ccu.table_name = 'users';

-- ============================================
-- ✅ After running this, user deletion should work
-- The admin_approved_by field will be automatically set to NULL
-- when a referenced user is deleted
-- ============================================

