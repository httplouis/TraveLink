-- ============================================
-- ASSIGN FACULTY TO CNAHS DEPARTMENT
-- ============================================
-- This assigns all faculty without department to CNAHS
-- So their requests will go to CNAHS Department Head

-- Step 1: Get CNAHS Department ID
SELECT 
  id,
  code,
  name
FROM departments 
WHERE name = 'College of Nursing and Allied Health Sciences'
LIMIT 1;

-- Step 2: Check who will be assigned
SELECT 
  email,
  name,
  role,
  'Will be assigned to CNAHS' as action
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL
ORDER BY email;

-- ============================================
-- Step 3: ASSIGN ALL TO CNAHS
-- ============================================

UPDATE users 
SET department_id = (
  SELECT id 
  FROM departments 
  WHERE name = 'College of Nursing and Allied Health Sciences'
  LIMIT 1
)
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL;

-- ============================================
-- Step 4: Verify All Assigned to CNAHS
-- ============================================

SELECT 
  u.email,
  u.name,
  u.role,
  d.name as department,
  d.code as dept_code,
  '✅ Assigned' as status
FROM users u
INNER JOIN departments d ON d.id = u.department_id
WHERE u.role IN ('faculty', 'head')
  AND d.name = 'College of Nursing and Allied Health Sciences'
ORDER BY u.email;

-- Check if anyone still has no department
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All faculty have departments!'
    ELSE CONCAT('❌ Still ', COUNT(*), ' users without department')
  END as final_status
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL;

-- ============================================
-- ✅ RESULT: 
-- All faculty now assigned to CNAHS
-- Their requests will route to CNAHS Dept Head for approval
-- ============================================
