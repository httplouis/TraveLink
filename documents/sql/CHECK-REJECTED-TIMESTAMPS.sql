-- Check rejected requests and their timestamps
-- Run this in Supabase SQL Editor to see if rejected_at is NULL

SELECT 
  request_number,
  status,
  rejected_at,
  rejected_by,
  rejection_reason,
  rejection_stage,
  head_comments,
  created_at,
  updated_at
FROM public.requests
WHERE status = 'rejected'
ORDER BY updated_at DESC
LIMIT 10;

-- If rejected_at is NULL for all, need to backfill:
-- UPDATE public.requests
-- SET 
--   rejected_at = updated_at,
--   rejection_reason = COALESCE(head_comments, 'Rejected by department head')
-- WHERE status = 'rejected' AND rejected_at IS NULL;
