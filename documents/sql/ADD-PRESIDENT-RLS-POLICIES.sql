-- ============================================
-- RLS Policies for President Role
-- Ensures President can view and update requests from any sender
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "President can view all requests" ON public.requests;
DROP POLICY IF EXISTS "President can approve requests" ON public.requests;

-- ============================================
-- SELECT POLICY: President can view ALL requests
-- ============================================
-- This allows President to see requests from any sender/department
CREATE POLICY "President can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_president = true
  )
);

-- ============================================
-- UPDATE POLICY: President can approve requests
-- ============================================
-- President can update requests at:
-- 1. pending_exec status (where both VPs have approved)
-- 2. pending_president status (legacy)
CREATE POLICY "President can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status IN ('pending_exec', 'pending_president') AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_president = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() 
    AND is_president = true
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
  AND policyname LIKE '%President%'
ORDER BY policyname;

-- ============================================
-- Test query to verify President can see all requests
-- ============================================
-- Run this as a President user to verify:
-- SELECT COUNT(*) FROM public.requests;
-- Should return all requests regardless of sender/department

