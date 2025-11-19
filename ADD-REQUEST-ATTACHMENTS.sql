-- ============================================
-- ADD FILE ATTACHMENTS SUPPORT TO REQUESTS
-- Phase 1.1: Add attachments JSONB column
-- ============================================

-- Add attachments column to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.requests.attachments IS 'Array of attached files: [{id, name, url, mime, size, uploaded_at, uploaded_by}]';

-- Create index for attachment queries (if needed for filtering)
CREATE INDEX IF NOT EXISTS idx_requests_attachments ON public.requests USING GIN (attachments);

-- ============================================
-- RLS POLICIES FOR ATTACHMENTS
-- ============================================

-- Allow requesters to view their own request attachments
-- (Handled by existing RLS policies on requests table)

-- Allow approvers to view attachments for requests in their inbox
-- (Handled by existing RLS policies on requests table)

-- Allow admins full access
-- (Handled by existing service_role policies)

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
  AND column_name = 'attachments';

-- Verify index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'requests' 
  AND indexname = 'idx_requests_attachments';

-- Migration complete!
-- Attachments will be stored as JSONB array in format:
-- [
--   {
--     "id": "uuid",
--     "name": "invitation.pdf",
--     "url": "https://storage...",
--     "mime": "application/pdf",
--     "size": 1024000,
--     "uploaded_at": "2025-01-15T10:30:00Z",
--     "uploaded_by": "user-uuid"
--   }
-- ]

