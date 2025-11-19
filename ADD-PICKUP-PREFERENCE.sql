-- ============================================
-- ADD PICKUP PREFERENCE FIELD
-- Phase 1.6: Add pickup_preference to requests table
-- ============================================

-- Add pickup_preference field
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS pickup_preference TEXT CHECK (pickup_preference IN ('pickup', 'self', 'gymnasium'));

-- Add comment for documentation
COMMENT ON COLUMN public.requests.pickup_preference IS 'Pickup preference: pickup (at location), self (self-transport), gymnasium (pickup at gymnasium)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify column was added
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name = 'pickup_preference';

-- Verify constraint was created
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'requests' 
  AND constraint_name LIKE '%pickup_preference%';

-- Migration complete!
-- pickup_preference options:
-- 'pickup' - Requester wants to be picked up at specified location
-- 'self' - Requester will use own transportation
-- 'gymnasium' - Requester will be picked up at gymnasium

