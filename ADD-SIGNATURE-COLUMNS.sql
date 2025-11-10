-- ============================================
-- ADD SIGNATURE COLUMNS TO REQUESTS TABLE
-- Run this in Supabase SQL Editor NOW!
-- ============================================

-- Add signature columns for all approvers
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS head_signature TEXT,
ADD COLUMN IF NOT EXISTS parent_head_signature TEXT,
ADD COLUMN IF NOT EXISTS admin_signature TEXT,
ADD COLUMN IF NOT EXISTS comptroller_signature TEXT,
ADD COLUMN IF NOT EXISTS hr_signature TEXT,
ADD COLUMN IF NOT EXISTS executive_signature TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.requests.head_signature IS 'Digital signature of department head approver';
COMMENT ON COLUMN public.requests.parent_head_signature IS 'Digital signature of parent department head';
COMMENT ON COLUMN public.requests.admin_signature IS 'Digital signature of admin approver';
COMMENT ON COLUMN public.requests.comptroller_signature IS 'Digital signature of comptroller';
COMMENT ON COLUMN public.requests.hr_signature IS 'Digital signature of HR officer';
COMMENT ON COLUMN public.requests.executive_signature IS 'Digital signature of executive approver';

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name LIKE '%signature%'
ORDER BY column_name;

-- Migration complete!
-- Now refresh your app and make NEW approvals to see signatures!
