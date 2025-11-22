-- ============================================
-- ADD REQUEST CODE GENERATION FIELDS
-- Phase 1.3: Add file_code and seminar_code_per_person
-- ============================================

-- Add file_code for log book code (TO-2025-800-JUBOTTED SANTOS format)
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS file_code VARCHAR(100);

-- Add seminar_code_per_person for individual seminar codes
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS seminar_code_per_person JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.requests.file_code IS 'Log book file code format: TO-{YEAR}-{SEQUENCE}-{REQUESTER/DEPT}-{DRIVER} or SA-{YEAR}-{SEQUENCE}-{PERSON}';
COMMENT ON COLUMN public.requests.seminar_code_per_person IS 'Array of individual seminar codes per person: [{person_id, name, code}]';

-- Create index for file_code queries
CREATE INDEX IF NOT EXISTS idx_requests_file_code ON public.requests(file_code);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name IN (
    'file_code',
    'seminar_code_per_person'
  )
ORDER BY column_name;

-- Verify index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'requests' 
  AND indexname = 'idx_requests_file_code';

-- Migration complete!
-- file_code format examples:
-- Travel Order: TO-2025-800-JUAN DELA CRUZ-PEDRO SANTOS (single requester)
-- Travel Order: TO-2025-800-CCMS-PEDRO SANTOS (multiple requesters, same dept)
-- Seminar: SA-2025-200-JUAN DELA CRUZ (per person)

