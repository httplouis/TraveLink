-- ═══════════════════════════════════════════════════════════════════════
-- TraviLink Design System v2.0 - Database Schema Migration
-- ═══════════════════════════════════════════════════════════════════════
-- Date: November 10, 2025
-- Purpose: Add all new fields for multi-role workflow, profile enhancements,
--          transportation fields, and executive hierarchy
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. USERS TABLE ADDITIONS
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users
  -- Profile enhancements
  ADD COLUMN IF NOT EXISTS profile_picture TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS position_title TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP,
  
  -- Executive role distinction
  ADD COLUMN IF NOT EXISTS exec_type TEXT CHECK (exec_type IN ('vp', 'president', NULL));

COMMENT ON COLUMN users.profile_picture IS 'URL or base64 encoded profile picture';
COMMENT ON COLUMN users.exec_type IS 'Executive level: vp (Vice President) or president (COO)';

-- ═══════════════════════════════════════════════════════════════════════
-- 2. DEPARTMENTS TABLE ADDITIONS
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE departments
  -- Parent department hierarchy
  ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id),
  ADD COLUMN IF NOT EXISTS department_type TEXT CHECK (department_type IN ('college', 'office', 'unit', NULL)),
  ADD COLUMN IF NOT EXISTS requires_parent_approval BOOLEAN DEFAULT false;

COMMENT ON COLUMN departments.parent_department_id IS 'References parent department for hierarchical approval';
COMMENT ON COLUMN departments.department_type IS 'Type: college (top-level), office (sub-unit), or unit';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. REQUESTS TABLE ADDITIONS
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE requests
  -- Transportation/Pickup fields
  ADD COLUMN IF NOT EXISTS transportation_type TEXT CHECK (transportation_type IN ('pickup', 'self', NULL)),
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS pickup_location_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS pickup_location_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS pickup_contact_number TEXT,
  ADD COLUMN IF NOT EXISTS pickup_special_instructions TEXT,
  ADD COLUMN IF NOT EXISTS return_transportation_same BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_time TIME,
  ADD COLUMN IF NOT EXISTS parking_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS own_vehicle_details TEXT,
  
  -- Executive level tracking
  ADD COLUMN IF NOT EXISTS exec_level TEXT CHECK (exec_level IN ('vp', 'president', NULL)),
  ADD COLUMN IF NOT EXISTS requires_president_approval BOOLEAN DEFAULT false,
  
  -- Requester signature (for dual-signature workflow)
  ADD COLUMN IF NOT EXISTS requester_signature TEXT,
  ADD COLUMN IF NOT EXISTS requester_signed_at TIMESTAMP;

COMMENT ON COLUMN requests.transportation_type IS 'Transportation arrangement: pickup (university vehicle) or self (own transportation)';
COMMENT ON COLUMN requests.exec_level IS 'Executive approver level required: vp or president';
COMMENT ON COLUMN requests.requester_signature IS 'Base64 encoded signature of requester (used in dual-signature scenarios)';

-- ═══════════════════════════════════════════════════════════════════════
-- 4. REMOVE INCORRECT CONSTRAINT (if exists)
-- ═══════════════════════════════════════════════════════════════════════

-- The old no_self_approval constraint was incorrect for dual-signature workflow
-- Drop it if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'no_self_approval' 
        AND table_name = 'requests'
    ) THEN
        ALTER TABLE requests DROP CONSTRAINT no_self_approval;
        RAISE NOTICE 'Dropped old no_self_approval constraint - no longer needed for dual-signature workflow';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_profile_picture ON users(profile_picture) WHERE profile_picture IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_exec_type ON users(exec_type) WHERE exec_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online) WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id) WHERE parent_department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_departments_type ON departments(department_type);

CREATE INDEX IF NOT EXISTS idx_requests_transportation ON requests(transportation_type) WHERE transportation_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_exec_level ON requests(exec_level) WHERE exec_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_requires_president ON requests(requires_president_approval) WHERE requires_president_approval = true;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. UPDATE EXISTING DATA (Optional Backfill)
-- ═══════════════════════════════════════════════════════════════════════

-- Set default values for existing users
UPDATE users 
SET 
  is_online = false,
  last_active_at = CURRENT_TIMESTAMP
WHERE 
  is_online IS NULL;

-- Set default transportation type for existing requests
UPDATE requests
SET
  return_transportation_same = true,
  parking_required = false
WHERE
  return_transportation_same IS NULL 
  OR parking_required IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Check users table columns
SELECT 
  'Users Table' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE 
  table_name = 'users'
  AND column_name IN (
    'profile_picture', 'phone_number', 'position_title', 
    'employee_id', 'bio', 'is_online', 'last_active_at', 'exec_type'
  )
ORDER BY ordinal_position;

-- Check departments table columns
SELECT 
  'Departments Table' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE 
  table_name = 'departments'
  AND column_name IN (
    'parent_department_id', 'department_type', 'requires_parent_approval'
  )
ORDER BY ordinal_position;

-- Check requests table columns
SELECT 
  'Requests Table' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE 
  table_name = 'requests'
  AND column_name IN (
    'transportation_type', 'pickup_location', 'pickup_time',
    'dropoff_location', 'dropoff_time', 'exec_level',
    'requires_president_approval', 'requester_signature'
  )
ORDER BY ordinal_position;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════

SELECT 'Design System v2.0 Schema Migration Completed Successfully!' as status;
