-- ============================================
-- Row-Level Security (RLS) Policies
-- For TraviLink Request Workflow System
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_request_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REQUESTS TABLE POLICIES
-- ============================================

-- 1. Users can INSERT their own requests
CREATE POLICY "Users can create own requests"
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- 2. Users can SELECT their own requests
CREATE POLICY "Users can view own requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- 3. Department heads can view requests in their department
CREATE POLICY "Heads can view department requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
);

-- 4. Admins (Ma'am TM and Ma'am Cleofe) can view ALL requests
CREATE POLICY "Admins can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph')
  )
);

-- 5. HR can view all requests
CREATE POLICY "HR can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_hr = true
  )
);

-- 6. Executives can view all requests
CREATE POLICY "Executives can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_exec = true
  )
);

-- 7. Comptroller (admin users) can view requests with budget
CREATE POLICY "Comptroller can view budget requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  has_budget = true AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
  )
);

-- 8. Department heads can UPDATE requests they can approve
CREATE POLICY "Heads can approve department requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'pending_head' AND
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
)
WITH CHECK (
  status = 'pending_head' AND
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
);

-- 9. Admins can UPDATE requests for vehicle assignment and processing
CREATE POLICY "Admins can process requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status IN ('pending_admin', 'pending_comptroller') AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
  )
);

-- 10. HR can UPDATE requests at HR stage
CREATE POLICY "HR can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'pending_hr' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_hr = true
  )
)
WITH CHECK (
  status = 'pending_hr' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_hr = true
  )
);

-- 11. Executives can UPDATE requests at exec stage
CREATE POLICY "Executives can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'pending_exec' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_exec = true
  )
)
WITH CHECK (
  status = 'pending_exec' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_exec = true
  )
);

-- 12. Users can UPDATE (cancel) their own draft requests
CREATE POLICY "Users can update own drafts"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'draft' AND
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  status = 'draft' AND
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- REQUEST_HISTORY TABLE POLICIES
-- ============================================

-- Allow INSERT for logging (anyone can log actions on requests they can see)
CREATE POLICY "Users can log request actions"
ON public.request_history FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.requests
    WHERE id = request_history.request_id
  )
);

-- Allow SELECT for viewing history
CREATE POLICY "Users can view request history"
ON public.request_history FOR SELECT
TO authenticated
USING (
  request_id IN (
    SELECT id FROM public.requests
    -- Will use requests table policies
  )
);

-- ============================================
-- DEPARTMENT_BUDGETS TABLE POLICIES
-- ============================================

-- Department heads can view their department budget
CREATE POLICY "Heads can view department budget"
ON public.department_budgets FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
);

-- Admins and comptroller can view all budgets
CREATE POLICY "Admins can view all budgets"
ON public.department_budgets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND (
      email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
      OR is_exec = true
      OR is_hr = true
    )
  )
);

-- Only admins can update budgets
CREATE POLICY "Admins can update budgets"
ON public.department_budgets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph', 'comptroller@mseuf.edu.ph')
  )
);

-- ============================================
-- DAILY_VEHICLE_REQUEST_LIMITS TABLE POLICIES
-- ============================================

-- Everyone can view vehicle limits (to check availability)
CREATE POLICY "Anyone can view vehicle limits"
ON public.daily_vehicle_request_limits FOR SELECT
TO authenticated
USING (true);

-- Only admins can update vehicle limits
CREATE POLICY "Admins can update vehicle limits"
ON public.daily_vehicle_request_limits FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph')
  )
);

-- Admins can insert new limit records
CREATE POLICY "Admins can create vehicle limits"
ON public.daily_vehicle_request_limits FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph')
  )
);

-- ============================================
-- GRANT USAGE ON SEQUENCES
-- ============================================

-- Allow authenticated users to use sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- DONE!
-- ============================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'request_history', 'department_budgets', 'daily_vehicle_request_limits');

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('requests', 'request_history', 'department_budgets', 'daily_vehicle_request_limits')
ORDER BY tablename, policyname;
