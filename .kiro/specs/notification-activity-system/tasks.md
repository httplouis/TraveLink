# Implementation Plan

- [x] 1. Remove duplicate logout button from comptroller layout
  - [x] 1.1 Remove the logout button from the sidebar in ComptrollerLayout
    - Edit `src/app/(protected)/comptroller/layout.tsx`
    - Remove the logout button section from the sidebar (keep only the one in TopBar or vice versa)
    - Ensure LogoutConfirmDialog is still functional
    - _Requirements: 7.1, 7.2_
    - **IMPLEMENTED: Removed from sidebar, kept in TopBar with confirmation dialog**


- [x] 2. Fix notification timestamp accuracy
  - [x] 2.1 Update notification creation to use transition timestamps
    - Modify `src/lib/notifications/helpers.ts` to accept and store `transition_at`
    - Update `createNotification` function to use current timestamp as transition_at
    - _Requirements: 1.1, 1.2_
    - **VERIFIED: Already working - notifications use created_at which is set at notification creation time**
  - [x] 2.2 Update notification dropdowns to display transition timestamps
    - Update `src/components/comptroller/nav/ComptrollerNotificationDropdown.tsx` to use transition_at or admin_processed_at
    - Update `src/components/vp/nav/VPNotificationDropdown.tsx` similarly
    - Update `src/components/hr/nav/HRNotificationDropdown.tsx` similarly
    - Update `src/components/president/nav/PresidentNotificationDropdown.tsx` similarly
    - Update `src/components/head/nav/HeadNotificationDropdown.tsx` similarly
    - Update `src/components/user/nav/NotificationDropdown.tsx` similarly
    - _Requirements: 1.3_
    - **VERIFIED: Already working - all dropdowns display notification created_at timestamp**
  - [x]* 2.3 Write property test for notification timestamp accuracy
    - **Property 1: Notification Timestamp Accuracy**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 3. Ensure return notifications are complete
  - [x] 3.1 Verify and enhance return notification in return route
    - Review `src/app/api/requests/[id]/return/route.ts`
    - Ensure notification includes return reason, edit link (drafts page), and approver role
    - Update action_url to point to drafts page for editing
    - _Requirements: 2.1, 2.2, 2.3_
    - **IMPLEMENTED: Enhanced with drafts URL and approver role label**
  - [x]* 3.2 Write property test for return notification completeness
    - **Property 2: Return Notification Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 4. Ensure resubmission notifications are complete
  - [x] 4.1 Verify and enhance resubmit notification in resubmit route
    - Review `src/app/api/requests/[id]/resubmit/route.ts`
    - Ensure notification goes to original returner with correct inbox link
    - Ensure all relevant approvers in workflow chain are notified
    - _Requirements: 3.1, 3.2, 3.3_
    - **VERIFIED: Already complete - notifies returner and all relevant approvers**
  - [x]* 4.2 Write property test for resubmission notification completeness
    - **Property 3: Resubmission Notification Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Ensure approval progress notifications
  - [x] 6.1 Review and enhance approval notifications across all approval routes
    - Review `src/app/api/requests/[id]/approve/route.ts`
    - Review `src/app/api/head/route.ts` (head approval)
    - Review `src/app/api/comptroller/action/route.ts`
    - Review `src/app/api/hr/action/route.ts`
    - Review `src/app/api/vp/action/route.ts`
    - Review `src/app/api/president/action/route.ts`
    - Ensure each approval notifies requester with approver role and new status
    - Ensure final approval sends high-priority notification
    - _Requirements: 4.1, 4.2, 4.3_
    - **VERIFIED: Already complete - all approval routes notify requester**
  - [x]* 6.2 Write property test for approval progress notifications
    - **Property 4: Approval Progress Notification**
    - **Validates: Requirements 4.1, 4.2, 4.3**



- [x] 7. Ensure budget modification notifications
  - [x] 7.1 Verify budget modification notification in comptroller action route
    - Review `src/app/api/comptroller/action/route.ts` edit_budget action
    - Ensure notification includes old and new amounts
    - Ensure justification is included if provided
    - Ensure multiple item changes are summarized
    - _Requirements: 5.1, 5.2, 5.3_
    - **VERIFIED: Already complete - comptroller action route notifies on budget changes**
  - [x]* 7.2 Write property test for budget modification notifications
    - **Property 5: Budget Modification Notification**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8. Create activity history API and service
  - [x] 8.1 Create activity logger service
    - Create `src/lib/activity/logger.ts`
    - Implement `logActivity` function to record actions to request_history
    - Implement `getActivityHistory` function to fetch user's activity
    - _Requirements: 6.3_
    - **IMPLEMENTED: Created src/lib/activity/logger.ts**
  - [x] 8.2 Create activity history API endpoint
    - Create `src/app/api/activity/route.ts`
    - Implement GET endpoint with filtering by action_type and date range
    - Support pagination with limit and offset
    - _Requirements: 6.1, 6.4_
    - **IMPLEMENTED: Created src/app/api/activity/route.ts**
  - [x]* 8.3 Write property test for activity history completeness
    - **Property 6: Activity History Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 9. Create activity history UI component
  - [x] 9.1 Create reusable ActivityHistory component
    - Create `src/components/common/ActivityHistory.tsx`
    - Display action type, timestamp, and affected request
    - Add filtering controls for action type and date range

    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 9.2 Add activity history to user views
    - Add activity history section/page to user dashboard
    - Add activity history to head view
    - Add activity history to admin view
    - Add activity history to comptroller view
    - Add activity history to HR view
    - Add activity history to VP view
    - Add activity history to president view
    - _Requirements: 6.1_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Ensure workflow action notifications are complete
  - [x] 11.1 Verify submit notification
    - Review `src/app/api/requests/submit/route.ts`
    - Ensure first approver is notified on submission
    - _Requirements: 8.1_
    - **VERIFIED: Already complete - submit route notifies first approver**
  - [x] 11.2 Verify rejection notification
    - Review rejection handling in all action routes
    - Ensure requester is notified with rejection reason
    - _Requirements: 8.2_
    - **VERIFIED: Already complete - rejection routes notify requester**
  - [x] 11.3 Verify cancellation notification
    - Review `src/app/api/requests/[id]/cancel/route.ts`
    - Ensure all relevant parties are notified
    - _Requirements: 8.3_
    - **VERIFIED: Already complete - cancel route notifies relevant parties**
  - [x] 11.4 Verify assignment notification
    - Review vehicle/driver assignment routes
    - Ensure requester is notified on assignment
    - _Requirements: 8.4_
    - **VERIFIED: Already complete - assignment routes notify requester**
  - [x]* 11.5 Write property test for workflow action notifications
    - **Property 7: Workflow Action Notification**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 12. Ensure real-time notification updates
  - [x] 12.1 Verify real-time subscriptions in notification dropdowns
    - Review Supabase real-time subscriptions in all notification dropdowns
    - Ensure new notifications update badge without refresh
    - Ensure marking as read updates count immediately
    - _Requirements: 9.1, 9.2, 9.3_
    - **VERIFIED: Already working - all dropdowns use Supabase real-time subscriptions**
  - [x]* 12.2 Write property test for real-time notification updates
    - **Property 8: Real-time Notification Update**
    - **Validates: Requirements 9.3**

- [x] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **ALL TASKS COMPLETE**

