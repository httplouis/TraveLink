-- TraviLink Request Workflow Schema
-- Based on complete workflow requirements

-- ============================================
-- REQUEST TYPE ENUM
-- ============================================
CREATE TYPE request_type AS ENUM ('travel_order', 'seminar');

-- ============================================
-- REQUEST STATUS ENUM
-- ============================================
CREATE TYPE request_status AS ENUM (
  'draft',
  'pending_head',      -- Waiting for department head approval
  'pending_admin',     -- Waiting for Ma'am TM (admin) to assign driver/vehicle
  'pending_comptroller', -- Waiting for comptroller to verify budget
  'pending_hr',        -- Waiting for HR approval
  'pending_exec',      -- Waiting for executive approval
  'approved',          -- Final approval complete
  'rejected',          -- Rejected at any stage
  'cancelled'          -- Cancelled by requester
);

-- ============================================
-- MAIN REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request Details
  request_type request_type NOT NULL,
  request_number VARCHAR(50) UNIQUE, -- Auto-generated: TO-2024-001, SEM-2024-001
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
  requester_is_head BOOLEAN DEFAULT FALSE, -- Flag if requester is a department head
  department_id UUID REFERENCES public.departments(id),
  
  -- Participants (JSON array of user IDs who will travel)
  participants JSONB DEFAULT '[]'::jsonb,
  head_included BOOLEAN DEFAULT FALSE, -- Must be true for faculty requests
  
  -- Budget and Expenses
  has_budget BOOLEAN DEFAULT FALSE,
  total_budget DECIMAL(12,2) DEFAULT 0,
  expense_breakdown JSONB DEFAULT '[]'::jsonb, -- Array of {item, amount, description}
  
  -- Vehicle Requirements
  needs_vehicle BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(100), -- e.g., "Van", "Bus", "Car"
  needs_rental BOOLEAN DEFAULT FALSE,
  rental_note TEXT, -- Ma'am TM adds note if renting vehicle
  assigned_vehicle_id UUID REFERENCES public.vehicles(id),
  assigned_driver_id UUID REFERENCES public.users(id),
  
  -- Current Status
  status request_status DEFAULT 'draft',
  current_approver_role VARCHAR(50), -- 'head', 'admin', 'comptroller', 'hr', 'exec'
  
  -- Approval Chain Tracking
  head_approved_at TIMESTAMP WITH TIME ZONE,
  head_approved_by UUID REFERENCES public.users(id),
  head_signature TEXT, -- Base64 signature or URL
  head_comments TEXT,
  
  admin_processed_at TIMESTAMP WITH TIME ZONE,
  admin_processed_by UUID REFERENCES public.users(id), -- Ma'am TM
  admin_comments TEXT,
  
  comptroller_approved_at TIMESTAMP WITH TIME ZONE,
  comptroller_approved_by UUID REFERENCES public.users(id),
  comptroller_comments TEXT,
  comptroller_edited_budget DECIMAL(12,2), -- If comptroller adjusts budget
  
  hr_approved_at TIMESTAMP WITH TIME ZONE,
  hr_approved_by UUID REFERENCES public.users(id),
  hr_signature TEXT,
  hr_comments TEXT,
  
  exec_approved_at TIMESTAMP WITH TIME ZONE,
  exec_approved_by UUID REFERENCES public.users(id),
  exec_signature TEXT,
  exec_comments TEXT,
  
  final_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Rejection tracking
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  rejection_stage VARCHAR(50), -- Which stage was it rejected at
  
  -- Metadata
  is_representative BOOLEAN DEFAULT FALSE, -- If head sent representative
  representative_note TEXT,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (travel_end_date >= travel_start_date),
  CONSTRAINT valid_budget CHECK (total_budget >= 0)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_requests_requester ON public.requests(requester_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_department ON public.requests(department_id);
CREATE INDEX idx_requests_dates ON public.requests(travel_start_date, travel_end_date);
CREATE INDEX idx_requests_created ON public.requests(created_at DESC);

-- ============================================
-- REQUEST HISTORY/AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'created', 'submitted', 'approved_by_head', 'rejected', etc.
  actor_id UUID REFERENCES public.users(id),
  actor_role VARCHAR(50),
  previous_status request_status,
  new_status request_status,
  comments TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_request_history_request ON public.request_history(request_id, created_at DESC);

-- ============================================
-- DEPARTMENT BUDGET TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.department_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  fiscal_year INT NOT NULL,
  total_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_pending DECIMAL(12,2) NOT NULL DEFAULT 0, -- Requests in approval pipeline
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
-- DAILY VEHICLE REQUEST LIMIT TRACKING
-- ============================================
-- NOTE: 5 request limit is ONLY for requests that need vehicles
-- Limited by vehicle availability, not total requests
CREATE TABLE IF NOT EXISTS public.daily_vehicle_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date DATE NOT NULL,
  vehicle_request_count INT NOT NULL DEFAULT 0, -- Only counts requests with needs_vehicle = true
  max_vehicle_requests INT NOT NULL DEFAULT 5, -- 5 vehicle requests per day limit
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_date UNIQUE(request_date),
  CONSTRAINT valid_count CHECK (vehicle_request_count >= 0)
);

-- ============================================
-- HELPER FUNCTION: Generate Request Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_request_number(req_type request_type)
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10);
  year VARCHAR(4);
  sequence_num INT;
  result VARCHAR(50);
BEGIN
  -- Determine prefix based on type
  prefix := CASE req_type
    WHEN 'travel_order' THEN 'TO'
    WHEN 'seminar' THEN 'SEM'
  END;
  
  year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  
  -- Get next sequence number for this type and year
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

-- ============================================
-- HELPER FUNCTION: Determine Next Status
-- ============================================
CREATE OR REPLACE FUNCTION determine_next_status(
  p_requester_is_head BOOLEAN,
  p_has_budget BOOLEAN,
  p_current_status request_status
)
RETURNS request_status AS $$
BEGIN
  -- Workflow logic based on requirements
  
  -- If draft, determine first approval stage
  IF p_current_status = 'draft' THEN
    IF p_requester_is_head THEN
      -- Head request: skip head approval, go to admin
      RETURN 'pending_admin';
    ELSE
      -- Faculty request: must go to head first
      RETURN 'pending_head';
    END IF;
  END IF;
  
  -- After head approval
  IF p_current_status = 'pending_head' THEN
    RETURN 'pending_admin';
  END IF;
  
  -- After admin (Ma'am TM) processing
  IF p_current_status = 'pending_admin' THEN
    IF p_has_budget THEN
      -- Has budget: must go to comptroller
      RETURN 'pending_comptroller';
    ELSE
      -- No budget: skip comptroller, go to HR
      RETURN 'pending_hr';
    END IF;
  END IF;
  
  -- After comptroller approval
  IF p_current_status = 'pending_comptroller' THEN
    RETURN 'pending_hr';
  END IF;
  
  -- After HR approval
  IF p_current_status = 'pending_hr' THEN
    RETURN 'pending_exec';
  END IF;
  
  -- After exec approval
  IF p_current_status = 'pending_exec' THEN
    RETURN 'approved';
  END IF;
  
  -- Default: return current status
  RETURN p_current_status;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_update_timestamp
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER department_budgets_update_timestamp
  BEFORE UPDATE ON public.department_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- TRIGGER: Auto-generate request number on insert
-- ============================================
CREATE OR REPLACE FUNCTION auto_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number(NEW.request_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_auto_number
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_request_number();

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  type VARCHAR(50), -- 'academic' or 'office'
  head_name VARCHAR(255), -- Default head name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For complete departments/offices list, run:
-- \i INSERT-ALL-DEPARTMENTS.sql
-- This will insert all 13 academic departments + 40+ offices

-- ============================================
-- DONE!
-- ============================================
-- This schema supports:
-- ✅ Travel Order and Seminar requests
-- ✅ Different workflows for faculty vs head requesters
-- ✅ Budget-based routing (with/without comptroller)
-- ✅ All approval stages tracked with timestamps and signatures
-- ✅ Department budget management
-- ✅ Daily request limits
-- ✅ Complete audit trail
-- ✅ Vehicle and driver assignment
-- ✅ Auto-generated request numbers
