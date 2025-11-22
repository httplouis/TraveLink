-- Add vehicle_mode column to requests table
-- This stores how the requester will travel: owned (personal), institutional (school vehicle), or rent (rental)

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS vehicle_mode VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN public.requests.vehicle_mode IS 'Transportation mode: owned (personal vehicle), institutional (school vehicle), or rent (rental vehicle)';

-- Create index for filtering requests by vehicle mode
CREATE INDEX IF NOT EXISTS idx_requests_vehicle_mode 
ON public.requests(vehicle_mode) 
WHERE vehicle_mode IS NOT NULL;

-- Update existing records to set vehicle_mode based on current fields
-- This is a one-time migration for existing data
UPDATE public.requests
SET vehicle_mode = 
  CASE 
    WHEN needs_rental = true THEN 'rent'
    WHEN needs_vehicle = true THEN 'institutional'
    ELSE 'owned'
  END
WHERE vehicle_mode IS NULL;

-- Migration complete
-- Now vehicle mode will be properly tracked for all requests including owned vehicles
