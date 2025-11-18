-- ============================================
-- CONSOLIDATED DATABASE MIGRATIONS
-- Run this in Supabase SQL Editor
-- Combines all pending migrations into one file
-- ============================================

-- ============================================
-- 1. ADD PARENT DEPARTMENT HEAD SUPPORT
-- ============================================
-- Supports office hierarchy where offices report to parent departments
-- Example: WCDEO (office head: Sir Joro) → CCMS (dept head: Dean Rodrigo)

-- Step 0: Add pending_parent_head to request_status enum (CRITICAL!)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending_parent_head' 
    AND enumtypid = 'request_status'::regtype
  ) THEN
    ALTER TYPE request_status ADD VALUE 'pending_parent_head';
  END IF;
END $$;

-- Step 1: Add parent_department_id to departments table
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES public.departments(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_departments_parent 
ON public.departments(parent_department_id);

-- Add comment
COMMENT ON COLUMN public.departments.parent_department_id IS 
'For offices under departments: points to parent department. NULL for top-level departments/offices.';

-- Step 2: Add parent department and approval fields to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS parent_head_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_head_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS parent_head_signature TEXT,
ADD COLUMN IF NOT EXISTS parent_head_comments TEXT;

-- Add comments
COMMENT ON COLUMN public.requests.parent_head_approved_at IS 
'Timestamp when parent department head approved (for office hierarchy)';
COMMENT ON COLUMN public.requests.parent_head_approved_by IS 
'User ID of parent department head who approved';

-- ============================================
-- 2. ADD MISSING FOREIGN KEY FOR admin_approved_by
-- ============================================
-- Add the missing foreign key constraint (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'requests_admin_approved_by_fkey'
  ) THEN
    ALTER TABLE public.requests
    ADD CONSTRAINT requests_admin_approved_by_fkey 
    FOREIGN KEY (admin_approved_by) 
    REFERENCES public.users(id);
  END IF;
END $$;

-- ============================================
-- 3. ADD JUSTIFICATION COLUMN
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS cost_justification TEXT;

COMMENT ON COLUMN public.requests.cost_justification IS 
'Optional explanation for travel costs and budget breakdown';

-- Create index for searching justifications
CREATE INDEX IF NOT EXISTS idx_requests_has_justification 
ON public.requests(cost_justification) 
WHERE cost_justification IS NOT NULL AND cost_justification != '';

-- ============================================
-- 4. ADD HEAD AND ADMIN SIGNATURE FIELDS
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS head_signature TEXT,
ADD COLUMN IF NOT EXISTS admin_signature TEXT;

COMMENT ON COLUMN public.requests.head_signature IS 
'Digital signature of department head approver';
COMMENT ON COLUMN public.requests.admin_signature IS 
'Digital signature of admin approver';

-- ============================================
-- 5. ADD ADMIN APPROVAL COLUMNS
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_rejected_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requests_admin_approved_at 
ON public.requests(admin_approved_at);

-- ============================================
-- 6. ADD COMPTROLLER FIELDS
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS comptroller_rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS comptroller_rejected_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS comptroller_rejection_reason TEXT;

COMMENT ON COLUMN public.requests.comptroller_rejected_at IS 
'Timestamp when comptroller rejected the request';
COMMENT ON COLUMN public.requests.comptroller_rejected_by IS 
'User ID of comptroller who rejected';
COMMENT ON COLUMN public.requests.comptroller_rejection_reason IS 
'Reason provided by comptroller for rejection';

-- ============================================
-- 7. ADD ASSIGNMENT COLUMNS
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_assigned_driver 
ON public.requests(assigned_driver_id);

CREATE INDEX IF NOT EXISTS idx_requests_assigned_vehicle 
ON public.requests(assigned_vehicle_id);

-- ============================================
-- 8. ADD REQUESTER NAME COLUMN (if missing)
-- ============================================
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS requester_name TEXT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify enum was added
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'request_status'::regtype 
ORDER BY enumsortorder;

-- Verify parent department structure
SELECT 
  d.code,
  d.name,
  d.type,
  p.code as parent_code,
  p.name as parent_name,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Has Parent'
    ELSE 'Top-Level'
  END as hierarchy_level
FROM public.departments d
LEFT JOIN public.departments p ON d.parent_department_id = p.id
ORDER BY p.code NULLS FIRST, d.code;

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'parent_department_id',
    'parent_head_approved_at',
    'parent_head_approved_by',
    'parent_head_signature',
    'parent_head_comments',
    'cost_justification',
    'head_signature',
    'admin_signature',
    'admin_approved_at',
    'admin_approved_by',
    'admin_notes',
    'admin_rejected_at',
    'admin_rejected_by',
    'admin_rejection_reason',
    'comptroller_rejected_at',
    'comptroller_rejected_by',
    'comptroller_rejection_reason',
    'assigned_driver_id',
    'assigned_vehicle_id',
    'requester_name'
  )
ORDER BY column_name;

-- Verify foreign keys
SELECT
    conname AS constraint_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'public.requests'::regclass
  AND c.contype = 'f'
  AND conname IN (
    'requests_admin_approved_by_fkey',
    'requests_parent_head_approved_by_fkey',
    'requests_assigned_driver_id_fkey',
    'requests_assigned_vehicle_id_fkey'
  )
ORDER BY conname;

-- ============================================
-- ✅ Migration Complete!
-- ============================================
-- All columns and constraints have been added.
-- Refresh your application to see the changes.

