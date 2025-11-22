-- Backfill admin_processed_at and admin_processed_by for existing requests
-- This fixes the "No data available" issue in the tracking timeline

-- Update requests that have admin_approved_at but missing admin_processed_at
UPDATE requests
SET 
  admin_processed_at = admin_approved_at,
  admin_processed_by = admin_approved_by,
  admin_comments = COALESCE(admin_comments, admin_notes)
WHERE 
  admin_approved_at IS NOT NULL 
  AND admin_processed_at IS NULL;

-- Verify the update
SELECT 
  request_number,
  status,
  admin_approved_at,
  admin_processed_at,
  admin_approved_by,
  admin_processed_by
FROM requests
WHERE admin_approved_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
