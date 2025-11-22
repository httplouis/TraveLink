-- ============================================
-- FIX APPROVALS_HISTORY ADMIN_ID FK CONSTRAINT
-- ============================================
-- Change admin_id FK constraint from ON DELETE SET NULL to ON DELETE CASCADE
-- This will delete records instead of trying to set NULL (which fails due to NOT NULL constraint)
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current constraint
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
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'approvals_history'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'admin_id';

-- Step 2: Drop existing constraint
ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_history_admin_id_fkey;

-- Step 3: Recreate with ON DELETE CASCADE (deletes records instead of setting NULL)
ALTER TABLE public.approvals_history
ADD CONSTRAINT approvals_history_admin_id_fkey
FOREIGN KEY (admin_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- Step 4: Verify the change
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
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'approvals_history'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'admin_id';

-- Expected result: delete_rule should be 'CASCADE'
-- ============================================
-- ✅ After running this, user deletion should work!
-- Records with admin_id referencing the deleted user will be automatically deleted
-- ============================================

