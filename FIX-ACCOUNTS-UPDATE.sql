-- ═══════════════════════════════════════════════════════════════════════
-- FIX ACCOUNTS - Update Names, Roles, and Parent Relationships
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- This script fixes:
-- 1. Correct names
-- 2. Correct roles (exec, staff, admin)
-- 3. Parent relationships for hierarchy
-- 4. exec_type corrections
--
-- ═══════════════════════════════════════════════════════════════════════

-- Fix President
UPDATE public.users
SET 
  name = 'Naila E. Leveriza',
  role = 'exec',
  exec_type = 'president',
  is_president = TRUE,
  is_vp = FALSE
WHERE email = 'president@mseuf.edu.ph';

-- Fix Comptroller
UPDATE public.users
SET 
  name = 'Carlos Jayron A. Remiendo',
  role = 'staff',
  exec_type = NULL,
  is_comptroller = TRUE,
  is_vp = FALSE,
  is_president = FALSE,
  parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'comptroller@mseuf.edu.ph';

-- Fix Financial Analyst parent
UPDATE public.users
SET 
  parent_id = (SELECT id FROM users WHERE email = 'comptroller@mseuf.edu.ph')
WHERE email = 'audrey.abulencia@mseuf.edu.ph';

-- Fix Director Treasury Services parent
UPDATE public.users
SET 
  parent_id = (SELECT id FROM users WHERE email = 'vp.finance@mseuf.edu.ph')
WHERE email = 'cleofe.atayde@mseuf.edu.ph';

-- Fix Treasury Staff parent
UPDATE public.users
SET 
  parent_id = (SELECT id FROM users WHERE email = 'cleofe.atayde@mseuf.edu.ph')
WHERE email = 'trizzia.casino@mseuf.edu.ph';

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_president,
  u.is_vp,
  u.is_comptroller,
  u.is_head,
  u.is_admin,
  u.exec_type,
  d.name as department_name,
  d.code as department_code,
  parent.name as parent_name,
  parent.email as parent_email
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN users parent ON u.parent_id = parent.id
WHERE u.email IN (
  'president@mseuf.edu.ph',
  'svp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'vp.finance@mseuf.edu.ph',
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'cleofe.atayde@mseuf.edu.ph',
  'trizzia.casino@mseuf.edu.ph'
)
ORDER BY 
  CASE 
    WHEN u.is_president = TRUE THEN 1
    WHEN u.is_vp = TRUE THEN 2
    WHEN u.is_comptroller = TRUE THEN 3
    WHEN u.is_head = TRUE THEN 4
    WHEN u.is_admin = TRUE THEN 5
    ELSE 6
  END,
  u.email;

