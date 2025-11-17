-- ============================================
-- FIND AND FIX AUDIT LOG TRIGGERS
-- ============================================
-- This script finds all triggers that insert into audit_log
-- and modifies them to use SECURITY DEFINER to bypass RLS
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Find all triggers on users table
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_schema = 'public'
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;

-- Step 2: Find all trigger functions that might reference audit_log
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) LIKE '%audit_log%'
    OR pg_get_functiondef(p.oid) LIKE '%INSERT INTO%audit%'
  )
ORDER BY p.proname;

-- Step 3: Find which triggers use which functions
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement,
    regexp_replace(
        t.action_statement,
        'EXECUTE (?:FUNCTION|PROCEDURE) ([^(]+)\(.*\)',
        '\1'
    ) as function_name
FROM information_schema.triggers t
WHERE t.event_object_schema = 'public'
  AND (
    t.event_object_table = 'users'
    OR t.action_statement LIKE '%audit_log%'
  )
ORDER BY t.event_object_table, t.trigger_name;

-- Step 4: Make all trigger functions that insert into audit_log use SECURITY DEFINER
-- This is a template - replace FUNCTION_NAME with the actual function name found above
-- 
-- ALTER FUNCTION public.FUNCTION_NAME() SECURITY DEFINER;
--
-- Example:
-- ALTER FUNCTION public.audit_users_trigger() SECURITY DEFINER;

-- Step 5: Alternative - Disable RLS on audit_log for inserts (TEMPORARY FIX)
-- WARNING: This makes audit_log less secure, but allows triggers to work
-- Only use this if SECURITY DEFINER doesn't work

-- Option A: Disable RLS entirely (NOT RECOMMENDED for production)
-- ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;

-- Option B: Create a more permissive policy that allows ANY role to insert
-- This is safer than disabling RLS entirely
DROP POLICY IF EXISTS "audit_log_allow_all_inserts" ON public.audit_log;
CREATE POLICY "audit_log_allow_all_inserts"
ON public.audit_log
FOR INSERT
TO PUBLIC  -- This allows ANY role to insert
WITH CHECK (true);

-- Step 6: Verify RLS is still enabled but policy allows inserts
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'audit_log';

-- Step 7: Verify all policies
SELECT 
    policyname,
    roles,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- ============================================
-- ✅ RECOMMENDED APPROACH:
-- ============================================
-- 1. Run Step 1-3 to find the trigger function name
-- 2. Run: ALTER FUNCTION public.FUNCTION_NAME() SECURITY DEFINER;
-- 3. If that doesn't work, use Step 5 Option B (allow all inserts)
-- ============================================

