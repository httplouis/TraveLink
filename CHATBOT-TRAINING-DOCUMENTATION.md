# TraviLink System - Comprehensive Chatbot Training Documentation

## System Overview

TraviLink is a comprehensive travel order and seminar application management system for Manuel S. Enverga University Foundation (MSEUF). The system handles the complete lifecycle of travel requests, from submission to approval, including budget management, vehicle/driver assignment, and feedback collection.

## Core Architecture

### Technology Stack
- **Frontend**: Next.js 14+ (React), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Microsoft Azure AD (OAuth)
- **Real-time**: Supabase Realtime subscriptions
- **Email**: Resend API
- **Deployment**: Vercel/Cloudflare

### Database Structure
- **Primary Tables**: `users`, `requests`, `departments`, `role_grants`, `audit_logs`
- **Approval Tables**: `request_history`, `approvals`, `approvals_history`
- **Supporting Tables**: `notifications`, `feedback`, `vehicles`, `drivers`, `faculties`, `admins`

## User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access, user management, role assignment
2. **Admin** (Ma'am Trizzia Marie Casino) - Request processing, vehicle/driver assignment, org requests
3. **Comptroller** - Budget review, payment confirmation
4. **HR** - HR approval, employee verification
5. **VP External** (Atty. Dario Opistan) - Executive approval
6. **President** - Final approval
7. **Department Head** - Department-level approval, can be requester
8. **Faculty/Staff** - Request submission, cannot travel alone
9. **Driver** - Vehicle operation, trip completion

### Role Assignment Rules
- **Admin**: Requires entry in `admins` table (use `assign_admin_role` RPC)
- **Faculty**: Requires entry in `faculties` table (use `assign_faculty_role` RPC)
- **Driver**: Requires entry in `drivers` table (use `assign_driver_role` RPC)
- **Head**: Can be assigned to multiple departments via `department_heads` table
- **VP/President**: Maps to `exec` role in database with `exec_type` field

## Request Workflow

### Request Types
1. **Travel Order** - Faculty/staff travel with budget
2. **Seminar Application** - Training/conference attendance
3. **School Service** - Vehicle/driver requests
4. **Org Request** - Manual entry by admin (face-to-face)

### Approval Flow Logic

#### Standard Flow (Faculty Requester)
1. **Requester** → Signs request
2. **Department Head** → Approves/rejects (can return to requester or send to parent head)
3. **Admin** (Ma'am TM) → Reviews, assigns vehicle/driver, edits budget if needed
   - Choice: Send to Comptroller (if budget) or HR (if no budget)
4. **Comptroller** → Reviews budget, can:
   - Edit budget
   - Send to requester for payment confirmation
   - Confirm payment, then send to HR
5. **HR** → Approves, routes based on requester type:
   - Faculty + Head included → VP only
   - Head/Director/Dean requester → President
   - Faculty alone → Cannot travel (validation error)
6. **VP External** → Approves (if needed)
7. **President** → Final approval, triggers feedback notification

#### Special Cases
- **Head as Requester**: Skips head approval, goes directly to Admin
- **VP as Head**: If VP is the head and already signed, skip VP approval → President
- **Faculty Alone**: System prevents travel (requires head inclusion)
- **Org Request**: Admin manual entry, skips head approval, goes to Comptroller or HR

### Request Statuses
- `draft` - Saved but not submitted
- `pending_requester_signature` - Awaiting requester signature
- `pending_head` - Awaiting department head approval
- `pending_admin` - Awaiting admin processing
- `pending_comptroller` - Awaiting comptroller review
- `pending_hr` - Awaiting HR approval
- `pending_vp` - Awaiting VP approval
- `pending_president` - Awaiting President approval
- `approved` - Fully approved
- `rejected` - Rejected at any stage
- `cancelled` - Cancelled by requester

## Key Features

### 1. Real-time Updates
- **All inbox pages** use Supabase Realtime subscriptions
- No page refresh needed
- Automatic updates when requests change status
- Debounced refetches to prevent excessive API calls

### 2. Choice-Based Sending
- **Head**: Can return to requester with reason OR send to parent head/admin
- **Admin**: Can choose Comptroller or HR
- **Comptroller**: Can send to requester for payment OR HR
- **HR**: Can choose VP or President based on routing logic
- **VP**: Can approve or send to President

### 3. Schedule View
- Shows slot availability (5 slots/day limit)
- Real-time display of pending/approved/rejected requests
- Calendar shows "1 pending" for unapproved requests
- Auto-updates on status changes

### 4. Feedback System
- **Forced Notification**: Appears 1 day after trip completion
- **UI Lock**: Locks interface until feedback provided
- **Shareable Link/QR**: Faculty/heads can generate QR codes for student feedback
- **Admin Dashboard**: View all feedback submissions and completed trips

### 5. Payment Confirmation Flow
- Comptroller can send request to requester for payment
- Requester confirms payment with notes
- Comptroller verifies and sends to HR

### 6. Vehicle & Driver Availability
- Prevents double-booking
- Admin cannot select unavailable vehicles/drivers
- Priority indication for head requests
- Real-time availability checking

### 7. Super Admin Features
- User management (CRUD)
- Role assignment with password confirmation
- Department management
- Audit logging for all actions
- System analytics dashboard
- Role grants history

## API Endpoints

### Authentication
- `POST /api/auth/login` - Microsoft Azure AD login
- `POST /api/auth/callback` - OAuth callback, creates/updates user profile
- `GET /api/me` - Get current user profile

### Requests
- `POST /api/requests/submit` - Submit new request
- `GET /api/requests/list` - List requests (with filters)
- `GET /api/requests/[id]/tracking` - Get request tracking details
- `POST /api/requests/confirm-payment` - Confirm payment by requester

### Approvals
- `PATCH /api/head` - Head approval/rejection
- `POST /api/admin/approve` - Admin approval
- `POST /api/comptroller/action` - Comptroller action
- `POST /api/hr/action` - HR action
- `POST /api/vp/action` - VP action
- `POST /api/president/action` - President action

### Inbox
- `GET /api/user/inbox` - User inbox (pending signature)
- `GET /api/admin/inbox` - Admin inbox
- `GET /api/head/inbox` - Head inbox
- `GET /api/hr/inbox` - HR inbox
- `GET /api/comptroller/inbox` - Comptroller inbox
- `GET /api/vp/inbox` - VP inbox
- `GET /api/president/inbox` - President inbox

### Super Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/[id]` - Update user (requires password)
- `DELETE /api/admin/users/[id]` - Delete user (requires password)
- `GET /api/super-admin/role-grants` - Role assignment history
- `GET /api/super-admin/audit-logs` - Audit logs
- `GET /api/super-admin/stats/system` - System analytics

### Feedback
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback
- `POST /api/feedback/generate-link` - Generate shareable feedback link
- `GET /api/admin/completed-trips` - Get completed trips for admin

## Database Functions (RPC)

### Role Assignment
- `assign_admin_role(p_user_id)` - Assign admin role (handles circular dependency)
- `assign_faculty_role(p_user_id, p_department_id)` - Assign faculty role
- `assign_driver_role(p_user_id)` - Assign driver role

### Workflow
- `WorkflowEngine` class in `src/lib/workflow/engine.ts` - Determines next approver and status

## UI Components

### Common Components
- `SearchableSelect` - Searchable dropdown (used for departments)
- `Skeleton` - Loading skeletons for better UX
- `PasswordConfirmDialog` - Password confirmation for sensitive actions
- `ApproverSelectionModal` - Choice-based sending modal
- `FeedbackLockModal` - UI lock until feedback provided

### Page Structure
- All pages have consistent layouts
- Left navigation sidebar (sticky)
- Top bar with notifications
- Main content area
- Skeleton loading states

## Real-time Subscriptions

All inbox pages subscribe to `requests` table changes:
```typescript
supabase
  .channel('requests-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'requests',
    filter: `status=eq.pending_${role}`
  }, () => {
    // Debounced refetch
  })
```

## Error Handling

### Common Errors
- **Foreign Key Violations**: Handled with `ON DELETE SET NULL` or `ON DELETE CASCADE`
- **RLS Errors**: Service role bypasses RLS for admin operations
- **Circular Dependencies**: Handled with database RPC functions
- **Validation Errors**: User-friendly error messages

### Error Response Format
```json
{
  "ok": false,
  "error": "Error message"
}
```

## Security

### Password Confirmation
- All super admin actions require password confirmation
- Verified by attempting sign-in with anon key
- Prevents unauthorized changes

### Row Level Security (RLS)
- Service role has full access for system operations
- Policies allow authenticated users based on role
- Audit logging bypasses RLS using service role

## Performance Optimizations

### Loading States
- Skeleton loading on all pages
- Optimistic UI updates
- Debounced API calls
- Real-time subscriptions instead of polling

### Database
- Indexed foreign keys
- Efficient joins
- Cached department data
- Optimized queries

## Common User Questions

### "How do I submit a request?"
1. Go to "New Request"
2. Fill in travel details
3. Add participants (if any)
4. Add budget breakdown (if applicable)
5. Sign and submit
6. Request goes to department head for approval

### "Why can't I travel alone?"
Faculty members cannot travel alone. The department head must be included in the travel participants. This is a system requirement.

### "How do I track my request?"
- Go to "My Submissions"
- Click on any request to see full tracking
- View approval history and current status

### "How do I approve a request as head?"
1. Go to "Inbox"
2. Click on pending request
3. Review details
4. Sign and choose:
   - Approve and send to admin/parent head
   - Return to requester with reason

### "How do I generate a feedback QR code?"
1. Go to "Feedback" page (admin/faculty/head)
2. Find completed trip
3. Click "Generate QR Code"
4. Share QR code with students

### "How do I assign a role to a user?"
1. Go to Super Admin → Users
2. Click Edit on user
3. Select role
4. Confirm with password
5. System automatically updates permissions

## System Rules

### Department Resolution
1. Check `department_id` (direct foreign key)
2. Check `department` text field with matching:
   - Exact match (case-insensitive)
   - Code match
   - Partial match
3. Fallback to `departments.head_name` (legacy)

### Role Mapping
- Frontend `vp`/`president` → Database `exec` with `exec_type`
- Frontend `comptroller` → Database `comptroller`
- All other roles map directly

### Request Validation
- Faculty alone cannot travel
- Dates must be valid (return >= departure)
- Budget must be positive
- Required fields must be filled

## Troubleshooting

### "User not found in database"
- Check if user exists in `auth.users`
- Check if profile exists in `public.users`
- Verify Azure AD sync

### "Department not found"
- Check `departments` table
- Verify department code matches
- Check `src/lib/org/departments.ts` for canonical names

### "RLS policy violation"
- Ensure service role is used for admin operations
- Check RLS policies in database
- Verify user has correct role

### "Circular dependency error"
- Use RPC functions for role assignment
- Don't manually insert into subtables
- Let database functions handle triggers

## Best Practices

1. **Always use service role** for admin operations (`createSupabaseServerClient(true)`)
2. **Log all actions** to audit_logs for tracking
3. **Use real-time subscriptions** instead of polling
4. **Show skeleton loading** during data fetch
5. **Validate on both client and server**
6. **Handle errors gracefully** with user-friendly messages
7. **Use password confirmation** for sensitive operations
8. **Track all timestamps** (submission_time, signature_time, receive_time)

## File Structure

```
src/
├── app/
│   ├── (protected)/          # Protected routes
│   │   ├── admin/           # Admin portal
│   │   ├── super-admin/     # Super admin portal
│   │   ├── user/            # User portal
│   │   ├── head/            # Head portal
│   │   ├── hr/              # HR portal
│   │   ├── comptroller/     # Comptroller portal
│   │   ├── vp/              # VP portal
│   │   └── president/       # President portal
│   └── api/                 # API routes
├── components/              # React components
├── lib/                     # Utilities and helpers
│   ├── workflow/           # Workflow engine
│   ├── org/                # Organization data
│   └── supabase/           # Supabase clients
└── types/                  # TypeScript types
```

## Contact & Support

- **Admin**: Ma'am Trizzia Marie Casino
- **VP External**: Atty. Dario Opistan
- **System Issues**: Check audit logs and error messages

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0

