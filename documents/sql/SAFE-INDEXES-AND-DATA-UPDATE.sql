-- ═══════════════════════════════════════════════════════════════════════
-- SAFE INDEXES AND DATA UPDATE - Run AFTER columns are added
-- TraviLink v2.1 - Revolutionary Auto-Skip Logic
-- ═══════════════════════════════════════════════════════════════════════

-- Step 2: Create indexes (run this AFTER the columns are added)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_requires_budget ON requests(requires_budget);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_exec_level ON requests(exec_level);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_is_international ON requests(is_international);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_smart_skips ON requests USING GIN(smart_skips_applied);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- Step 3: Add foreign key constraint safely
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_parent_department' 
        AND table_name = 'departments'
    ) THEN
        -- Add the constraint
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

-- Step 4: Update existing data safely (small batches to avoid locks)
-- Set requires_budget based on existing data
UPDATE requests 
SET requires_budget = (
  CASE 
    WHEN total_budget > 0 OR has_budget = true THEN true
    ELSE false
  END
)
WHERE (requires_budget IS NULL OR requires_budget = false)
  AND id IN (
    SELECT id FROM requests 
    WHERE (requires_budget IS NULL OR requires_budget = false)
    LIMIT 1000
  );

-- Set exec_level based on budget and international status
UPDATE requests 
SET exec_level = (
  CASE 
    WHEN total_budget > 50000 OR is_international = true THEN 'president'
    ELSE 'vp'
  END
)
WHERE (exec_level IS NULL OR exec_level = 'vp')
  AND id IN (
    SELECT id FROM requests 
    WHERE (exec_level IS NULL OR exec_level = 'vp')
    LIMIT 1000
  );

-- Set signature timestamps from existing approval timestamps
UPDATE requests 
SET 
  requester_signed_at = COALESCE(requester_signed_at, created_at),
  head_signed_at = COALESCE(head_signed_at, head_approved_at),
  admin_signed_at = COALESCE(admin_signed_at, admin_processed_at),
  comptroller_signed_at = COALESCE(comptroller_signed_at, comptroller_approved_at),
  hr_signed_at = COALESCE(hr_signed_at, hr_approved_at),
  exec_signed_at = COALESCE(exec_signed_at, exec_approved_at)
WHERE requester_signed_at IS NULL
  AND id IN (
    SELECT id FROM requests 
    WHERE requester_signed_at IS NULL
    LIMIT 1000
  );

-- Set Carlos Jayron A. Remiendo as VP (Comptroller/VP)
UPDATE users 
SET exec_type = 'vp'
WHERE (email = 'comptroller@mseuf.edu.ph' OR name ILIKE '%carlos%remiendo%')
  AND exec_type IS NULL;

-- Verification
SELECT 'Data update completed successfully! ✅' as status;

-- Show sample updated data
SELECT 
  id, 
  request_number,
  requires_budget,
  exec_level,
  is_international,
  head_skipped,
  comptroller_skipped
FROM requests 
LIMIT 5;
