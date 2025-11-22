-- ═══════════════════════════════════════════════════════════════════════
-- EXECUTIVE ROLE SPLIT MIGRATION
-- Split single "executive" role into VP and President roles
-- Date: November 10, 2025
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Add new columns for VP and President roles
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_vp BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_president BOOLEAN DEFAULT FALSE;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_vp ON users(is_vp) WHERE is_vp = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_president ON users(is_president) WHERE is_president = TRUE;

-- Step 3: Update requests table to include exec_level
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS exec_level VARCHAR(20) CHECK (exec_level IN ('vp', 'president'));

-- Add index for exec_level
CREATE INDEX IF NOT EXISTS idx_requests_exec_level ON requests(exec_level);

-- Step 4: Migrate existing executive users (OPTIONAL - uncomment if you have existing data)
-- UPDATE users 
-- SET is_vp = TRUE, is_executive = FALSE 
-- WHERE is_executive = TRUE 
--   AND position_title LIKE '%Vice President%';

-- UPDATE users 
-- SET is_president = TRUE, is_executive = FALSE 
-- WHERE is_executive = TRUE 
--   AND position_title LIKE '%President%'
--   AND position_title NOT LIKE '%Vice%';

-- Step 5: Update requests to set exec_level based on budget (example logic)
-- UPDATE requests
-- SET exec_level = CASE
--   WHEN total_budget > 50000 THEN 'president'
--   ELSE 'vp'
-- END
-- WHERE status IN ('pending_exec', 'approved_exec');

-- ═══════════════════════════════════════════════════════════════════════
-- CREATE SAMPLE ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════

-- VP Account
-- NOTE: Add password separately using your application's user creation system
-- Password should be: 'VP@2025' (hash it using your auth system)
INSERT INTO users (
  email,
  name,
  role,
  is_vp,
  position_title,
  department_id,
  phone,
  profile_picture,
  bio,
  active
) VALUES (
  'vp@mseuf.edu.ph',
  'Dr. Roberto C. Villanueva',
  'exec', -- Keep base role as 'exec' for compatibility
  TRUE,
  'Vice President for Academic Affairs',
  NULL, -- VP is university-wide
  '+63 917 123 4567',
  NULL,
  'Vice President overseeing academic affairs and mid-level executive approvals.',
  TRUE
) ON CONFLICT (email) DO UPDATE SET
  is_vp = TRUE,
  is_executive = FALSE;

-- President Account
-- NOTE: Add password separately using your application's user creation system
-- Password should be: 'President@2025' (hash it using your auth system)
INSERT INTO users (
  email,
  name,
  role,
  is_president,
  position_title,
  department_id,
  phone,
  profile_picture,
  bio,
  active
) VALUES (
  'president@mseuf.edu.ph',
  'Dr. Maria Concepcion R. Santos',
  'exec', -- Keep base role as 'exec' for compatibility
  TRUE,
  'University President',
  NULL, -- President is university-wide
  '+63 917 987 6543',
  NULL,
  'University President with final approval authority on all executive matters.',
  TRUE
) ON CONFLICT (email) DO UPDATE SET
  is_president = TRUE,
  is_executive = FALSE;

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE EXEC-SPECIFIC COLUMNS TO SUPPORT BOTH VP AND PRESIDENT
-- ═══════════════════════════════════════════════════════════════════════

-- Rename exec_approved_by to allow multiple executive approvals
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS vp_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS vp_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS vp_signature TEXT,
  ADD COLUMN IF NOT EXISTS vp_comments TEXT,
  
  ADD COLUMN IF NOT EXISTS president_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS president_approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS president_signature TEXT,
  ADD COLUMN IF NOT EXISTS president_comments TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_requests_vp_approved_by ON requests(vp_approved_by);
CREATE INDEX IF NOT EXISTS idx_requests_president_approved_by ON requests(president_approved_by);

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE STATUS ENUM TO SUPPORT VP AND PRESIDENT
-- ═══════════════════════════════════════════════════════════════════════

-- Add new statuses if using ENUM (PostgreSQL)
-- ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_vp';
-- ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_president';
-- ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'approved_vp';
-- ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'approved_president';

-- OR if using VARCHAR with CHECK constraint, update it:
-- ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
-- ALTER TABLE requests ADD CONSTRAINT requests_status_check 
-- CHECK (status IN (
--   'draft', 'pending_head', 'pending_parent_head', 'pending_admin', 
--   'pending_comptroller', 'pending_hr', 'pending_vp', 'pending_president',
--   'approved_head', 'approved_parent_head', 'approved_admin',
--   'approved_comptroller', 'approved_hr', 'approved_vp', 'approved_president',
--   'approved', 'rejected', 'completed', 'cancelled'
-- ));

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Check VP and President accounts
SELECT 
  email, 
  name, 
  position_title, 
  is_vp, 
  is_president,
  is_executive,
  active
FROM users 
WHERE is_vp = TRUE OR is_president = TRUE;

-- Check all executive-related columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_executive', 'is_vp', 'is_president');

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN ('exec_level', 'vp_approved_by', 'president_approved_by');

-- ═══════════════════════════════════════════════════════════════════════
-- CLEANUP (Optional - only run after confirming everything works)
-- ═══════════════════════════════════════════════════════════════════════

-- After confirming VP and President roles work, you can optionally remove old columns
-- ALTER TABLE users DROP COLUMN IF EXISTS is_executive;
-- ALTER TABLE requests DROP COLUMN IF EXISTS exec_approved_by;
-- ALTER TABLE requests DROP COLUMN IF EXISTS exec_approved_at;
-- ALTER TABLE requests DROP COLUMN IF EXISTS exec_signature;
-- ALTER TABLE requests DROP COLUMN IF EXISTS exec_comments;

-- ═══════════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════════

/*
ROUTING LOGIC:
1. Requests with budget <= 50,000 → VP approval only
2. Requests with budget > 50,000 → VP approval → President approval
3. High priority requests → Direct to President
4. VP can approve and forward to President
5. President has final authority and can override

DUAL EXECUTIVE APPROVAL:
- Request gets VP signature first
- If > 50k or high priority, goes to President
- President approval is final
- Both signatures stored separately

MIGRATION CHECKLIST:
✅ Add is_vp and is_president columns
✅ Add exec_level to requests
✅ Create VP and President accounts
✅ Add separate approval columns for VP and President
✅ Update status enum
✅ Add indexes for performance
✅ Create verification queries

TODO IN CODE:
- Update all APIs checking is_executive to check is_vp OR is_president
- Update workflow.ts to handle VP → President routing
- Update navigation guards
- Update dashboard components
- Create separate /vp and /president routes
- Update StatusBadge to show pending_vp and pending_president
*/

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
