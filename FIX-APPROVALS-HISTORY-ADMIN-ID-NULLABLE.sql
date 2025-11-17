-- ============================================
-- FIX APPROVALS_HISTORY ADMIN_ID NOT NULL CONSTRAINT
-- ============================================
-- This script makes admin_id nullable in approvals_history table
-- so that user deletion doesn't fail when FK constraint tries to set it to NULL
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'approvals_history'
  AND column_name = 'admin_id';

-- Step 2: Make admin_id nullable
-- This allows the ON DELETE SET NULL constraint to work properly
ALTER TABLE public.approvals_history
ALTER COLUMN admin_id DROP NOT NULL;

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'approvals_history'
  AND column_name = 'admin_id';

-- Expected result: is_nullable should be 'YES'
-- ============================================
-- ✅ After running this, user deletion should work!
-- The admin_id column can now be set to NULL when a user is deleted
-- ============================================

