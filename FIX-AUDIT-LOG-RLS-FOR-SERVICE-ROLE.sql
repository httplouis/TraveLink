-- ============================================
-- FIX AUDIT_LOG RLS POLICY FOR SERVICE ROLE
-- ============================================
-- This script creates/updates RLS policy on audit_log to allow service role inserts
-- This is needed because triggers on users/approvals_history try to insert into audit_log
-- when records are deleted, and RLS is blocking those inserts
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current RLS policies on audit_log
-- Note: roles is an array, so we convert it to text for display
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    array_to_string(roles, ', ') as roles,
    cmd
FROM pg_policies
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- Step 2: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "audit_log_insert_policy" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_service_role_policy" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_service_role_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_authenticated_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_service_role_all" ON public.audit_log;

-- Step 3: Create a policy that allows service role to insert
-- Service role is identified by the role 'service_role' in the JWT
CREATE POLICY "audit_log_service_role_insert"
ON public.audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 4: Also allow authenticated users to insert (for normal operations)
-- This allows triggers to insert audit logs
CREATE POLICY "audit_log_authenticated_insert"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 5: Allow service role to do everything (for admin operations)
CREATE POLICY "audit_log_service_role_all"
ON public.audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 5b: Allow ALL roles to insert (for triggers)
-- This is safe because audit_log is an audit table - we want to log everything
-- The SELECT policies can still restrict who can read it
DROP POLICY IF EXISTS "audit_log_allow_all_inserts" ON public.audit_log;
CREATE POLICY "audit_log_allow_all_inserts"
ON public.audit_log
FOR INSERT
TO PUBLIC  -- This allows ANY role (including triggers) to insert
WITH CHECK (true);

-- Step 6: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    array_to_string(roles, ', ') as roles,
    cmd
FROM pg_policies
WHERE tablename = 'audit_log'
ORDER BY policyname;

-- ============================================
-- ✅ After running this, triggers should be able to insert into audit_log
-- Service role operations will bypass RLS, and triggers will also be able to insert
-- ============================================

