# Design Document: Notification & Activity System Improvements

## Overview

This design document outlines the improvements to the TraviLink notification system and the addition of comprehensive activity logging. The changes ensure that:
1. Notifications display accurate timestamps (when sent to approver, not when request was created)
2. All workflow actions generate appropriate notifications
3. Users can view their activity history across all views
4. The comptroller layout has only one logout button

## Architecture

The system follows a layered architecture:

```mermaid
graph TB
    subgraph "Frontend Layer"
        ND[Notification Dropdowns]
        AH[Activity History Views]
        UI[User Interface Components]
    end
    
    subgraph "API Layer"
        NA[/api/notifications]
        AA[/api/activity]
        WA[Workflow Action APIs]
    end
    
    subgraph "Service Layer"
        NH[Notification Helpers]
        AL[Activity Logger]
        WE[Workflow Engine]
    end
    
    subgraph "Data Layer"
        NT[(notifications table)]
        RH[(request_history table)]
        AU[(audit_logs table)]
    end
    
    ND --> NA
    AH --> AA
    UI --> WA
    WA --> NH
    WA --> AL
    NH --> NT
    AL --> RH
    AL --> AU
```

## Components and Interfaces

### 1. Enhanced Notification Helper (`src/lib/notifications/helpers.ts`)

Extend the existing notification helper with new functions:

```typescript
// New notification types to add
export type NotificationType = 
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "request_returned"
  | "request_resubmitted"
  | "request_status_change"
  | "budget_modified"
  | "assignment"
  | "request_pending_signature"
  | "trip_completed"
  | "evaluation_reminder";

// Enhanced notification data with transition timestamp
export interface NotificationData {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  action_label?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  transition_at?: string; // When the request was sent to this user
}
```

### 2. Activity Logger Service (`src/lib/activity/logger.ts`)

New service for logging user activities:

```typescript
export interface ActivityLogEntry {
  user_id: string;
  action: string;
  action_type: "approve" | "reject" | "return" | "submit" | "edit" | "view" | "assign";
  target_type: "request" | "user" | "vehicle" | "driver";
  target_id: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export async function logActivity(entry: ActivityLogEntry): Promise<boolean>;
export async function getActivityHistory(userId: string, filters?: ActivityFilters): Promise<ActivityLogEntry[]>;
```

### 3. Activity History API (`src/app/api/activity/route.ts`)

New API endpoint for fetching user activity:

```typescript
// GET /api/activity
// Query params: action_type, start_date, end_date, limit, offset
// Returns: { ok: boolean, data: ActivityLogEntry[], total: number }
```

### 4. Activity History Component (`src/components/common/ActivityHistory.tsx`)

Reusable component for displaying activity history:

```typescript
interface ActivityHistoryProps {
  userId?: string; // If not provided, uses current user
  showFilters?: boolean;
  limit?: number;
}
```

## Data Models

### Notifications Table (existing, enhanced)

```sql
-- Add transition_at column if not exists
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS transition_at TIMESTAMPTZ DEFAULT NOW();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_transition_at 
ON notifications(user_id, transition_at DESC);
```

### Request History Table (existing, used for activity)

The existing `request_history` table already captures most activity data:
- `request_id`: The affected request
- `action`: The action performed
- `actor_id`: Who performed the action
- `actor_role`: The role of the actor
- `previous_status`: Status before action
- `new_status`: Status after action
- `comments`: Additional details
- `metadata`: JSON with extra info
- `created_at`: When the action occurred

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Notification Timestamp Accuracy
*For any* notification displayed to an approver about a pending request, the timestamp shown SHALL be the time when the request was forwarded to that approver (transition_at), not the original request creation time.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Return Notification Completeness
*For any* request that is returned by an approver, the system SHALL create a notification for the requester that includes: (a) the return reason, (b) a link to edit the request, and (c) the approver's role.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Resubmission Notification Completeness
*For any* returned request that is resubmitted, the system SHALL notify: (a) the approver who originally returned it with a link to their inbox, and (b) all other relevant approvers in the workflow chain.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Approval Progress Notification
*For any* approval action on a request, the system SHALL notify the requester with: (a) the approver's role, (b) the new status, and (c) high priority if it's the final approval.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Budget Modification Notification
*For any* budget modification by the comptroller, the system SHALL notify the requester with: (a) the old and new amounts, (b) the justification if provided, and (c) a summary if multiple items changed.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Activity History Completeness
*For any* user viewing their activity history, the system SHALL display all actions they performed, each with: (a) action type, (b) timestamp, (c) affected request, and (d) support filtering by action type and date range.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 7: Workflow Action Notification
*For any* workflow action (submit, reject, cancel, assign), the system SHALL create appropriate notifications for all relevant parties with the action details.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 8: Real-time Notification Update
*For any* notification marked as read, the unread count SHALL update immediately without requiring a page refresh.
**Validates: Requirements 9.3**

## Error Handling

1. **Notification Creation Failures**: Log errors but don't fail the main action. Notifications are non-critical.
2. **Activity Log Failures**: Log errors but don't fail the main action. Activity logging is non-critical.
3. **Database Connection Issues**: Retry with exponential backoff, max 3 attempts.
4. **Invalid User IDs**: Skip notification creation, log warning.

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties across all inputs

### Property-Based Testing Framework

Use **fast-check** for TypeScript property-based testing.

```typescript
import fc from 'fast-check';
```

### Test Categories

1. **Notification Timestamp Tests**
   - Verify transition_at is set correctly on notification creation
   - Verify notification dropdowns use transition_at for display

2. **Return/Resubmit Notification Tests**
   - Verify return creates notification with all required fields
   - Verify resubmit notifies original returner and other approvers

3. **Activity History Tests**
   - Verify all actions are logged
   - Verify filtering works correctly
   - Verify pagination works correctly

4. **UI Tests**
   - Verify comptroller layout has single logout button
   - Verify real-time notification updates

### Property-Based Test Annotations

Each property-based test MUST be tagged with:
```typescript
// **Feature: notification-activity-system, Property {number}: {property_text}**
// **Validates: Requirements X.Y**
```

### Test Configuration

Property-based tests should run a minimum of 100 iterations:
```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
);
```

