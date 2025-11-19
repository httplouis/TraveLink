-- ============================================
-- RLS Policies for Notifications Table
-- Ensures users can read their own notifications
-- ============================================

-- Enable RLS on notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- ============================================
-- SELECT POLICY: Users can view their own notifications
-- ============================================
-- This allows users to see notifications sent to them
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- UPDATE POLICY: Users can update their own notifications
-- ============================================
-- This allows users to mark notifications as read
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- DELETE POLICY: Users can delete their own notifications
-- ============================================
-- This allows users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================
-- INSERT POLICY: Service role can insert notifications
-- ============================================
-- This allows the backend (service role) to create notifications for any user
-- Note: This policy allows service_role to insert, but regular users cannot insert
-- (notifications are created by the system, not by users)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================
-- Verify policies were created
-- ============================================
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- Test query to verify users can see their notifications
-- ============================================
-- Run this as any authenticated user to verify:
-- SELECT COUNT(*) FROM public.notifications WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid());
-- Should return count of notifications for that user

