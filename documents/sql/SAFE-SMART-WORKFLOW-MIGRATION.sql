-- ═══════════════════════════════════════════════════════════════════════
-- SAFE SMART WORKFLOW MIGRATION - DEADLOCK PREVENTION
-- TraviLink v2.1 - Revolutionary Auto-Skip Logic
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Add columns one by one to avoid deadlocks
-- Run each ALTER TABLE separately to minimize lock time

-- Add smart workflow fields to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requires_budget BOOLEAN DEFAULT false;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_version INTEGER DEFAULT 1;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_last_modified_at TIMESTAMP NULL;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_last_modified_by UUID NULL;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_budget_ack_required BOOLEAN DEFAULT false;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS hr_budget_ack_at TIMESTAMP NULL;

ALTER TABLE requests ADD COLUMN IF NOT EXISTS exec_level VARCHAR(20) DEFAULT 'vp';

ALTER TABLE requests ADD COLUMN IF NOT EXISTS parent_department_routing VARCHAR(20) DEFAULT 'own_office';

ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT false;

-- Add signature timestamp fields
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

-- Add workflow metadata fields
ALTER TABLE requests ADD COLUMN IF NOT EXISTS workflow_metadata JSONB DEFAULT '{}';

ALTER TABLE requests ADD COLUMN IF NOT EXISTS smart_skips_applied JSONB DEFAULT '[]';

-- Update users table for executive hierarchy
ALTER TABLE users ADD COLUMN IF NOT EXISTS exec_type VARCHAR(20) NULL;

-- Add parent department support
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID NULL;

-- Verify columns were added successfully
SELECT 'All columns added successfully! ✅' as status;

-- Show the new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'requires_budget', 'budget_version', 'hr_budget_ack_required', 
    'exec_level', 'is_international', 'head_skipped', 'comptroller_skipped',
    'workflow_metadata', 'smart_skips_applied'
  )
ORDER BY column_name;
