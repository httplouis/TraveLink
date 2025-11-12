-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE DATA ONLY - No indexes, just data updates
-- TraviLink v2.1 - Revolutionary Auto-Skip Logic
-- ═══════════════════════════════════════════════════════════════════════

-- Add foreign key constraint safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_parent_department' 
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT fk_parent_department 
        FOREIGN KEY (parent_department_id) REFERENCES departments(id);
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- Update requires_budget based on existing data
UPDATE requests 
SET requires_budget = (
  CASE 
    WHEN total_budget > 0 OR has_budget = true THEN true
    ELSE false
  END
)
WHERE requires_budget IS NULL OR requires_budget = false;

-- Update exec_level based on budget and international status
UPDATE requests 
SET exec_level = (
  CASE 
    WHEN total_budget > 50000 OR is_international = true THEN 'president'
    ELSE 'vp'
  END
)
WHERE exec_level IS NULL OR exec_level = 'vp';

-- Update signature timestamps from existing approval timestamps
UPDATE requests 
SET 
  requester_signed_at = COALESCE(requester_signed_at, created_at),
  head_signed_at = COALESCE(head_signed_at, head_approved_at),
  admin_signed_at = COALESCE(admin_signed_at, admin_processed_at),
  comptroller_signed_at = COALESCE(comptroller_signed_at, comptroller_approved_at),
  hr_signed_at = COALESCE(hr_signed_at, hr_approved_at),
  exec_signed_at = COALESCE(exec_signed_at, exec_approved_at)
WHERE requester_signed_at IS NULL;

-- Set Carlos Jayron A. Remiendo as VP (Comptroller/VP)
UPDATE users 
SET exec_type = 'vp'
WHERE (email = 'comptroller@mseuf.edu.ph' OR name ILIKE '%carlos%remiendo%')
  AND exec_type IS NULL;

-- Verification queries
SELECT 'Smart workflow data update completed! ✅' as status;

-- Check updated data
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN requires_budget = true THEN 1 END) as with_budget,
  COUNT(CASE WHEN exec_level = 'president' THEN 1 END) as president_level,
  COUNT(CASE WHEN exec_level = 'vp' THEN 1 END) as vp_level
FROM requests;

-- Check executive users
SELECT 
  name,
  email,
  exec_type,
  is_executive
FROM users 
WHERE exec_type IS NOT NULL OR is_executive = true;

-- Sample data
SELECT 
  id, 
  request_number,
  requires_budget,
  exec_level,
  is_international,
  total_budget
FROM requests 
LIMIT 5;
