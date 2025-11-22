-- ═══════════════════════════════════════════════════════════════════════
-- FIX ROLES AND HEAD FLAGS
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- Fixes:
-- 1. All VPs and President should be is_head = TRUE
-- 2. Comptroller should be role = 'admin' (has separate comptroller view)
-- 3. All executives should be role = 'exec'
-- 4. Audrey should be role = 'staff' (already correct)
--
-- ═══════════════════════════════════════════════════════════════════════

-- Fix 1: All VPs and President should be is_head = TRUE
UPDATE public.users
SET is_head = TRUE
WHERE email IN (
  'president@mseuf.edu.ph',
  'svp.academics@mseuf.edu.ph',
  'vp.admin@mseuf.edu.ph',
  'vp.external@mseuf.edu.ph',
  'vp.finance@mseuf.edu.ph'
);

-- Fix 2: Comptroller, Audrey, and Albert should be role = 'comptroller' (not 'admin' or 'staff')
UPDATE public.users
SET role = 'comptroller'
WHERE email IN (
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'albert.alingalan@mseuf.edu.ph'
);

-- Fix 3: Financial Analysts should also be comptroller (staff sa comptroller office)
UPDATE public.users
SET is_comptroller = TRUE
WHERE email IN ('audrey.abulencia@mseuf.edu.ph', 'albert.alingalan@mseuf.edu.ph');

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
  parent.name as parent_name
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
  'albert.alingalan@mseuf.edu.ph',
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

