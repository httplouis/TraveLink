-- Add justification column to requests table
-- This stores the optional cost justification explanation

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS cost_justification TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.requests.cost_justification IS 'Optional explanation for travel costs and budget breakdown';

-- Create index for searching justifications (useful for admin review)
CREATE INDEX IF NOT EXISTS idx_requests_has_justification 
ON public.requests(cost_justification) 
WHERE cost_justification IS NOT NULL AND cost_justification != '';

-- Migration complete
-- Now cost justification will be stored and displayed in all views
