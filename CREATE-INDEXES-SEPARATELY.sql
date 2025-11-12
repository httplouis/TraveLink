-- ═══════════════════════════════════════════════════════════════════════
-- CREATE INDEXES SEPARATELY - Run each command individually
-- TraviLink v2.1 - Revolutionary Auto-Skip Logic
-- ═══════════════════════════════════════════════════════════════════════

-- Run these commands ONE BY ONE (not in a transaction block)

-- Index 1: requires_budget
CREATE INDEX IF NOT EXISTS idx_requests_requires_budget ON requests(requires_budget);

-- Index 2: exec_level  
CREATE INDEX IF NOT EXISTS idx_requests_exec_level ON requests(exec_level);

-- Index 3: is_international
CREATE INDEX IF NOT EXISTS idx_requests_is_international ON requests(is_international);

-- Index 4: smart_skips_applied (JSONB)
CREATE INDEX IF NOT EXISTS idx_requests_smart_skips ON requests USING GIN(smart_skips_applied);

-- Index 5: parent_department_id
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('requests', 'departments')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
