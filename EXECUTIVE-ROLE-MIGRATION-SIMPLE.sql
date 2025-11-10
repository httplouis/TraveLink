-- ═══════════════════════════════════════════════════════════════════════
-- EXECUTIVE ROLE SPLIT MIGRATION (SIMPLIFIED)
-- Only adds columns - Create users manually in Supabase Auth UI
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

-- Step 4: Add separate approval columns for VP and President
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
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Check if columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_vp', 'is_president');

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN ('exec_level', 'vp_approved_by', 'president_approved_by');

-- ═══════════════════════════════════════════════════════════════════════
-- NEXT STEPS - DO THESE MANUALLY IN SUPABASE
-- ═══════════════════════════════════════════════════════════════════════

/*

1. GO TO SUPABASE DASHBOARD → Authentication → Users → Add User

2. CREATE VP ACCOUNT:
   Email: vp@mseuf.edu.ph
   Password: VP@2025
   
   Then run this SQL to update the role:
   
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{is_vp}',
     'true'::jsonb
   )
   WHERE email = 'vp@mseuf.edu.ph';
   
   UPDATE users 
   SET is_vp = TRUE, 
       name = 'Dr. Roberto C. Villanueva',
       position_title = 'Vice President for Academic Affairs',
       role = 'exec'
   WHERE email = 'vp@mseuf.edu.ph';

3. CREATE PRESIDENT ACCOUNT:
   Email: president@mseuf.edu.ph
   Password: President@2025
   
   Then run this SQL to update the role:
   
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{is_president}',
     'true'::jsonb
   )
   WHERE email = 'president@mseuf.edu.ph';
   
   UPDATE users 
   SET is_president = TRUE,
       name = 'Dr. Maria Concepcion R. Santos',
       position_title = 'University President',
       role = 'exec'
   WHERE email = 'president@mseuf.edu.ph';

*/

-- ═══════════════════════════════════════════════════════════════════════
-- AFTER CREATING USERS, VERIFY WITH THIS:
-- ═══════════════════════════════════════════════════════════════════════

SELECT 
  email, 
  name, 
  position_title, 
  is_vp, 
  is_president,
  role
FROM users 
WHERE is_vp = TRUE OR is_president = TRUE;

-- Expected output:
-- vp@mseuf.edu.ph         | Dr. Roberto C. Villanueva        | Vice President... | TRUE  | FALSE | exec
-- president@mseuf.edu.ph  | Dr. Maria Concepcion R. Santos   | University...     | FALSE | TRUE  | exec

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
