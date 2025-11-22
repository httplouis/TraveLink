-- ============================================
-- Check if HR is receiving requests
-- ============================================

-- 1. Check what request statuses exist
SELECT DISTINCT status, COUNT(*) as count
FROM requests
GROUP BY status
ORDER BY count DESC;

-- 2. Check specifically for pending_hr
SELECT COUNT(*) as pending_hr_count
FROM requests
WHERE status = 'pending_hr';

-- 3. Show sample pending_hr requests (if any)
SELECT 
    id,
    request_number,
    requester_name,
    status,
    has_budget,
    comptroller_approved_at,
    hr_approved_at,
    created_at
FROM requests
WHERE status = 'pending_hr'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check requests that SHOULD be at HR (approved by comptroller)
SELECT 
    id,
    request_number,
    requester_name,
    status,
    has_budget,
    comptroller_approved_at,
    hr_approved_at
FROM requests
WHERE comptroller_approved_at IS NOT NULL
  AND hr_approved_at IS NULL
ORDER BY comptroller_approved_at DESC
LIMIT 10;

-- 5. Check the request_status enum type
SELECT 
    enumlabel as status_value
FROM pg_enum
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'request_status'
)
ORDER BY enumsortorder;

-- 6. Trace a request through workflow
-- Find a request that went through comptroller
SELECT 
    r.request_number,
    r.status,
    r.has_budget,
    r.head_approved_at,
    r.admin_processed_at,
    r.comptroller_approved_at,
    r.hr_approved_at,
    r.exec_approved_at,
    r.created_at
FROM requests r
WHERE r.has_budget = true
  AND r.comptroller_approved_at IS NOT NULL
ORDER BY r.comptroller_approved_at DESC
LIMIT 5;
