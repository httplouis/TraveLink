-- ============================================
-- MIGRATION: Add Workflow Enhancements
-- ============================================
-- Purpose: Add fields for habol travel orders, budget history, multiple VPs,
--          urgent/priority flags, return functionality, and comptroller request privilege
-- Date: 2025-01-XX
-- Related: TraviLink System Enhancements Plan

-- ============================================
-- 1. ADD HABOL (CATCH-UP) TRAVEL ORDERS SUPPORT
-- ============================================
-- Allows linking travel orders with same destination/vehicle

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS parent_request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_parent_request 
ON public.requests(parent_request_id) 
WHERE parent_request_id IS NOT NULL;

COMMENT ON COLUMN public.requests.parent_request_id IS 
'For habol (catch-up) travel orders: links to parent request with same destination/vehicle';

-- ============================================
-- 2. ADD BUDGET HISTORY TRACKING
-- ============================================
-- Track budget changes made by comptroller

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS budget_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.requests.budget_history IS 
'Array of budget change records: [{original: number, new: number, changed_by: uuid, changed_at: timestamp, reason: string}]';

-- ============================================
-- 3. ADD SECOND VP APPROVAL SUPPORT
-- ============================================
-- Support multiple VPs from different departments

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS vp2_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS vp2_signature TEXT,
ADD COLUMN IF NOT EXISTS vp2_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_vp2_approved_by 
ON public.requests(vp2_approved_by) 
WHERE vp2_approved_by IS NOT NULL;

COMMENT ON COLUMN public.requests.vp2_approved_by IS 
'Second VP approver for multi-department requests (e.g., VP Academics and VP Admin)';
COMMENT ON COLUMN public.requests.vp2_signature IS 
'Digital signature of second VP approver';
COMMENT ON COLUMN public.requests.vp2_approved_at IS 
'Timestamp when second VP approved the request';

-- ============================================
-- 4. ADD RETURN TO SENDER FUNCTIONALITY
-- ============================================
-- Track when requests are returned to requester for editing

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS returned_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_requests_returned_at 
ON public.requests(returned_at) 
WHERE returned_at IS NOT NULL;

COMMENT ON COLUMN public.requests.returned_at IS 
'Timestamp when request was returned to requester for editing';
COMMENT ON COLUMN public.requests.return_reason IS 
'Reason for returning the request to requester';
COMMENT ON COLUMN public.requests.returned_by IS 
'User ID who returned the request';

-- ============================================
-- 5. ADD URGENT AND PRIORITY FLAGS
-- ============================================
-- For VP and President urgent/priority requests

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_requests_urgent 
ON public.requests(is_urgent) 
WHERE is_urgent = true;

CREATE INDEX IF NOT EXISTS idx_requests_priority 
ON public.requests(is_priority) 
WHERE is_priority = true;

COMMENT ON COLUMN public.requests.is_urgent IS 
'Urgent flag set by VP/President for expedited workflow';
COMMENT ON COLUMN public.requests.is_priority IS 
'Priority flag set by VP/President for high-priority requests';

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration

-- Check all new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'requests'
  AND column_name IN (
    'parent_request_id',
    'budget_history',
    'vp2_approved_by',
    'vp2_signature',
    'vp2_approved_at',
    'returned_at',
    'return_reason',
    'returned_by',
    'is_urgent',
    'is_priority'
  )
ORDER BY column_name;

-- Check indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'requests'
  AND indexname IN (
    'idx_requests_parent_request',
    'idx_requests_vp2_approved_by',
    'idx_requests_returned_at',
    'idx_requests_urgent',
    'idx_requests_priority'
  );

-- ============================================
-- ✅ MIGRATION COMPLETE
-- ============================================
-- All new fields have been added to support:
-- - Habol (catch-up) travel orders
-- - Budget history tracking
-- - Multiple VP approvals
-- - Return to sender functionality
-- - Urgent/Priority flags for VP/President

