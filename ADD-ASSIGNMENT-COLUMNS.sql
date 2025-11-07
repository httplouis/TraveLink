-- Add driver and vehicle assignment columns to requests table
-- Run this in Supabase SQL Editor AFTER the admin approval columns

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_assigned_driver 
ON public.requests(assigned_driver_id);

CREATE INDEX IF NOT EXISTS idx_requests_assigned_vehicle 
ON public.requests(assigned_vehicle_id);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name LIKE 'assigned_%'
ORDER BY column_name;
