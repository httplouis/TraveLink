-- FIX_APPROVAL_COLUMNS.sql
-- Add approval tracking columns if they don't exist

-- Add head approval columns
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS head_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS head_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS head_signature TEXT,
ADD COLUMN IF NOT EXISTS head_comments TEXT;

-- Add parent head approval columns
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS parent_head_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parent_head_approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS parent_head_signature TEXT,
ADD COLUMN IF NOT EXISTS parent_head_comments TEXT;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'requests'
  AND column_name IN (
    'head_approved_at',
    'head_approved_by',
    'head_signature',
    'head_comments',
    'parent_head_approved_at',
    'parent_head_approved_by',
    'parent_head_signature',
    'parent_head_comments'
  )
ORDER BY column_name;

-- Test update (replace with actual user ID)
-- UPDATE public.requests 
-- SET head_approved_by = '30a1e6ff-0196-4d99-8879-d012fb7f13a7'
-- WHERE id = 'some-request-id'
-- RETURNING id, status, head_approved_by;
