-- ============================================
-- CHECK USER DEPARTMENT ISSUES
-- ============================================

-- 1. Check users with missing or invalid department_id
SELECT 
  u.id,
  u.email,
  u.name,
  u.department_id,
  u.role,
  d.name as department_name,
  CASE 
    WHEN u.department_id IS NULL THEN '❌ NO DEPARTMENT'
    WHEN d.id IS NULL THEN '❌ INVALID DEPARTMENT'
    ELSE '✅ VALID'
  END as status
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.role = 'faculty' OR u.role = 'head'
ORDER BY status, u.email;

-- 2. List all available departments
SELECT 
  id,
  code,
  name,
  parent_department_id
FROM departments
ORDER BY code;

-- ============================================
-- FIX: Assign a default department to users
-- ============================================

-- Option 1: Find the department ID you want to use
-- Replace 'YOUR_DEPARTMENT_NAME' with actual department
-- SELECT id FROM departments WHERE name LIKE '%College of Nursing%' LIMIT 1;

-- Option 2: Update specific user by email
-- UPDATE users 
-- SET department_id = (SELECT id FROM departments WHERE name LIKE '%College of Nursing%' LIMIT 1)
-- WHERE email = 'juandelacruz@mseuf.edu.ph';

-- Option 3: Update all faculty without department to a default one
-- UPDATE users 
-- SET department_id = (SELECT id FROM departments WHERE name LIKE '%College of Nursing%' LIMIT 1)
-- WHERE role IN ('faculty', 'head') AND department_id IS NULL;

-- ============================================
-- After fixing, verify
-- ============================================

SELECT 
  COUNT(*) as users_without_department
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL;
