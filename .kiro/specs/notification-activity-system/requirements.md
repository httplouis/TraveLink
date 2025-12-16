# Requirements Document

## Introduction

This document specifies the requirements for improving the notification system and adding comprehensive activity logging across all user views in the TraviLink travel order management system. The improvements address notification timing issues, ensure proper notification delivery for all workflow actions, and add activity history tracking for all user roles.

## Glossary

- **TraviLink**: The travel order management system
- **Requester**: A user who submits travel order requests
- **Approver**: Any user who can approve/reject/return requests (Head, Admin, Comptroller, HR, VP, President)
- **Notification**: An in-app message alerting users about actions on their requests
- **Activity Log**: A chronological record of all actions performed by a user
- **Return**: Action where an approver sends a request back to the requester for revision
- **Resubmit**: Action where a requester sends back a returned request after making changes

## Requirements

### Requirement 1: Notification Timing Accuracy

**User Story:** As an approver, I want to see when a request was sent to me (not when it was originally created), so that I can accurately track my pending workload.

#### Acceptance Criteria

1. WHEN a notification is displayed for a pending request THEN the system SHALL show the timestamp of when the request was forwarded to the current approver
2. WHEN a request moves from one approver to another THEN the system SHALL record the transition timestamp in the notification
3. WHEN displaying notification time THEN the system SHALL use the most recent status change timestamp relevant to the recipient

### Requirement 2: Return Action Notifications

**User Story:** As a requester, I want to be notified when my request is returned for revision, so that I can promptly make the necessary changes.

#### Acceptance Criteria

1. WHEN an approver returns a request THEN the system SHALL create a notification for the requester with the return reason
2. WHEN a request is returned THEN the notification SHALL include a direct link to the drafts page for editing
3. WHEN a request is returned THEN the system SHALL indicate which approver returned it and their role

### Requirement 3: Resubmission Notifications

**User Story:** As an approver who returned a request, I want to be notified when the requester resubmits it, so that I can continue the review process.

#### Acceptance Criteria

1. WHEN a requester resubmits a returned request THEN the system SHALL notify the approver who originally returned it
2. WHEN a resubmission notification is created THEN the system SHALL include a link to the approver's inbox
3. WHEN a request is resubmitted THEN the system SHALL notify all relevant approvers in the workflow chain

### Requirement 4: Approval Progress Notifications

**User Story:** As a requester, I want to be notified each time someone signs/approves my request, so that I can track its progress through the approval chain.

#### Acceptance Criteria

1. WHEN any approver signs a request THEN the system SHALL notify the requester with the approver's role
2. WHEN a request moves to the next approval stage THEN the system SHALL notify the requester of the new status
3. WHEN a request receives final approval THEN the system SHALL send a high-priority notification to the requester

### Requirement 5: Budget Modification Notifications

**User Story:** As a requester, I want to be notified when the comptroller modifies my budget, so that I am aware of any changes to my travel expenses.

#### Acceptance Criteria

1. WHEN the comptroller edits a budget THEN the system SHALL notify the requester with the old and new amounts
2. WHEN a budget is modified THEN the notification SHALL include the justification if provided
3. WHEN multiple budget items are changed THEN the system SHALL summarize all changes in a single notification

### Requirement 6: Activity History for All Views

**User Story:** As a user of any role, I want to see a history of all my actions in the system, so that I can track my activity and reference past decisions.

#### Acceptance Criteria

1. WHEN a user accesses their activity history THEN the system SHALL display all actions they have performed
2. WHEN displaying activity history THEN the system SHALL show action type, timestamp, and affected request
3. WHEN an action is performed THEN the system SHALL record it in the activity log with the actor's ID and role
4. WHEN viewing activity history THEN the system SHALL allow filtering by action type and date range

### Requirement 7: Remove Duplicate Logout Button

**User Story:** As a comptroller user, I want a single logout option, so that the interface is clean and not confusing.

#### Acceptance Criteria

1. WHEN the comptroller layout is rendered THEN the system SHALL display only one logout button
2. WHEN the logout button is clicked THEN the system SHALL show a confirmation dialog before logging out

### Requirement 8: Notification Delivery Completeness

**User Story:** As a system administrator, I want all workflow actions to generate appropriate notifications, so that no user misses important updates.

#### Acceptance Criteria

1. WHEN a request is submitted THEN the system SHALL notify the first approver in the workflow
2. WHEN a request is rejected THEN the system SHALL notify the requester with the rejection reason
3. WHEN a request is cancelled THEN the system SHALL notify all relevant parties
4. WHEN a vehicle/driver is assigned THEN the system SHALL notify the requester

### Requirement 9: Real-time Notification Updates

**User Story:** As a user, I want to see new notifications without refreshing the page, so that I can respond to updates promptly.

#### Acceptance Criteria

1. WHEN a new notification is created for a user THEN the system SHALL update the notification badge in real-time
2. WHEN the notification dropdown is open THEN the system SHALL display new notifications as they arrive
3. WHEN a notification is marked as read THEN the system SHALL update the unread count immediately

