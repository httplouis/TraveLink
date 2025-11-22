-- ============================================
-- ADD PARENT DEPARTMENT HEAD SUPPORT
-- ============================================
-- Supports office hierarchy where offices report to parent departments
-- Example: WCDEO (office head: Sir Joro) → CCMS (dept head: Dean Rodrigo)

-- Step 0: Add pending_parent_head to request_status enum (CRITICAL!)
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_parent_head';

-- Verify enum
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'request_status'::regtype ORDER BY enumsortorder;

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

-- Step 3: Set known parent relationships
-- WCDEO under CCMS
UPDATE public.departments 
SET parent_department_id = (SELECT id FROM public.departments WHERE code = 'CCMS')
WHERE code = 'WCDEO';

-- Add more as confirmed...
-- Example template:
-- UPDATE public.departments 
-- SET parent_department_id = (SELECT id FROM public.departments WHERE code = 'PARENT_CODE')
-- WHERE code = 'OFFICE_CODE';

-- Step 4: Verify structure
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

-- Step 5: Query to see approval flow for a department
SELECT 
  d.code as office_code,
  d.name as office_name,
  'Office Head' as approval_step_1,
  p.code as parent_code,
  p.name as parent_name,
  'Parent Dept Head' as approval_step_2,
  'Then: Admin → [Comptroller] → HR → Exec' as remaining_steps
FROM public.departments d
LEFT JOIN public.departments p ON d.parent_department_id = p.id
WHERE d.parent_department_id IS NOT NULL
ORDER BY d.code;

-- Expected output for WCDEO:
-- office_code | office_name                              | approval_step_1 | parent_code | parent_name | approval_step_2      | remaining_steps
-- WCDEO       | Web Content & Digital Engagement Office  | Office Head     | CCMS        | CCMS Name   | Parent Dept Head     | Then: Admin → ...
