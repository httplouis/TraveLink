-- Check VP vs President timestamps for approved requests
SELECT 
  request_number,
  status,
  vp_approved_at,
  president_approved_at,
  exec_approved_at,
  final_approved_at,
  vp_approved_by,
  president_approved_by,
  exec_approved_by,
  -- Time differences
  CASE 
    WHEN vp_approved_at IS NOT NULL AND president_approved_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (president_approved_at - vp_approved_at))
    ELSE NULL 
  END as seconds_difference_vp_to_president,
  -- Check if they're exactly the same
  CASE 
    WHEN vp_approved_at = president_approved_at THEN 'SAME TIME'
    WHEN vp_approved_at IS NULL THEN 'VP NOT APPROVED'
    WHEN president_approved_at IS NULL THEN 'PRESIDENT NOT APPROVED'
    ELSE 'DIFFERENT TIMES'
  END as timestamp_status
FROM requests 
WHERE status = 'approved' 
AND vp_approved_at IS NOT NULL 
AND president_approved_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
