-- Add comptroller rejection and budget editing fields to requests table
-- Run this in Supabase SQL Editor

-- Add comptroller rejection fields
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS comptroller_rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS comptroller_rejected_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS comptroller_rejection_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.requests.comptroller_rejected_at IS 'Timestamp when comptroller rejected the request';
COMMENT ON COLUMN public.requests.comptroller_rejected_by IS 'User ID of comptroller who rejected';
COMMENT ON COLUMN public.requests.comptroller_rejection_reason IS 'Reason provided by comptroller for rejection';

-- Note: comptroller_edited_budget already exists in the schema
-- Note: comptroller_comments already exists in the schema
-- Note: comptroller_approved_at, comptroller_approved_by, comptroller_signature already exist

-- Migration complete
-- Comptroller can now reject requests with notes and send back to users
