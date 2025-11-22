-- ============================================
-- ADD VP SIGNATURE TRACKING
-- Phase 1.5: Add vp2_approved_by and vp_signature_required_count
-- ============================================

-- Add vp2_approved_by for second VP approval (if needed)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vp2_approved_by UUID REFERENCES public.users(id);

-- Add vp2_approved_at timestamp
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vp2_approved_at TIMESTAMP WITH TIME ZONE;

-- Add vp2_signature
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vp2_signature TEXT;

-- Add vp2_comments
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vp2_comments TEXT;

-- Add both_vps_approved flag (for multi-VP scenarios)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS both_vps_approved BOOLEAN DEFAULT FALSE;

-- Add vp_signature_required_count (default 1 - only one VP signature needed)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vp_signature_required_count INT DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN public.requests.vp2_approved_by IS 'Second VP approver (if multiple VPs involved)';
COMMENT ON COLUMN public.requests.vp2_approved_at IS 'Timestamp when second VP approved';
COMMENT ON COLUMN public.requests.vp2_signature IS 'Digital signature of second VP';
COMMENT ON COLUMN public.requests.vp2_comments IS 'Comments from second VP';
COMMENT ON COLUMN public.requests.both_vps_approved IS 'Flag indicating both VPs have approved (for multi-department requests)';
COMMENT ON COLUMN public.requests.vp_signature_required_count IS 'Number of VP signatures required (default 1 - only one VP needs to sign)';

-- Create index for vp2 queries
CREATE INDEX IF NOT EXISTS idx_requests_vp2_approved_by ON public.requests(vp2_approved_by) WHERE vp2_approved_by IS NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'vp2_approved_by',
    'vp2_approved_at',
    'vp2_signature',
    'vp2_comments',
    'both_vps_approved',
    'vp_signature_required_count'
  )
ORDER BY column_name;

-- Verify index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'requests' 
  AND indexname = 'idx_requests_vp2_approved_by';

-- Migration complete!
-- VP Signature Logic:
-- - vp_signature_required_count = 1 (default) means only one VP signature needed
-- - If multiple VPs involved, first VP to sign sets both_vps_approved = true
-- - Request proceeds to President after any VP approval

