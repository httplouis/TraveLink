-- Check admin pending requests for badge count
-- Run this in Supabase SQL Editor

-- FIRST: Check what enum values exist for request_status
SELECT 
    enumlabel as status_value
FROM pg_enum
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'request_status'
)
ORDER BY enumsortorder;

-- Check all actual statuses in use
SELECT 
  status,
  COUNT(*) as count
FROM requests
GROUP BY status
ORDER BY count DESC;

-- ✅ COUNT: Requests waiting for admin (badge count)
SELECT COUNT(*) as admin_badge_count
FROM requests
WHERE status = 'pending_admin';

-- ✅ LIST: Show pending_admin requests (what the badge represents)
SELECT 
  id,
  request_number,
  status,
  created_at,
  purpose
FROM requests
WHERE status = 'pending_admin'
ORDER BY created_at DESC
LIMIT 10;

-- Show ALL recent requests
SELECT 
  id,
  request_number,
  status,
  created_at,
  purpose
FROM requests
ORDER BY created_at DESC
LIMIT 20;
