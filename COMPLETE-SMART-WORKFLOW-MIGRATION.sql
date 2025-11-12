-- ═══════════════════════════════════════════════════════════════════════
-- COMPLETE SMART WORKFLOW MIGRATION - FIXED VERSION
-- TraviLink v2.1 - Revolutionary Auto-Skip Logic
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Add new fields to requests table for smart workflow
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requires_budget BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_version INTEGER DEFAULT 1;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_last_modified_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_last_modified_by UUID NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_budget_ack_required BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_budget_ack_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS exec_level VARCHAR(20) DEFAULT 'vp';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS parent_department_routing VARCHAR(20) DEFAULT 'own_office';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT false;

-- Add signature timestamps for better tracking
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_signed_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS head_signed_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_signed_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS comptroller_signed_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_signed_at TIMESTAMP NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS exec_signed_at TIMESTAMP NULL;

-- Add skip tracking fields
ALTER TABLE requests ADD COLUMN IF NOT EXISTS head_skipped BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS head_skip_reason VARCHAR(100) NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS comptroller_skipped BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS comptroller_skip_reason VARCHAR(100) NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_skipped BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_skip_reason VARCHAR(100) NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS exec_skipped BOOLEAN DEFAULT false;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS exec_skip_reason VARCHAR(100) NULL;

-- Add workflow metadata
ALTER TABLE requests ADD COLUMN IF NOT EXISTS workflow_metadata JSONB DEFAULT '{}';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS smart_skips_applied JSONB DEFAULT '[]';

-- Update users table for executive hierarchy
ALTER TABLE users ADD COLUMN IF NOT EXISTS exec_type VARCHAR(20) NULL; -- 'vp' or 'president'

-- Add parent department support
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID NULL;

-- Add foreign key constraint (with error handling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_parent_department'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT fk_parent_department 
        FOREIGN KEY (parent_department_id) REFERENCES departments(id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_requires_budget ON requests(requires_budget);
CREATE INDEX IF NOT EXISTS idx_requests_exec_level ON requests(exec_level);
CREATE INDEX IF NOT EXISTS idx_requests_is_international ON requests(is_international);
CREATE INDEX IF NOT EXISTS idx_requests_smart_skips ON requests USING GIN(smart_skips_applied);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE EXISTING DATA
-- ═══════════════════════════════════════════════════════════════════════

-- Set requires_budget based on existing data
UPDATE requests 
SET requires_budget = (
  CASE 
    WHEN total_budget > 0 OR has_budget = true THEN true
    ELSE false
  END
)
WHERE requires_budget IS NULL OR requires_budget = false;

-- Set exec_level based on budget and international status (FIXED - now includes is_international column)
UPDATE requests 
SET exec_level = (
  CASE 
    WHEN total_budget > 50000 OR is_international = true THEN 'president'
    ELSE 'vp'
  END
)
WHERE exec_level IS NULL OR exec_level = 'vp';

-- Set signature timestamps from existing approval timestamps
UPDATE requests 
SET 
  requester_signed_at = COALESCE(requester_signed_at, created_at),
  head_signed_at = COALESCE(head_signed_at, head_approved_at),
  admin_signed_at = COALESCE(admin_signed_at, admin_processed_at),
  comptroller_signed_at = COALESCE(comptroller_signed_at, comptroller_approved_at),
  hr_signed_at = COALESCE(hr_signed_at, hr_approved_at),
  exec_signed_at = COALESCE(exec_signed_at, exec_approved_at)
WHERE requester_signed_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- SETUP EXECUTIVE HIERARCHY
-- ═══════════════════════════════════════════════════════════════════════

-- Set Carlos Jayron A. Remiendo as VP (Comptroller/VP)
UPDATE users 
SET exec_type = 'vp'
WHERE (email = 'comptroller@mseuf.edu.ph' OR name ILIKE '%carlos%remiendo%')
  AND exec_type IS NULL;

-- Set President (update with actual president email when known)
-- UPDATE users 
-- SET exec_type = 'president'
-- WHERE email = 'president@mseuf.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Verify all new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'requires_budget', 'budget_version', 'hr_budget_ack_required', 
    'exec_level', 'is_international', 'head_skipped', 'comptroller_skipped',
    'workflow_metadata', 'smart_skips_applied'
  )
ORDER BY column_name;

-- Check sample data
SELECT 
  id, 
  request_number,
  requires_budget,
  exec_level,
  is_international,
  head_skipped,
  comptroller_skipped,
  smart_skips_applied
FROM requests 
LIMIT 5;

-- Check executive hierarchy
SELECT 
  id, 
  name, 
  email, 
  is_executive, 
  exec_type
FROM users 
WHERE is_executive = true OR exec_type IS NOT NULL;

-- Check parent departments
SELECT 
  d1.name as department,
  d2.name as parent_department
FROM departments d1
LEFT JOIN departments d2 ON d1.parent_department_id = d2.id
WHERE d1.parent_department_id IS NOT NULL;

-- Final success message
SELECT 'Smart Workflow Migration Completed Successfully! 🎉' as status;

COMMIT;
