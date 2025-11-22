-- Add head and admin signature fields to requests table
-- Run this in Supabase SQL Editor

-- Add signature columns for head and admin approvers
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS head_signature TEXT,
ADD COLUMN IF NOT EXISTS admin_signature TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.requests.head_signature IS 'Digital signature of department head approver';
COMMENT ON COLUMN public.requests.admin_signature IS 'Digital signature of admin approver';

-- Migration complete
-- Signatures will now be saved and displayed in approval history
