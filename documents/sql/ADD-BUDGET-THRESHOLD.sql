-- ============================================
-- ADD BUDGET THRESHOLD CONFIGURATION
-- Phase 1.4: Add budget threshold for faculty → President routing
-- ============================================

-- Check if system_config table exists, if not create it
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update budget threshold configuration
INSERT INTO public.system_config (key, value, description)
VALUES 
  ('budget_threshold', '5000.00', 'General budget threshold for routing decisions'),
  ('faculty_president_threshold', '5000.00', 'Budget threshold for faculty requests to reach President (5-10K range)')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Add comment for documentation
COMMENT ON TABLE public.system_config IS 'System-wide configuration settings';
COMMENT ON COLUMN public.system_config.key IS 'Configuration key (unique identifier)';
COMMENT ON COLUMN public.system_config.value IS 'Configuration value (stored as text, can be converted to appropriate type)';

-- ============================================
-- HELPER FUNCTION: Get Config Value
-- ============================================

CREATE OR REPLACE FUNCTION get_system_config(p_key VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
  config_value TEXT;
BEGIN
  SELECT value INTO config_value
  FROM public.system_config
  WHERE key = p_key;
  
  RETURN config_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify system_config table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'system_config'
ORDER BY ordinal_position;

-- Verify config values were inserted
SELECT key, value, description
FROM public.system_config
WHERE key IN ('budget_threshold', 'faculty_president_threshold');

-- Test helper function
SELECT get_system_config('faculty_president_threshold') as threshold;

-- Migration complete!
-- Budget threshold: ₱5,000.00
-- Faculty requests with budget >= ₱5,000 will route to President
-- Faculty requests with budget < ₱5,000 will route to VP only

