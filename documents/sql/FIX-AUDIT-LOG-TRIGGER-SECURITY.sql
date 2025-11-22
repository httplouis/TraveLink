-- ============================================
-- FIX AUDIT_LOG TRIGGER SECURITY CONTEXT
-- ============================================
-- The issue is that triggers run in the security context of the user who created them
-- or the role that's executing the statement. We need to make triggers use SECURITY DEFINER
-- so they can bypass RLS when inserting into audit_log
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Find all triggers that might insert into audit_log
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    p.proname as function_name,
    p.prosecdef as is_security_definer
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.proname = (
    SELECT regexp_replace(
        t.action_statement,
        'EXECUTE FUNCTION ([^(]+)\(.*\)',
        '\1'
    )
)
WHERE t.action_statement LIKE '%audit_log%'
   OR t.event_object_table IN ('users', 'approvals_history', 'requests', 'request_history')
ORDER BY t.event_object_table, t.trigger_name;

-- Step 2: Find all functions that insert into audit_log
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%audit_log%'
ORDER BY p.proname;

-- Step 3: Check if there's a trigger function that needs SECURITY DEFINER
-- We'll need to alter the function to use SECURITY DEFINER
-- This allows the function to run with the privileges of the function owner (usually postgres)
-- which can bypass RLS

-- Example: If there's a function called 'audit_trigger_function', we would do:
-- ALTER FUNCTION public.audit_trigger_function() SECURITY DEFINER;

-- Step 4: Alternative approach - Create a wrapper function with SECURITY DEFINER
-- that can insert into audit_log without RLS restrictions

-- First, let's create a function that can insert into audit_log with elevated privileges
CREATE OR REPLACE FUNCTION public.insert_audit_log_safe(
    p_table_name TEXT,
    p_operation TEXT,
    p_user_id UUID,
    p_record_id UUID,
    p_changes JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name,
        operation,
        user_id,
        record_id,
        changes,
        created_at
    ) VALUES (
        p_table_name,
        p_operation,
        p_user_id,
        p_record_id,
        p_changes,
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail if RLS still blocks (shouldn't happen with SECURITY DEFINER)
        RAISE WARNING 'Failed to insert audit log: %', SQLERRM;
END;
$$;

-- Step 5: Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.insert_audit_log_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_audit_log_safe TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_audit_log_safe TO anon;

-- Step 6: Verify the function was created
SELECT 
    p.proname,
    p.prosecdef,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'insert_audit_log_safe';

-- ============================================
-- ✅ After running this:
-- ============================================
-- 1. Find the existing trigger functions that insert into audit_log
-- 2. Modify them to call insert_audit_log_safe() instead of directly inserting
-- 3. OR alter the existing functions to use SECURITY DEFINER
-- ============================================
-- 
-- To modify an existing trigger function, you would do something like:
-- 
-- CREATE OR REPLACE FUNCTION public.your_trigger_function()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER  -- Add this
-- AS $$
-- BEGIN
--     -- Your existing code, but replace direct INSERT with:
--     PERFORM public.insert_audit_log_safe(
--         TG_TABLE_NAME,
--         TG_OP,
--         NEW.id,  -- or OLD.id for DELETE
--         NEW.id,
--         jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
--     );
--     RETURN NEW;  -- or OLD for DELETE
-- END;
-- $$;
-- ============================================

