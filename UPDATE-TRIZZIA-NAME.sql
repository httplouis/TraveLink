-- ============================================
-- CHECK AND UPDATE TRIZZIA'S NAME
-- ============================================

-- Check current name
SELECT 
  id,
  email,
  name,
  role
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Update name if it's null or wrong
UPDATE public.users
SET name = 'Trizzia Maree Casino'
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- Verify
SELECT 
  id,
  email,
  name,
  role
FROM public.users
WHERE email = 'casinotrizzia@mseuf.edu.ph';

-- ============================================
-- ✅ After running, refresh the page!
-- ============================================
