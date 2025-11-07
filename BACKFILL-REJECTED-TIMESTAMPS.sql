-- Backfill rejected_at timestamps for old rejected requests
-- This will use updated_at as the rejection time since we don't have exact time

UPDATE public.requests
SET 
  rejected_at = updated_at,  -- Use updated_at as best guess for when it was rejected
  rejection_reason = COALESCE(head_comments, 'Rejected by department head'),  -- Use head_comments if exists
  rejection_stage = 'pending_head'  -- Assume all were rejected at head stage
WHERE status = 'rejected' 
  AND rejected_at IS NULL;

-- Check results
SELECT 
  request_number,
  status,
  rejected_at,
  rejection_reason,
  head_comments,
  updated_at
FROM public.requests
WHERE status = 'rejected'
ORDER BY rejected_at DESC
LIMIT 10;
