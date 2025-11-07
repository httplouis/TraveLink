-- Add admin approval columns to requests table
-- Run this in Supabase SQL Editor

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS admin_signature TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_rejected_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_requests_admin_approved_at 
ON public.requests(admin_approved_at);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name LIKE 'admin_%'
ORDER BY column_name;
