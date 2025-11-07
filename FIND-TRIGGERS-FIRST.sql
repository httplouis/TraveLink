-- ============================================
-- FIND ALL TRIGGERS ON USERS TABLE
-- ============================================

SELECT 
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  substring(action_statement, 1, 100) as action_snippet
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- After seeing results, we'll disable the correct trigger name
-- ============================================
