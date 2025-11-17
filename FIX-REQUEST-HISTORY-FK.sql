-- ============================================
-- FIX REQUEST_HISTORY FOREIGN KEY CONSTRAINT
-- ============================================
-- This script modifies the foreign key constraint on request_history.actor_id
-- to allow NULL values or ON DELETE SET NULL behavior
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current foreign key constraint
SELECT 
    tc.constraint_name,
    tc.table_name,
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
WHERE tc.table_name = 'request_history'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'actor_id';

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE public.request_history
DROP CONSTRAINT IF EXISTS request_history_actor_id_fkey;

-- Step 3: Recreate the foreign key with ON DELETE SET NULL
-- This allows the actor_id to be set to NULL when the user is deleted
ALTER TABLE public.request_history
ADD CONSTRAINT request_history_actor_id_fkey
FOREIGN KEY (actor_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Step 4: Verify the change
SELECT 
    tc.constraint_name,
    tc.table_name,
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
WHERE tc.table_name = 'request_history'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'actor_id';

-- Expected result: delete_rule should be 'SET NULL'
-- ============================================
-- ✅ After running this, user deletion should work!
-- The actor_id will automatically be set to NULL when a user is deleted
-- ============================================

