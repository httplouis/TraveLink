-- ═══════════════════════════════════════════════════════════════════════
-- FIX COMPTROLLER ROLES
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- Fix: Comptroller, Audrey, and Albert should be role = 'comptroller'
-- (not 'admin' or 'staff')
--
-- ═══════════════════════════════════════════════════════════════════════

-- Update roles to 'comptroller'
UPDATE public.users
SET role = 'comptroller'
WHERE email IN (
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'albert.alingalan@mseuf.edu.ph'
);

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  u.email,
  u.name,
  u.position_title,
  u.role,
  u.is_comptroller,
  u.is_admin,
  parent.name as parent_name
FROM users u
LEFT JOIN users parent ON u.parent_id = parent.id
WHERE u.email IN (
  'comptroller@mseuf.edu.ph',
  'audrey.abulencia@mseuf.edu.ph',
  'albert.alingalan@mseuf.edu.ph'
)
ORDER BY 
  CASE WHEN u.position_title = 'Comptroller' THEN 1 ELSE 2 END,
  u.email;

