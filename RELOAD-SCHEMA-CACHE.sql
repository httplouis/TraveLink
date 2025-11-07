-- ============================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ============================================

-- This tells PostgREST to reload its schema cache
-- so it can see the new foreign key constraint
NOTIFY pgrst, 'reload schema';

-- Done! Now refresh your browser
