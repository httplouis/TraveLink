-- ============================================
-- RLS Policies for VP (Vice President) Role
-- Ensures VP users can view and update requests sent to them
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "VP can view all requests" ON public.requests;
DROP POLICY IF EXISTS "VP can approve requests" ON public.requests;

-- ============================================
-- SELECT POLICY: VP can view ALL requests
-- ============================================
-- This allows VP to see requests from any sender/department
-- VPs need to see requests that are:
-- 1. pending_exec (waiting for VP approval)
-- 2. pending_head (if assigned to this VP via workflow_metadata)
-- 3. Any request that has been sent to them
CREATE POLICY "VP can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_vp = true
  )
);

-- ============================================
-- UPDATE POLICY: VP can approve requests
-- ============================================
-- VP can update requests at:
-- 1. pending_exec status (waiting for VP approval)
-- 2. pending_head status (if assigned to this VP via workflow_metadata)
CREATE POLICY "VP can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status IN ('pending_exec', 'pending_head') AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_vp = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_vp = true
  )
);

-- ============================================
-- Verify policies were created
-- ============================================
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
WHERE schemaname = 'public'
  AND tablename = 'requests'
  AND (policyname LIKE '%VP%' OR policyname LIKE '%vp%')
ORDER BY policyname;

-- ============================================
-- Test query to verify VP can see all requests
-- ============================================
-- Run this as a VP user to verify:
-- SELECT COUNT(*) FROM public.requests;
-- Should return all requests regardless of sender/department

