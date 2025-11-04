-- ============================================
-- ADD pending_parent_head TO request_status ENUM
-- ============================================
-- This adds the new status for parent department head approval
-- Run this BEFORE adding parent_department_id columns!

-- Add new enum value to request_status
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_parent_head';

-- Verify it was added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'request_status'::regtype
ORDER BY enumsortorder;

-- Expected output should include:
-- draft
-- pending_head
-- pending_parent_head  ← NEW!
-- pending_admin
-- pending_comptroller
-- pending_hr
-- pending_exec
-- approved
-- rejected
-- cancelled

-- ✅ After running this, the head API should work!
