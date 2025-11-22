-- ============================================
-- COPY-PASTE THIS TO SUPABASE SQL EDITOR
-- Complete Workflow Setup (Safe to re-run)
-- ============================================

-- ============================================
-- ENUMS (with DROP IF EXISTS for clean re-run)
-- ============================================

DROP TYPE IF EXISTS request_type CASCADE;
CREATE TYPE request_type AS ENUM ('travel_order', 'seminar');

DROP TYPE IF EXISTS request_status CASCADE;
CREATE TYPE request_status AS ENUM (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_comptroller',
  'pending_hr',
  'pending_exec',
  'approved',
  'rejected',
  'cancelled'
);

-- ============================================
-- MAIN REQUESTS TABLE
-- ============================================

DROP TABLE IF EXISTS public.requests CASCADE;

CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request Details
  request_type request_type NOT NULL,
  request_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  destination VARCHAR(255) NOT NULL,
  
  -- Dates
  travel_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  travel_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Requester Info
  requester_id UUID NOT NULL REFERENCES public.users(id),
  requester_is_head BOOLEAN DEFAULT FALSE,
  department_id UUID REFERENCES public.departments(id),
  
  -- Participants
  participants JSONB DEFAULT '[]'::jsonb,
  head_included BOOLEAN DEFAULT FALSE,
  
  -- Budget
  has_budget BOOLEAN DEFAULT FALSE,
  total_budget DECIMAL(12,2) DEFAULT 0,
  expense_breakdown JSONB DEFAULT '[]'::jsonb,
  
  -- Vehicle
  needs_vehicle BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(100),
  needs_rental BOOLEAN DEFAULT FALSE,
  rental_note TEXT,
  assigned_vehicle_id UUID,
  assigned_driver_id UUID REFERENCES public.users(id),
  
  -- Status
  status request_status DEFAULT 'draft',
  current_approver_role VARCHAR(50),
  
  -- Approval Tracking
  head_approved_at TIMESTAMP WITH TIME ZONE,
  head_approved_by UUID REFERENCES public.users(id),
  head_signature TEXT,
  head_comments TEXT,
  
  admin_processed_at TIMESTAMP WITH TIME ZONE,
  admin_processed_by UUID REFERENCES public.users(id),
  admin_comments TEXT,
  
  comptroller_approved_at TIMESTAMP WITH TIME ZONE,
  comptroller_approved_by UUID REFERENCES public.users(id),
  comptroller_comments TEXT,
  comptroller_edited_budget DECIMAL(12,2),
  
  hr_approved_at TIMESTAMP WITH TIME ZONE,
  hr_approved_by UUID REFERENCES public.users(id),
  hr_signature TEXT,
  hr_comments TEXT,
  
  exec_approved_at TIMESTAMP WITH TIME ZONE,
  exec_approved_by UUID REFERENCES public.users(id),
  exec_signature TEXT,
  exec_comments TEXT,
  
  final_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Rejection
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  rejection_stage VARCHAR(50),
  
  -- Meta
  is_representative BOOLEAN DEFAULT FALSE,
  representative_note TEXT,
  
  CONSTRAINT valid_dates CHECK (travel_end_date >= travel_start_date),
  CONSTRAINT valid_budget CHECK (total_budget >= 0)
);

CREATE INDEX idx_requests_requester ON public.requests(requester_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_department ON public.requests(department_id);
CREATE INDEX idx_requests_dates ON public.requests(travel_start_date, travel_end_date);
CREATE INDEX idx_requests_created ON public.requests(created_at DESC);

-- ============================================
-- REQUEST HISTORY
-- ============================================

DROP TABLE IF EXISTS public.request_history CASCADE;

CREATE TABLE public.request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES public.users(id),
  actor_role VARCHAR(50),
  previous_status request_status,
  new_status request_status,
  comments TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_history_request ON public.request_history(request_id, created_at DESC);

-- ============================================
-- DEPARTMENT BUDGETS
-- ============================================

DROP TABLE IF EXISTS public.department_budgets CASCADE;

CREATE TABLE public.department_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  fiscal_year INT NOT NULL,
  total_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_pending DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining DECIMAL(12,2) GENERATED ALWAYS AS (total_allocated - total_used - total_pending) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_dept_year UNIQUE(department_id, fiscal_year),
  CONSTRAINT valid_budget_amounts CHECK (
    total_allocated >= 0 AND
    total_used >= 0 AND
    total_pending >= 0
  )
);

-- ============================================
-- DAILY VEHICLE LIMITS
-- ============================================

DROP TABLE IF EXISTS public.daily_vehicle_request_limits CASCADE;

CREATE TABLE public.daily_vehicle_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date DATE NOT NULL,
  vehicle_request_count INT NOT NULL DEFAULT 0,
  max_vehicle_requests INT NOT NULL DEFAULT 5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_date UNIQUE(request_date),
  CONSTRAINT valid_count CHECK (vehicle_request_count >= 0)
);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requests_update_timestamp ON public.requests;
CREATE TRIGGER requests_update_timestamp
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS department_budgets_update_timestamp ON public.department_budgets;
CREATE TRIGGER department_budgets_update_timestamp
  BEFORE UPDATE ON public.department_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- AUTO-GENERATE REQUEST NUMBER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_request_number(req_type request_type)
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10);
  year VARCHAR(4);
  sequence_num INT;
  result VARCHAR(50);
BEGIN
  prefix := CASE req_type
    WHEN 'travel_order' THEN 'TO'
    WHEN 'seminar' THEN 'SEM'
  END;
  
  year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(request_number, '[^0-9]', '', 'g'), '')::INT
  ), 0) + 1
  INTO sequence_num
  FROM public.requests
  WHERE request_number LIKE prefix || '-' || year || '-%';
  
  result := prefix || '-' || year || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number(NEW.request_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requests_auto_number ON public.requests;
CREATE TRIGGER requests_auto_number
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_request_number();

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_request_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;
DROP POLICY IF EXISTS "Heads can view department requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "HR can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Executives can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Heads can approve department requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can process requests" ON public.requests;
DROP POLICY IF EXISTS "HR can approve requests" ON public.requests;
DROP POLICY IF EXISTS "Executives can approve requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update own drafts" ON public.requests;

-- Create policies
CREATE POLICY "Users can create own requests"
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  requester_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Heads can view department requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
);

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

CREATE POLICY "HR can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_hr = true
  )
);

CREATE POLICY "Executives can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_exec = true
  )
);

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
);

CREATE POLICY "HR can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'pending_hr' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_hr = true
  )
);

CREATE POLICY "Executives can approve requests"
ON public.requests FOR UPDATE
TO authenticated
USING (
  status = 'pending_exec' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND is_exec = true
  )
);

-- Request History policies
DROP POLICY IF EXISTS "Users can log request actions" ON public.request_history;
DROP POLICY IF EXISTS "Users can view request history" ON public.request_history;

CREATE POLICY "Users can log request actions"
ON public.request_history FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view request history"
ON public.request_history FOR SELECT
TO authenticated
USING (true);

-- Department Budgets policies
DROP POLICY IF EXISTS "Heads can view department budget" ON public.department_budgets;
DROP POLICY IF EXISTS "Admins can view all budgets" ON public.department_budgets;

CREATE POLICY "Heads can view department budget"
ON public.department_budgets FOR SELECT
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM public.users 
    WHERE auth_user_id = auth.uid() AND is_head = true
  )
);

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

-- Vehicle Limits policies
DROP POLICY IF EXISTS "Anyone can view vehicle limits" ON public.daily_vehicle_request_limits;

CREATE POLICY "Anyone can view vehicle limits"
ON public.daily_vehicle_request_limits FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Workflow tables created successfully!' as message;

SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'request_history', 'department_budgets', 'daily_vehicle_request_limits')
ORDER BY tablename;

-- ============================================
-- DONE!
-- ============================================
