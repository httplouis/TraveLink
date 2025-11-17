-- ============================================
-- CHECK AUDIT_LOG TABLE AND TRIGGERS
-- ============================================
-- This script checks for audit_log table and any triggers
-- that might be causing RLS policy violations
-- ============================================

-- Step 1: Check if audit_log table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('audit_log', 'audit_logs')
ORDER BY table_name;

-- Step 2: Check for triggers on approvals_history that might insert into audit_log
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'approvals_history'
ORDER BY trigger_name;

-- Step 3: Check for triggers on other tables that might insert into audit_log
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%audit_log%'
ORDER BY event_object_table, trigger_name;

-- Step 4: Check RLS policies on audit_log table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- Step 5: Check if audit_log table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'audit_log';

