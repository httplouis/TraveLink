-- Update existing notifications to use new URLs with query parameters
-- Run this in Supabase SQL Editor

-- 1. Update all notifications that point to /user/request/{id}
-- Extract the ID and add it as a query parameter
UPDATE notifications
SET action_url = '/user/submissions?view=' || related_id
WHERE action_url LIKE '/user/request/%' 
  AND related_id IS NOT NULL
  AND related_type = 'request';

-- 2. For notifications without related_id, just point to submissions
UPDATE notifications
SET action_url = '/user/submissions'
WHERE action_url LIKE '/user/request/%' 
  AND related_id IS NULL;

-- 3. Update notifications that have /user/submissions WITHOUT ?view= parameter
-- This fixes notifications created with old code
UPDATE notifications
SET action_url = '/user/submissions?view=' || related_id
WHERE action_url = '/user/submissions'
  AND related_id IS NOT NULL
  AND related_type = 'request';

-- 4. Update all notifications that point to /admin/requests/{id}
UPDATE notifications
SET action_url = '/admin/requests'
WHERE action_url LIKE '/admin/requests/%' AND action_url != '/admin/requests';

-- 5. Verify the changes
SELECT 
  id,
  title,
  action_url,
  related_id,
  notification_type,
  created_at
FROM notifications
WHERE related_type = 'request'
ORDER BY created_at DESC
LIMIT 20;
