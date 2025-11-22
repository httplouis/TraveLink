-- ============================================
-- FIX APPROVALS & APPROVALS_HISTORY FOREIGN KEY CONSTRAINTS
-- ============================================
-- This script modifies foreign key constraints to use ON DELETE SET NULL
-- so that user deletion doesn't fail due to FK violations
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current foreign key constraints
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
WHERE tc.table_name IN ('approvals', 'approvals_history')
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;

-- Step 2: Fix approvals table constraints
-- Drop and recreate approver_id constraint
ALTER TABLE public.approvals
DROP CONSTRAINT IF EXISTS approvals_approver_id_fkey;

ALTER TABLE public.approvals
ADD CONSTRAINT approvals_approver_id_fkey
FOREIGN KEY (approver_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Drop and recreate admin_id constraint (if exists)
ALTER TABLE public.approvals
DROP CONSTRAINT IF EXISTS approvals_admin_id_fkey;

-- Check if admin_id column exists before adding constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approvals' AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.approvals
        ADD CONSTRAINT approvals_admin_id_fkey
        FOREIGN KEY (admin_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Fix approvals_history table constraints
-- Drop and recreate all user reference constraints
-- NOTE: There might be a duplicate constraint with wrong name (approvals_admin_id_fkey on approvals_history)
ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_history_admin_id_fkey;

ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_admin_id_fkey;  -- Drop duplicate constraint with wrong name

ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_history_approver_id_fkey;

ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_history_user_id_fkey;

ALTER TABLE public.approvals_history
DROP CONSTRAINT IF EXISTS approvals_history_actor_id_fkey;

-- Recreate with ON DELETE SET NULL
DO $$
BEGIN
    -- admin_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approvals_history' AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.approvals_history
        ADD CONSTRAINT approvals_history_admin_id_fkey
        FOREIGN KEY (admin_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;

    -- approver_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approvals_history' AND column_name = 'approver_id'
    ) THEN
        ALTER TABLE public.approvals_history
        ADD CONSTRAINT approvals_history_approver_id_fkey
        FOREIGN KEY (approver_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;

    -- user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approvals_history' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.approvals_history
        ADD CONSTRAINT approvals_history_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;

    -- actor_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'approvals_history' AND column_name = 'actor_id'
    ) THEN
        ALTER TABLE public.approvals_history
        ADD CONSTRAINT approvals_history_actor_id_fkey
        FOREIGN KEY (actor_id)
        REFERENCES public.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Verify the changes
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
WHERE tc.table_name IN ('approvals', 'approvals_history')
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;

-- Expected result: All delete_rule should be 'SET NULL'
-- ============================================
-- ✅ After running this, user deletion should work!
-- All user references in approvals tables will automatically be set to NULL
-- ============================================

