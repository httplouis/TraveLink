-- ============================================================================
-- TraviLink COMPREHENSIVE RBAC SYSTEM
-- Version: 2025-11-04 (Ground Truth Implementation)
-- ============================================================================

-- ============================================================================
-- 1. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='departments' AND column_name='is_active') THEN
        ALTER TABLE public.departments ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.departments IS 'Authoritative department list (internal source of truth)';

-- ============================================================================
-- 2. DEPARTMENT_HEADS TABLE (Many-to-Many: User can be head of multiple depts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.department_heads (
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(department_id, user_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_dept_heads_dept ON public.department_heads(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_heads_user ON public.department_heads(user_id);
-- Index for active heads (valid_to IS NULL means still active)
CREATE INDEX IF NOT EXISTS idx_dept_heads_active ON public.department_heads(department_id, user_id) 
    WHERE valid_to IS NULL;
-- General index on validity dates for range queries
CREATE INDEX IF NOT EXISTS idx_dept_heads_valid ON public.department_heads(department_id, valid_from, valid_to);

COMMENT ON TABLE public.department_heads IS 'Department head mappings with validity periods (many heads per dept supported)';

-- ============================================================================
-- 3. ROLE_GRANTS TABLE (Explicit role assignments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('head', 'hr', 'comptroller', 'exec', 'admin')),
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES public.users(id),
    reason TEXT,
    UNIQUE(user_id, role) -- One active grant per role per user
);

CREATE INDEX IF NOT EXISTS idx_role_grants_user ON public.role_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_role_grants_active ON public.role_grants(user_id, role) 
    WHERE revoked_at IS NULL;

COMMENT ON TABLE public.role_grants IS 'Explicit role grants (no self-declaration). Only Admin or approved pipeline can create.';

-- ============================================================================
-- 4. ROSTER_HEADS TABLE (Authoritative roster for auto-grant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roster_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    head_email VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    invited_token VARCHAR(100) UNIQUE,
    token_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(department_id, head_email)
);

CREATE INDEX IF NOT EXISTS idx_roster_email ON public.roster_heads(LOWER(head_email));
CREATE INDEX IF NOT EXISTS idx_roster_active ON public.roster_heads(is_active, valid_from, valid_to) 
    WHERE is_active = TRUE;

COMMENT ON TABLE public.roster_heads IS 'Authoritative roster for auto-granting head role on login (exact email match)';

-- ============================================================================
-- 5. ROLE_GRANT_REQUESTS TABLE (For dual-control approval)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_grant_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('head', 'hr', 'comptroller', 'exec')),
    department_id UUID REFERENCES public.departments(id), -- Only for 'head' role
    proof_document TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_grant_requests_user ON public.role_grant_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_grant_requests_status ON public.role_grant_requests(status);

-- ============================================================================
-- 6. ROLE_GRANT_APPROVALS TABLE (Dual-control: 2 approvers required)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_grant_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.role_grant_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public.users(id),
    action VARCHAR(10) CHECK (action IN ('approve', 'reject')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_grant_approvals_request ON public.role_grant_approvals(request_id);

-- ============================================================================
-- 7. UPDATE USERS TABLE (Add department_id reference)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='department_id') THEN
        ALTER TABLE public.users ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role_base') THEN
        ALTER TABLE public.users ADD COLUMN role_base VARCHAR(20) DEFAULT 'faculty' 
            CHECK (role_base IN ('faculty', 'driver', 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 8. UPDATE REQUESTS TABLE (Add department_id, total_budget, vehicle_mode)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='requests' AND column_name='department_id') THEN
        ALTER TABLE public.requests ADD COLUMN department_id UUID REFERENCES public.departments(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='requests' AND column_name='total_budget') THEN
        ALTER TABLE public.requests ADD COLUMN total_budget NUMERIC(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='requests' AND column_name='vehicle_mode') THEN
        ALTER TABLE public.requests ADD COLUMN vehicle_mode VARCHAR(20) DEFAULT 'none' 
            CHECK (vehicle_mode IN ('none', 'car', 'van', 'bus', 'other'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='requests' AND column_name='requester_id') THEN
        ALTER TABLE public.requests ADD COLUMN requester_id UUID REFERENCES public.users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_requests_department ON public.requests(department_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON public.requests(requester_id);

-- ============================================================================
-- 9. CREATE APPROVALS TABLE (If it doesn't exist or is a view, create proper table)
-- ============================================================================
DO $$ 
BEGIN
    -- Drop view if it exists
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name='approvals') THEN
        DROP VIEW IF EXISTS public.approvals CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    step VARCHAR(20) NOT NULL CHECK (step IN ('head', 'comptroller', 'hr', 'exec')),
    approver_id UUID NOT NULL REFERENCES public.users(id),
    action VARCHAR(10) CHECK (action IN ('approve', 'reject', 'pending')),
    reason TEXT,
    signature TEXT, -- Base64 signature
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, step, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_approvals_request ON public.approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_step ON public.approvals(step, action);

-- ============================================================================
-- 10. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 11. SEED DATA (Sample Departments)
-- ============================================================================

-- First, make problematic columns nullable if they exist (for existing tables)
DO $$ 
BEGIN
    -- Make campus_id nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='departments' AND column_name='campus_id') THEN
        ALTER TABLE public.departments ALTER COLUMN campus_id DROP NOT NULL;
    END IF;
    
    -- Make type nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='departments' AND column_name='type') THEN
        ALTER TABLE public.departments ALTER COLUMN type DROP NOT NULL;
    END IF;
END $$;

-- Insert departments (campus_id and type will be NULL if columns exist)
INSERT INTO public.departments (code, name, is_active) VALUES
    ('CNAHS', 'College of Nursing and Allied Health Sciences', TRUE),
    ('COE', 'College of Engineering', TRUE),
    ('CBAA', 'College of Business Administration and Accountancy', TRUE),
    ('CTED', 'College of Teacher Education', TRUE),
    ('CCMS', 'College of Computer and Mathematical Sciences', TRUE),
    ('ADMIN', 'Administrative Office', TRUE),
    ('HR', 'Human Resources', TRUE),
    ('FINANCE', 'Finance and Comptroller', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get active heads for a department
CREATE OR REPLACE FUNCTION get_active_heads(dept_id UUID, at_time TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS TABLE(user_id UUID, is_primary BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT dh.user_id, dh.is_primary
    FROM department_heads dh
    WHERE dh.department_id = dept_id
      AND at_time >= dh.valid_from
      AND (dh.valid_to IS NULL OR at_time <= dh.valid_to);
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user has active role grant
CREATE OR REPLACE FUNCTION has_role_grant(uid UUID, role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM role_grants
        WHERE user_id = uid
          AND role = role_name
          AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) - Basic Setup
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE public.role_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_heads ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY admin_all_role_grants ON public.role_grants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY admin_all_roster ON public.roster_heads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY admin_all_dept_heads ON public.department_heads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Users can view their own grants
CREATE POLICY view_own_grants ON public.role_grants
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('departments', 'department_heads', 'role_grants', 'roster_heads', 'approvals')
ORDER BY table_name;

-- Check users table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('department_id', 'role_base', 'is_active', 'signature')
ORDER BY column_name;

-- Check requests table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN ('department_id', 'total_budget', 'vehicle_mode', 'requester_id')
ORDER BY column_name;
