-- ═══════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES - Critical for Fast Queries
-- Run these to speed up your Vercel app
-- ═══════════════════════════════════════════════════════════════════════

-- These indexes are critical for frequently queried columns
-- They dramatically speed up queries, reducing Supabase egress and response times

-- 1. Status + Created At (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_created 
ON requests(status, created_at DESC);

-- 2. Requester + Status (for user dashboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_requester_status 
ON requests(requester_id, status);

-- 3. Department + Status (for head/exec views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_department_status 
ON requests(department_id, status);

-- 4. Current Approver Role (for inbox filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_current_approver_role 
ON requests(current_approver_role) 
WHERE current_approver_role IS NOT NULL;

-- 5. Submitted By User (for representative submissions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_submitted_by 
ON requests(submitted_by_user_id) 
WHERE submitted_by_user_id IS NOT NULL;

-- 6. Assigned Driver + Status (for driver views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_driver_status 
ON requests(assigned_driver_id, status) 
WHERE assigned_driver_id IS NOT NULL;

-- 7. Assigned Vehicle + Status (for vehicle tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_vehicle_status 
ON requests(assigned_vehicle_id, status) 
WHERE assigned_vehicle_id IS NOT NULL;

-- 8. Created At (for sorting - already exists but ensure it's there)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_created_at_desc 
ON requests(created_at DESC);

-- 9. Updated At (for recent activity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_updated_at_desc 
ON requests(updated_at DESC) 
WHERE updated_at IS NOT NULL;

-- 10. Users - Auth User ID (for fast auth lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_auth_user_id 
ON users(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- 11. Users - Department + Role (for filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_department_role 
ON users(department_id, role) 
WHERE department_id IS NOT NULL;

-- 12. Vehicles - Status (for availability queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status 
ON vehicles(status);

-- 13. Request History - Request ID + Created At (for timeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_history_request_created 
ON request_history(request_id, created_at DESC);

-- 14. Notifications - User ID + Read Status (for unread counts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read) 
WHERE user_id IS NOT NULL;

-- 15. Notifications - User ID + Created At (for recent notifications)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('requests', 'users', 'vehicles', 'request_history', 'notifications')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

