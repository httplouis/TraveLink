# TraviLink Complete System Documentation

## System Overview

TraviLink is a comprehensive travel management system for Manuel S. Enverga University Foundation (MSEUF) that handles travel order requests, vehicle scheduling, driver management, and approval workflows.

## Architecture

### Technology Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Microsoft Azure AD integration
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (profile pictures, documents)

### Database Schema

#### Core Tables
- `users` - User profiles and authentication
- `departments` - Academic departments and offices
- `requests` - Travel order and seminar requests
- `request_history` - Complete audit trail of request status changes
- `notifications` - In-app notifications
- `vehicles` - Vehicle fleet management
- `drivers` - Driver profiles and availability
- `role_grants` - Role assignment history
- `audit_logs` - System-wide audit trail
- `admins` - Admin role assignments
- `faculties` - Faculty role assignments
- `drivers` - Driver role assignments
- `department_heads` - Department head assignments (many-to-many)
- `approvals` - Approval records
- `approvals_history` - Approval history

## User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access, user management, role assignments
2. **Admin** (Trizzia Marie Casino) - Request processing, vehicle/driver assignment, manual org requests
3. **Comptroller** - Budget review, payment confirmation, expense computation
4. **HR** - Human resources approval
5. **VP External** (Atty. Dario Opistan) - Executive approval
6. **President** - Final approval authority
7. **Head/Director/Dean** - Department head approval
8. **Faculty/Staff** - Request submission
9. **Driver** - Trip execution, status updates

### Role Mapping
- Frontend `vp` and `president` → Database `exec` role
- `comptroller` → Direct mapping
- `admin`, `head`, `hr`, `faculty`, `staff`, `driver` → Direct mapping

## Request Workflow

### Travel Order Flow

#### Standard Flow (Faculty/Staff)
1. **Requester** submits request → `pending_head`
2. **Department Head** reviews → `pending_parent_head` (if parent dept exists) or `pending_admin`
3. **Parent Head** (if applicable) → `pending_admin`
4. **Admin** (Ma'am TM) processes, assigns vehicle/driver → `pending_comptroller` (if budget) or `pending_hr`
5. **Comptroller** computes budget → sends to requester for payment → confirms payment → `pending_hr`
6. **HR** approves → `pending_exec` (VP)
7. **VP External** (Atty. Dario Opistan) → `pending_exec` (President) or `approved` (if Faculty+Head)
8. **President** → `approved` (final)

#### Head/Director/Dean Requester Flow
- Skips VP if head requester → Goes directly to President
- Must reach President (mandatory)

#### Faculty + Head Included Flow
- Stops at VP (not President)
- VP is final approver

#### Faculty Alone Rule
- **Cannot travel alone** - Validation prevents submission
- Must include department head in travel participants

### Org Request Flow
- Face-to-face with Admin (Ma'am TM)
- Manual entry by admin
- Admin signs → Comptroller → Requester (payment) → Comptroller (confirm) → HR → VP → President

## API Endpoints

### Request Management
- `POST /api/requests/submit` - Submit new request
- `GET /api/requests/[id]` - Get request details
- `PATCH /api/requests/[id]` - Update request

### Approval Endpoints
- `PATCH /api/head` - Department head approval (with choice-based sending)
- `POST /api/admin/approve` - Admin approval (with choice-based sending)
- `POST /api/comptroller/action` - Comptroller action (payment flow)
- `POST /api/hr/action` - HR approval (with routing logic)
- `POST /api/vp/action` - VP approval (with routing logic)
- `POST /api/president/action` - President final approval

### Choice-Based Sending
All approval endpoints support:
- `nextApproverId` - Specific approver to send to
- `nextApproverRole` - Role of next approver
- `returnToRequester` - Option to return with reason (head only)

### Schedule & Availability
- `GET /api/schedule/availability` - Get detailed schedule with status
- `GET /api/trips/my-trips` - Get user's trips

### User Management
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/[id]` - Update user (requires password confirmation)
- `DELETE /api/admin/users/[id]` - Delete user (requires password confirmation)

### Approvers
- `GET /api/approvers` - Get department head for department
- `GET /api/approvers/list` - List potential approvers for choice-based sending

## Key Features

### 1. Schedule View (Faculty/Staff)
- **Real-time slot tracking**: Shows pending, approved, rejected requests
- **Slot limit**: 5 slots per day
- **Auto-update**: Polls every 10 seconds
- **Visual indicators**: Badges for pending/approved on calendar days

### 2. Choice-Based Sending
- Messenger-style approver selection
- Search functionality
- Return to requester option (with reason)
- Full history tracking

### 3. Payment Confirmation Flow (Comptroller)
- Send to requester for payment
- Requester sees expenses in inbox
- Comptroller confirms payment
- Then sends to HR

### 4. Comprehensive History Tracking
- All status changes logged in `request_history`
- Metadata includes: signature_at, sent_to, sent_to_id, routing_decision
- Submission time, approval time, receive time tracked

### 5. Real-time Notifications
- Inbox auto-updates without refresh
- Full details in notifications
- Works for travel orders and seminar applications

### 6. On-Behalf Requests
- Faculty can request for co-faculty
- Sends to co-faculty for signature first
- Then to head
- Then to admin

### 7. Vehicle & Driver Availability
- Tracks availability by date
- Prevents double-booking
- Priority indicator for head requests

### 8. Super Admin Features
- User management (CRUD)
- Role assignments (with password confirmation)
- Department management
- Audit logs
- Role grants history
- System analytics

## Database Functions (RPC)

### Role Assignment Functions
- `assign_admin_role(p_user_id)` - Handles circular dependency for admin role
- `assign_faculty_role(p_user_id, p_department_id)` - Handles circular dependency for faculty role
- `assign_driver_role(p_user_id)` - Handles circular dependency for driver role

These functions temporarily disable triggers to handle circular dependencies between `users` table and role subtables (`admins`, `faculties`, `drivers`).

## Security

### Row Level Security (RLS)
- `service_role` has full access for system operations
- Policies: `service_role_all_table_name` for admin operations
- Functions use `SECURITY DEFINER` to bypass RLS when needed

### Password Confirmation
- All super admin actions require password confirmation
- Uses `PasswordConfirmDialog` component
- Verified using anon key client (sign-in attempt)

### Foreign Key Constraints
- `ON DELETE SET NULL` for optional references
- `ON DELETE CASCADE` for required references
- Never manually delete/nullify if FK handles it

## Department Resolution Logic

Always checks in this order:
1. `department_id` (direct foreign key)
2. `department` text field with matching:
   - Exact match (case-insensitive)
   - Code match (e.g., "CCMS" matches "College of Computing and Multimedia Studies")
   - Partial match (contains)
3. Fallback to `departments.head_name` (legacy only)

## Error Handling

### Logging Format
- Always use `[PREFIX]` format (e.g., `[PATCH /api/admin/users/[id]]`)
- Log full error objects: `message`, `code`, `details`, `hint`
- Include context: user ID, operation, etc.

### API Response Format
```typescript
{
  ok: boolean;
  error?: string;
  data?: any;
}
```

## Frontend Components

### Dashboard Components
- `DashboardView` - Main user dashboard
- `DashboardHero` - Welcome section
- `KpiCard` - Metric cards with trends
- `QuickActions` - Action buttons
- `AvailabilityHeatmap` - Schedule visualization
- `ActivityTimeline` - Recent activity feed
- `VehicleShowcase` - Vehicle display
- `AnalyticsChart` - Data visualization

### Common Components
- `PasswordConfirmDialog` - Password confirmation modal
- `ApproverSelectionModal` - Choice-based approver selection
- `StatusBadge` - Status indicators
- `PersonDisplay` - User profile display

## Real-time Updates

### Supabase Realtime Subscriptions
- Used for inbox updates
- Used for schedule updates
- Used for notification delivery

### Polling
- Schedule view polls every 10 seconds
- Dashboard stats refresh on mount

## Testing Checklist

Before considering a feature complete:
1. Test with different user roles
2. Test password confirmation flow
3. Verify audit logs are created
4. Check role_grants table is updated
5. Test error scenarios
6. Verify RLS policies don't block legitimate operations
7. Test choice-based sending
8. Test payment confirmation flow
9. Test routing logic (Head→President, Faculty+Head→VP)
10. Test on-behalf requests

## Known Issues & Solutions

### Circular Dependencies in Role Assignment
**Issue**: Triggers check for subtable entries before role is set
**Solution**: Use RPC functions that temporarily disable triggers

### Foreign Key Constraints on Deletion
**Issue**: Cannot delete users due to FK constraints
**Solution**: Use `ON DELETE SET NULL` or `ON DELETE CASCADE` at database level

### RLS Errors on Audit Logs
**Issue**: Triggers fail to insert into audit_log due to RLS
**Solution**: Create policies allowing `service_role` and `PUBLIC` to insert

## Future Enhancements

1. **Feedback System**: Force notification after trip, locked UI, shareable link/QR
2. **Advanced Analytics**: System-wide analytics dashboard
3. **Mobile App**: React Native app for drivers
4. **Email Notifications**: Email alerts for critical actions
5. **PDF Generation**: Automated travel order PDF generation
6. **Integration**: Calendar sync, expense tracking

## Deployment

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`

### Database Migrations
- Always test on copy of production data
- Use `DROP CONSTRAINT IF EXISTS` before recreating
- Include verification queries
- Document all changes

## Support & Maintenance

### Key Contacts
- **Admin**: Trizzia Marie Casino
- **VP External**: Atty. Dario Opistan
- **System Admin**: Super Admin role

### Common Tasks
- User role assignment
- Department head assignment
- Vehicle/driver assignment
- Request troubleshooting
- Audit log review

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Maintained By**: TraviLink Development Team

