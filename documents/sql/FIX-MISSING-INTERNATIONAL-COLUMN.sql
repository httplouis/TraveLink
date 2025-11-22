-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Add missing is_international column
-- This fixes the error: column "is_international" does not exist
-- ═══════════════════════════════════════════════════════════════════════

-- Add the missing is_international column
ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requests_is_international ON requests(is_international);

-- Now update exec_level based on budget and international status (fixed version)
UPDATE requests 
SET exec_level = (
  CASE 
    WHEN total_budget > 50000 OR is_international = true THEN 'president'
    ELSE 'vp'
  END
)
WHERE exec_level IS NULL OR exec_level = 'vp';

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'requests' AND column_name = 'is_international';

-- Test query to make sure it works
SELECT 
  id, 
  request_number,
  total_budget,
  is_international,
  exec_level
FROM requests 
LIMIT 3;

COMMIT;
