-- TraviLink RBAC System - Database Setup Script
-- This script adds necessary columns and ensures proper role flags for the RBAC system

-- ============================================================================
-- USERS TABLE: Add role flag columns if they don't exist
-- ============================================================================

-- Add is_head column (boolean flag for department heads)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_head') THEN
        ALTER TABLE public.users ADD COLUMN is_head BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_hr column (boolean flag for HR personnel)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_hr') THEN
        ALTER TABLE public.users ADD COLUMN is_hr BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_exec column (boolean flag for executives)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_exec') THEN
        ALTER TABLE public.users ADD COLUMN is_exec BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- REQUESTS TABLE: Ensure current_status column accepts all workflow states
-- ============================================================================

-- Update current_status to allow all workflow states
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='requests' AND column_name='current_status') THEN
        
        ALTER TABLE public.requests 
        ALTER COLUMN current_status TYPE TEXT;
        
        COMMENT ON COLUMN public.requests.current_status IS 
        'Workflow states: draft, pending_head, head_approved, admin_review, comptroller_pending, hr_pending, executive_pending, approved, rejected';
    END IF;
END $$;

-- ============================================================================
-- SAMPLE DATA: Create test users with role flags (OPTIONAL - for testing)
-- ============================================================================

-- Example: Set a user as department head
-- UPDATE public.users SET is_head = TRUE WHERE email = 'head@example.com';

-- Example: Set a user as HR personnel
-- UPDATE public.users SET is_hr = TRUE WHERE email = 'hr@example.com';

-- Example: Set a user as executive
-- UPDATE public.users SET is_exec = TRUE WHERE email = 'exec@example.com';

-- Example: Set a user as admin
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================================================
-- INDEXES: Add indexes for better query performance
-- ============================================================================

-- Index on is_head for quick lookup of department heads
CREATE INDEX IF NOT EXISTS idx_users_is_head ON public.users(is_head) WHERE is_head = TRUE;

-- Index on is_hr for quick lookup of HR personnel
CREATE INDEX IF NOT EXISTS idx_users_is_hr ON public.users(is_hr) WHERE is_hr = TRUE;

-- Index on is_exec for quick lookup of executives
CREATE INDEX IF NOT EXISTS idx_users_is_exec ON public.users(is_exec) WHERE is_exec = TRUE;

-- Index on current_status for efficient filtering of requests by status
CREATE INDEX IF NOT EXISTS idx_requests_current_status ON public.requests(current_status);

-- Index on created_at for sorting requests by date
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if role flag columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('is_head', 'is_hr', 'is_exec')
ORDER BY column_name;

-- Count users by role flags
SELECT 
    COUNT(*) FILTER (WHERE is_head = TRUE) as head_count,
    COUNT(*) FILTER (WHERE is_hr = TRUE) as hr_count,
    COUNT(*) FILTER (WHERE is_exec = TRUE) as exec_count,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) as total_users
FROM public.users;

-- Count requests by status
SELECT 
    current_status, 
    COUNT(*) as count
FROM public.requests
GROUP BY current_status
ORDER BY count DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These role flags (is_head, is_hr, is_exec) work alongside the main 'role' column
-- 2. A user can be 'faculty' role but also have is_head=TRUE (faculty who is a department head)
-- 3. Admin users (role='admin') have access to all areas regardless of flags
-- 4. The current_status field tracks the approval workflow state
-- 5. Run this script in your PostgreSQL/Supabase database
