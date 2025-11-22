-- ============================================
-- FIX USER DEPARTMENT ASSIGNMENT
-- ============================================

-- Step 1: Check which user is having the issue
SELECT 
  u.id,
  u.auth_user_id,
  u.email,
  u.name,
  u.role,
  u.department_id,
  d.name as current_department
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.role IN ('faculty', 'head')
ORDER BY u.email;

-- Step 2: List all available departments
SELECT 
  id,
  code,
  name,
  parent_department_id
FROM departments
ORDER BY name;

-- ============================================
-- Step 3: FIX - Update user to have correct department
-- ============================================

-- Example: Assign Juan Dela Cruz to College of Nursing
-- FIRST: Get the department ID
DO $$ 
DECLARE
  dept_id UUID;
  user_id_to_fix UUID;
BEGIN
  -- Get College of Nursing ID (change this to your department)
  SELECT id INTO dept_id 
  FROM departments 
  WHERE name LIKE '%College of Nursing%' 
  LIMIT 1;
  
  IF dept_id IS NULL THEN
    RAISE NOTICE '❌ Department not found! Check department name.';
  ELSE
    RAISE NOTICE '✅ Found department ID: %', dept_id;
    
    -- Update user (change email to the actual user having issues)
    UPDATE users 
    SET department_id = dept_id
    WHERE email = 'juandelacruz@mseuf.edu.ph'  -- CHANGE THIS EMAIL
    RETURNING id INTO user_id_to_fix;
    
    IF user_id_to_fix IS NOT NULL THEN
      RAISE NOTICE '✅ Updated user % to department %', user_id_to_fix, dept_id;
    ELSE
      RAISE NOTICE '❌ User not found with that email';
    END IF;
  END IF;
END $$;

-- ============================================
-- Alternative: Bulk update all users without department
-- ============================================

-- Assign all faculty without department to a default one
-- UPDATE users 
-- SET department_id = (
--   SELECT id FROM departments 
--   WHERE name LIKE '%College of Nursing%'  -- Change to your default department
--   LIMIT 1
-- )
-- WHERE role IN ('faculty', 'head') 
--   AND department_id IS NULL;

-- ============================================
-- Step 4: Verify the fix
-- ============================================

SELECT 
  u.email,
  u.name,
  u.role,
  d.name as department,
  d.code as dept_code
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.email = 'juandelacruz@mseuf.edu.ph'  -- CHANGE THIS EMAIL
LIMIT 1;

-- Check if any users still have no department
SELECT 
  COUNT(*) as users_without_department,
  string_agg(email, ', ') as affected_users
FROM users 
WHERE role IN ('faculty', 'head') 
  AND department_id IS NULL;
