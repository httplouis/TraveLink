-- ============================================
-- CHECK ALL CONSTRAINTS ON APPROVALS_HISTORY
-- ============================================
-- This script checks for all constraints (NOT NULL, CHECK, FK, etc.)
-- that might be preventing NULL values in admin_id
-- ============================================

-- Step 1: Check column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'approvals_history'
  AND column_name = 'admin_id';

-- Step 2: Check for CHECK constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'approvals_history'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;

-- Step 3: Check for NOT NULL constraints (via column definition)
SELECT 
    column_name,
    is_nullable,
    CASE 
        WHEN is_nullable = 'NO' THEN 'HAS NOT NULL CONSTRAINT'
        ELSE 'ALLOWS NULL'
    END as null_status
FROM information_schema.columns
WHERE table_name = 'approvals_history'
  AND column_name IN ('admin_id', 'approver_id', 'user_id', 'actor_id')
ORDER BY column_name;

-- Step 4: Check for triggers that might prevent NULL
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'approvals_history'
ORDER BY trigger_name;

-- Step 5: Check FK constraints and their delete rules
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'approvals_history'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'admin_id'
ORDER BY tc.constraint_name;

