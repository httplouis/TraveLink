-- ========================================
-- ADD PREFERRED DRIVER & VEHICLE SUGGESTIONS
-- Faculty can suggest, Admin makes final assignment
-- ========================================

-- Add new columns for preferred/suggested driver and vehicle
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS preferred_driver_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS preferred_vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS preferred_driver_note TEXT,
ADD COLUMN IF NOT EXISTS preferred_vehicle_note TEXT;

-- Add helpful comment
COMMENT ON COLUMN public.requests.preferred_driver_id IS 'Faculty suggestion for driver (optional) - Admin makes final assignment';
COMMENT ON COLUMN public.requests.preferred_vehicle_id IS 'Faculty suggestion for vehicle (optional) - Admin makes final assignment';
COMMENT ON COLUMN public.requests.preferred_driver_note IS 'Why this driver was preferred';
COMMENT ON COLUMN public.requests.preferred_vehicle_note IS 'Why this vehicle was preferred';

COMMENT ON COLUMN public.requests.assigned_driver_id IS 'Final driver assignment by Admin';
COMMENT ON COLUMN public.requests.assigned_vehicle_id IS 'Final vehicle assignment by Admin';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_requests_preferred_driver ON public.requests(preferred_driver_id);
CREATE INDEX IF NOT EXISTS idx_requests_preferred_vehicle ON public.requests(preferred_vehicle_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Preferred driver/vehicle columns added successfully!';
  RAISE NOTICE '📝 Faculty can now suggest drivers and vehicles';
  RAISE NOTICE '👨‍💼 Admin still makes final assignments';
END $$;
