-- ============================================
-- FIX DEPARTMENT_HEADS REPLICATION ISSUE
-- ============================================
-- This fixes the error: "cannot delete from table 'department_heads' 
-- because it does not have a replica identity and publishes deletes"
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current replica identity
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT (primary key)'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as current_replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'department_heads';

-- Step 2: Set replica identity to FULL
-- This allows the table to be replicated and supports DELETE operations
ALTER TABLE public.department_heads REPLICA IDENTITY FULL;

-- Step 3: Verify the change
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT (primary key)'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
        ELSE 'UNKNOWN'
    END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'department_heads';

-- Expected result: replica_identity should be 'FULL'
-- ============================================
-- ✅ After running this, user deletion should work!
-- ============================================

