-- ============================================
-- QUICK FIX: Assign all faculty without department
-- ============================================

-- Step 1: Check who needs fixing
SELECT 
  email,
  name,
  role
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL
ORDER BY email;

-- Step 2: Get College of Nursing ID (most common department)
SELECT id, code, name 
FROM departments 
WHERE name = 'College of Nursing and Allied Health Sciences'
LIMIT 1;

-- ============================================
-- Step 3: FIX ALL USERS AT ONCE
-- ============================================

-- Assign ALL faculty without department to College of Nursing
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
-- Step 4: Verify - should be 0 now
-- ============================================

SELECT 
  COUNT(*) as users_without_department,
  string_agg(email, ', ') as affected_users
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL;

-- Step 5: Check all users now have departments
SELECT 
  u.email,
  u.name,
  u.role,
  d.name as department,
  d.code
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.role IN ('faculty', 'head')
ORDER BY u.email;

-- ✅ All users should now have departments assigned!
