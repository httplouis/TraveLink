-- =====================================================
-- ADD ALL SIGNATURE COLUMNS TO REQUESTS TABLE
-- =====================================================
-- This migration adds ALL signature columns to store
-- signature images (as base64 data URLs) for:
-- - Requester (person submitting)
-- - Department Head
-- - Parent Department Head
-- - HR Manager
-- - Executive/President
-- - Admin/Comptroller/Transport Manager
--
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. REQUESTER SIGNATURE
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS requester_signature TEXT;

COMMENT ON COLUMN requests.requester_signature IS 'Base64 data URL of requester signature (person submitting the request)';

-- 2. DEPARTMENT HEAD SIGNATURE
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS head_signature TEXT;

COMMENT ON COLUMN requests.head_signature IS 'Base64 data URL of department head signature (first approval)';

-- 3. PARENT DEPARTMENT HEAD SIGNATURE (for offices with hierarchy)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS parent_head_signature TEXT;

COMMENT ON COLUMN requests.parent_head_signature IS 'Base64 data URL of parent department head signature (for sub-offices)';

-- 4. HR SIGNATURE
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS hr_signature TEXT;

COMMENT ON COLUMN requests.hr_signature IS 'Base64 data URL of HR manager signature';

-- 5. EXECUTIVE SIGNATURE (President/Vice President)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS exec_signature TEXT;

COMMENT ON COLUMN requests.exec_signature IS 'Base64 data URL of executive signature (President/VP)';

-- 6. ADMIN SIGNATURE (Comptroller/Transport Manager)
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS admin_signature TEXT;

COMMENT ON COLUMN requests.admin_signature IS 'Base64 data URL of admin signature (Comptroller/Transport)';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Verify all signature columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name LIKE '%signature%'
ORDER BY column_name;

-- Expected output:
-- column_name             | data_type | is_nullable | column_default
-- ------------------------|-----------|-------------|---------------
-- admin_signature         | text      | YES         | NULL
-- exec_signature          | text      | YES         | NULL
-- head_signature          | text      | YES         | NULL
-- hr_signature            | text      | YES         | NULL
-- parent_head_signature   | text      | YES         | NULL
-- requester_signature     | text      | YES         | NULL

-- =====================================================
-- CHECK EXISTING APPROVAL COLUMNS
-- =====================================================
-- These columns should already exist (for timestamps and IDs)
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'requests'
  AND (
    column_name LIKE '%approved%' 
    OR column_name LIKE '%rejected%'
    OR column_name LIKE '%comments%'
  )
ORDER BY column_name;

-- Should show columns like:
-- head_approved_at, head_approved_by, head_comments
-- hr_approved_at, hr_approved_by, hr_comments
-- exec_approved_at, exec_approved_by, exec_comments
-- admin_approved_at, admin_approved_by, admin_comments
-- etc.

-- =====================================================
-- SAMPLE DATA CHECK
-- =====================================================
-- Check if any requests have signatures already
SELECT 
  id,
  request_number,
  requester_name,
  status,
  CASE WHEN requester_signature IS NOT NULL THEN '✅ Has signature' ELSE '❌ No signature' END as req_sig,
  CASE WHEN head_signature IS NOT NULL THEN '✅ Has signature' ELSE '❌ No signature' END as head_sig,
  CASE WHEN hr_signature IS NOT NULL THEN '✅ Has signature' ELSE '❌ No signature' END as hr_sig,
  CASE WHEN admin_signature IS NOT NULL THEN '✅ Has signature' ELSE '❌ No signature' END as admin_sig
FROM requests
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this migration:
-- 
-- 1. In src/app/api/requests/submit/route.ts (line 198):
--    Uncomment:
--    requester_signature: travelOrder.requesterSignature || null,
--
-- 2. In src/app/api/head/route.ts:
--    Already uses: head_signature and parent_head_signature ✅
--
-- 3. In src/app/api/hr/route.ts:
--    Should use: hr_signature
--
-- 4. In src/app/api/admin/route.ts:
--    Should use: admin_signature
--
-- 5. In src/app/api/exec/route.ts:
--    Should use: exec_signature
--
-- All signature fields are now ready! 🎉
-- =====================================================
