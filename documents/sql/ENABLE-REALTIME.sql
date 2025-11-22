-- ============================================
-- ENABLE SUPABASE REALTIME ON REQUESTS TABLE
-- ============================================

-- Enable realtime for the requests table
ALTER PUBLICATION supabase_realtime ADD TABLE requests;

-- Verify realtime is enabled
SELECT schemaname, tablename, pubname
FROM pg_publication_tables
WHERE tablename = 'requests';

-- ============================================
-- ✅ After running, realtime updates will work!
-- No need to refresh the page to see new requests!
-- ============================================
