-- ============================================
-- CLEANUP ORPHANED admin_approved_by DATA
-- ============================================

-- Step 1: Find requests with orphaned admin_approved_by
SELECT 
  id,
  request_number,
  admin_approved_by,
  admin_approved_at
FROM public.requests
WHERE admin_approved_by IS NOT NULL
  AND admin_approved_by NOT IN (SELECT id FROM public.users);

-- Step 2: Update orphaned records to use Trizzia's user ID
-- (Or set to NULL if you prefer)
UPDATE public.requests
SET admin_approved_by = (
  SELECT id FROM public.users WHERE email = 'casinotrizzia@mseuf.edu.ph'
)
WHERE admin_approved_by IS NOT NULL
  AND admin_approved_by NOT IN (SELECT id FROM public.users);

-- Step 3: NOW add the foreign key constraint
ALTER TABLE public.requests
DROP CONSTRAINT IF EXISTS requests_admin_approved_by_fkey;

ALTER TABLE public.requests
ADD CONSTRAINT requests_admin_approved_by_fkey 
FOREIGN KEY (admin_approved_by) 
REFERENCES public.users(id);

-- Step 4: Verify no more orphaned records
SELECT 
  'Orphaned records' as check_type,
  COUNT(*) as count
FROM public.requests
WHERE admin_approved_by IS NOT NULL
  AND admin_approved_by NOT IN (SELECT id FROM public.users);

-- Should return 0

-- ============================================
-- ✅ After running, refresh the page!
-- ============================================
