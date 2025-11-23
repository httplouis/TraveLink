-- ============================================================================
-- HEAD ROLE REQUESTS TABLE
-- Allows any user to request to become a department head
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.head_role_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id), -- NULL means general head request
    reason TEXT NOT NULL, -- Why they want to be a head
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id), -- Superadmin who reviewed
    review_comments TEXT, -- Comments from superadmin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_head_role_requests_user ON public.head_role_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_head_role_requests_status ON public.head_role_requests(status);
CREATE INDEX IF NOT EXISTS idx_head_role_requests_department ON public.head_role_requests(department_id);

COMMENT ON TABLE public.head_role_requests IS 'Requests from users to become department heads';
COMMENT ON COLUMN public.head_role_requests.department_id IS 'Specific department (NULL = general head request)';
COMMENT ON COLUMN public.head_role_requests.reason IS 'User-provided reason for requesting head role';

-- ============================================================================
-- DONE!
-- ============================================================================

