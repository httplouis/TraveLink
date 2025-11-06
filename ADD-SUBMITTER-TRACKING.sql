-- ========================================
-- TRACK WHO ACTUALLY SUBMITTED THE REQUEST
-- Separate submitter (account) from requester (person in form)
-- ========================================

-- Add columns to track the actual submitter
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS submitted_by_name TEXT,
ADD COLUMN IF NOT EXISTS is_representative BOOLEAN DEFAULT FALSE;

-- Add helpful comments
COMMENT ON COLUMN public.requests.submitted_by_user_id IS 'The actual user account that submitted the request';
COMMENT ON COLUMN public.requests.submitted_by_name IS 'Name of the person who submitted (for display)';
COMMENT ON COLUMN public.requests.requester_id IS 'The person this request is FOR (may be different from submitter)';
COMMENT ON COLUMN public.requests.requester_name IS 'Name of the person who needs the travel (filled in form)';
COMMENT ON COLUMN public.requests.is_representative IS 'TRUE if someone submitted on behalf of another person';

-- Create index for queries
CREATE INDEX IF NOT EXISTS idx_requests_submitted_by ON public.requests(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_requests_is_representative ON public.requests(is_representative);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Submitter tracking columns added!';
  RAISE NOTICE '📝 Now we can distinguish:';
  RAISE NOTICE '   - submitted_by_user_id = WHO clicked submit (account owner)';
  RAISE NOTICE '   - requester_id = WHO needs the travel (filled in form)';
  RAISE NOTICE '   - is_representative = TRUE if they are different';
END $$;
