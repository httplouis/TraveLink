# TraviLink — Request Details (History) Enhancement — Master Prompt

**Version:** 1.0  
**Date:** November 2025  
**Status:** Implementation Ready

---

## 🎯 PROJECT OVERVIEW

Enhance the **Request Details Submission History** page for Faculty/Staff (User) view with a beautiful, professional UI that will serve as the template for all other roles (Head, HR, VP, President). The page must display complete request information with hoverable profiles, signature chain tracking, and a polished design that's "thesis-worthy."

---

## 📋 CORE REQUIREMENTS

### 1. **Request Details Page Enhancement**

**Route:** `/user/history/[requestId]` (or `/user/request/history/[requestId]`)

**Key Features:**
- Beautiful, minimal UI (not colorful, easy on the eyes)
- Maroon header tone matching university branding
- All names have hoverable profile cards
- Signature chain shows previous signatures + next signer
- Dates formatted as "November 13, 2025" (long format)
- Tracking timeline with full history
- Print-ready layout

### 2. **Approval Workflow with Choices**

**Current Problem:** Fixed routing (requester → dept head → admin → comptroller → hr → vp/pres)

**New Solution:** Dynamic routing with approver selection

**Workflow Changes:**
- After each approval, show "Send and Approve to:" dropdown/modal
- Display list of eligible approvers with:
  - Profile picture
  - Name
  - Position/Department
  - Role badge (Faculty/Staff, Head, HR, VP, President)
- Allow selection of next approver
- Track all routing decisions in database

**Special Cases:**
- **Heads (Deans, Directors):** Must reach President for final approval
- **VP Selection:** Choose from VP for Academics, VP for Admin, VP for Finance (3 VPs)
- **Return to Requester:** Option to return for changes (budget/driver changes)
- **Return to Admin:** Option to return for driver/vehicle reassignment

### 3. **Mandatory Notes Requirement**

- All approvals require notes/comments
- **Admins:** Notes are MANDATORY (cannot approve without notes)
- Other roles: Strongly recommended, but not blocking
- Display notes in timeline and signature sections

### 4. **Comptroller Budget Tracking**

**New Page:** `/comptroller/budget` or `/comptroller/departments/budget`

**Features:**
- CRUD interface for department budgets
- Set total allocated budget per department per semester
- Track:
  - Total allocated
  - Total used (from approved requests)
  - Total pending (from pending requests)
  - Remaining budget
- Visual indicators (progress bars, color coding)
- Budget history/audit log

**User Visibility:**
- Users see remaining budget for their department
- Display on dashboard or request form
- Show: "Remaining Budget: ₱X,XXX for [Semester]"

### 5. **Complete Faculty/Staff View**

Ensure all pages are functional and polished:
- ✅ Settings page (preferences, notifications, profile)
- ✅ Profile page (edit profile, upload picture, signature)
- ✅ Notifications (real-time, mark as read, actions)
- ✅ Drivers & Vehicles page (view available, preferences)
- ✅ History page (list view with filters)
- ✅ Request Details page (enhanced version)

---

## 🎨 UI/UX SPECIFICATIONS

### Request Details Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Request Details                    [Print] [Close] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TO-2025-091  [Status Badge: Approved]                   │ │
│ │ Campus visit and coordination with partner hospital     │ │
│ │                                                           │ │
│ │ 📅 November 17, 2025 - November 19, 2025                │ │
│ │ 📍 Manila, Philippines                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Details] [Timeline] [Attachments]  ← Tabs              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                           │ │
│ │ Purpose:                                                  │ │
│ │ Campus visit and coordination with partner hospital...   │ │
│ │                                                           │ │
│ │ ┌───────────────┬───────────────┐                       │ │
│ │ │ Destination    │ Department    │                       │ │
│ │ │ Manila          │ CNAHS         │                       │ │
│ │ │                 │               │                       │ │
│ │ │ Travel Dates    │ Budget        │                       │ │
│ │ │ Nov 17-19, 2025 │ ₱6,100        │                       │ │
│ │ └───────────────┴───────────────┘                       │ │
│ │                                                           │ │
│ │ Transportation: University Vehicle                       │ │
│ │ Pick-up: Main Gate at 7:00 AM                            │ │
│ │                                                           │ │
│ │ Participants:                                            │ │
│ │ • [Photo] John Doe - Faculty, CNAHS                     │ │
│ │ • [Photo] Jane Smith - Staff, CNAHS                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Requested By                                             │ │
│ │ [Photo] John Doe                                         │ │
│ │ Faculty, CNAHS                                           │ │
│ │ john.doe@eu.edu.ph                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Approval Signatures                                       │ │
│ │                                                           │ │
│ │ ✓ Requester                                              │ │
│ │   [Photo] John Doe                                       │ │
│ │   Faculty, CNAHS                                         │ │
│ │   Signed: November 13, 2025, 2:41 PM                    │ │
│ │   [Signature Image]                                      │ │
│ │                                                           │ │
│ │ ✓ Department Head                                        │ │
│ │   [Photo] Dr. Maria Santos                               │ │
│ │   Dean, CNAHS                                            │ │
│ │   Approved: November 14, 2025, 9:15 AM                   │ │
│ │   [Signature Image]                                      │ │
│ │   Comments: "Approved for official business travel."     │ │
│ │                                                           │ │
│ │ ✓ Admin                                                   │ │
│ │   [Photo] Trizzia Casiño                                 │ │
│ │   Administrator                                          │ │
│ │   Processed: November 14, 2025, 10:30 AM                 │ │
│ │   [Signature Image]                                      │ │
│ │   Notes: "Assigned Bus 1 and Driver Pedro Reyes"        │ │
│ │                                                           │ │
│ │ ✓ Comptroller                                            │ │
│ │   [Photo] Carlos Remiendo                                │ │
│ │   Comptroller                                            │ │
│ │   Approved: November 15, 2025, 2:00 PM                    │ │
│ │   [Signature Image]                                      │ │
│ │   Comments: "Budget verified and approved."             │ │
│ │                                                           │ │
│ │ ✓ HR Director                                            │ │
│ │   [Photo] Maria Avila                                    │ │
│ │   HR Director                                            │ │
│ │   Approved: November 15, 2025, 3:45 PM                    │ │
│ │   [Signature Image]                                      │ │
│ │   Comments: "HR review completed."                       │ │
│ │                                                           │ │
│ │ ⏳ Vice President (Next)                                 │ │
│ │   Waiting for approval from VP for Academics             │ │
│ │   [You're Next] badge if current user is VP              │ │
│ │                                                           │ │
│ │ Note: Next approver sees all previous signatures        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Request Timeline                                         │ │
│ │                                                           │ │
│ │ ● Request Submitted                                      │ │
│ │   [Photo] John Doe                                       │ │
│ │   November 13, 2025, 2:41 PM                            │ │
│ │                                                           │ │
│ │ ● Department Head Approved                               │ │
│ │   [Photo] Dr. Maria Santos                               │ │
│ │   November 14, 2025, 9:15 AM                            │ │
│ │   Comments: "Approved for official business travel."    │ │
│ │                                                           │ │
│ │ ● Admin Processed                                        │ │
│ │   [Photo] Trizzia Casiño                                 │ │
│ │   November 14, 2025, 10:30 AM                           │ │
│ │   Details: "Assigned Bus 1 and Driver Pedro Reyes"      │ │
│ │   Notes: "Vehicle and driver assigned successfully."     │ │
│ │                                                           │ │
│ │ ● Budget Reviewed                                        │ │
│ │   [Photo] Carlos Remiendo                               │ │
│ │   November 15, 2025, 2:00 PM                            │ │
│ │   Details: "Budget adjusted from ₱6,100 → ₱6,500"       │ │
│ │                                                           │ │
│ │ ● HR Acknowledged                                        │ │
│ │   [Photo] Maria Avila                                    │ │
│ │   November 15, 2025, 3:45 PM                            │ │
│ │   Comments: "HR review completed."                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [View Tracking Map] [Print] [Close]                          │
└─────────────────────────────────────────────────────────────┘
```

### Hoverable Profile Card

**Trigger:** Hover over any name (requester, approvers, participants)

**Display:**
```
┌────────────────────────────────────┐
│ [Photo] John Doe                   │
│ Faculty                            │
│ College of Nursing and Allied      │
│ Health Sciences                    │
│                                    │
│ 📧 john.doe@eu.edu.ph             │
│ 📱 +63 912 345 6789                │
│ 🏢 CNAHS Building, Room 201        │
│                                    │
│ Status: Online now                 │
└────────────────────────────────────┘
```

### Signature Chain Visibility Rules

**For Next Approver:**
- See ALL previous signatures (images + timestamps)
- See ALL previous approver names with profiles
- See skip reasons if any stage was skipped
- See return reasons if any stage was returned
- Highlight "You're Next" badge if current user is next approver

**For Completed Requests:**
- Show full signature chain
- All signatures visible
- All timestamps visible
- All comments/notes visible

### Date Formatting

**Standard Format:** "November 13, 2025"  
**With Time:** "November 13, 2025, 2:41 PM"

**Implementation:**
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
};
```

---

## 🔄 APPROVAL WORKFLOW WITH CHOICES

### Approval Modal Enhancement

**Current:** Fixed routing after approval

**New:** Selection modal after approval

```
┌─────────────────────────────────────────────────────────┐
│ Approve Request                              [X]         │
│ TO-2025-091 - Campus visit...                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Your Approval:                                           │
│ [Signature Pad]                                          │
│                                                           │
│ Notes/Comments (Required):                               │
│ [Textarea - Required]                                    │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Send and Approve to:                                 │ │
│ │                                                       │ │
│ │ ○ Admin (Automatic)                                 │ │
│ │   Trizzia Casiño - Administrator                     │ │
│ │                                                       │ │
│ │ ○ Return to Requester                                │ │
│ │   John Doe - Faculty, CNAHS                          │ │
│ │   Reason: [Dropdown: Budget Change, Driver Change]    │ │
│ │                                                       │ │
│ │ ○ Skip to HR (If no budget)                         │ │
│ │   Maria Avila - HR Director                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [Cancel] [Approve and Send]                               │
└─────────────────────────────────────────────────────────┘
```

### Admin Approval Modal

**Special Features:**
- Assign Driver (required if vehicle needed)
- Assign Vehicle (required if vehicle needed)
- **Notes are MANDATORY**
- Send to options:
  - Comptroller (if budget exists)
  - HR (if no budget)
  - Return to Requester (if changes needed)
  - Return to Head (if major changes)

```
┌─────────────────────────────────────────────────────────┐
│ Admin Approval                              [X]           │
│ TO-2025-091 - Campus visit...                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Assign Resources:                                         │
│                                                           │
│ Driver: [Dropdown - Required]                            │
│ • Pedro Reyes - Professional License                      │
│ • Juan Dela Cruz - Professional License                   │
│                                                           │
│ Vehicle: [Dropdown - Required]                            │
│ • Bus 1 - 50 seats                                        │
│ • Van 2 - 15 seats                                        │
│                                                           │
│ Notes (MANDATORY):                                        │
│ [Textarea - Required, min 20 characters]                │
│                                                           │
│ Send and Approve to:                                      │
│                                                           │
│ ○ Comptroller (Budget Review)                            │
│   [Photo] Carlos Remiendo                                │
│   Comptroller                                            │
│                                                           │
│ ○ HR Director (No Budget)                               │
│   [Photo] Maria Avila                                    │
│   HR Director                                            │
│                                                           │
│ ○ Return to Requester                                    │
│   [Photo] John Doe                                       │
│   Faculty, CNAHS                                         │
│   Reason: [Driver/Vehicle Change Needed]                │
│                                                           │
│ [Cancel] [Approve and Send]                               │
└─────────────────────────────────────────────────────────┘
```

### VP Selection Modal

**When HR approves, show VP selection:**

```
┌─────────────────────────────────────────────────────────┐
│ Select Vice President for Approval          [X]           │
│ TO-2025-091 - Campus visit...                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Choose which VP should approve this request:              │
│                                                           │
│ ○ VP for Academics                                       │
│   [Photo] Dr. Academic VP                                │
│   Vice President for Academics                           │
│                                                           │
│ ○ VP for Administration                                  │
│   [Photo] Dr. Admin VP                                   │
│   Vice President for Administration                      │
│                                                           │
│ ○ VP for Finance                                         │
│   [Photo] Dr. Finance VP                                 │
│   Vice President for Finance                             │
│                                                           │
│ Note: If this is a Head/Dean request, it will            │
│ automatically proceed to President after VP approval.     │
│                                                           │
│ [Cancel] [Send to Selected VP]                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 COMPTROLLER BUDGET TRACKING

### Budget Management Page

**Route:** `/comptroller/budget` or `/comptroller/departments/budget`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Department Budget Management                             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ [Search Departments...] [Filter: All/Semester]           │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ College of Nursing and Allied Health Sciences        │ │
│ │                                                       │ │
│ │ Total Allocated:  ₱500,000                            │ │
│ │ Total Used:       ₱125,000  [████░░░░░░] 25%         │ │
│ │ Total Pending:    ₱50,000   [██░░░░░░░░] 10%         │ │
│ │ Remaining:        ₱325,000  [██████░░░░] 65%         │ │
│ │                                                       │ │
│ │ Semester: 1st Semester 2025-2026                      │ │
│ │                                                       │ │
│ │ [Edit Budget] [View History]                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ College of Computer and Management Sciences          │ │
│ │ ...                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ [+ Add Department Budget]                                │
└─────────────────────────────────────────────────────────┘
```

### Edit Budget Modal

```
┌─────────────────────────────────────────────────────────┐
│ Edit Department Budget                      [X]          │
│ CNAHS - 1st Semester 2025-2026                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Total Allocated Budget:                                   │
│ ₱ [500,000]                                              │
│                                                           │
│ Semester:                                                │
│ [Dropdown: 1st Semester 2025-2026]                       │
│                                                           │
│ Fiscal Year:                                             │
│ [2025-2026]                                              │ │
│                                                           │
│ Notes:                                                   │
│ [Textarea]                                               │
│                                                           │
│ Current Status:                                          │
│ • Used: ₱125,000 (cannot be modified)                  │
│ • Pending: ₱50,000 (cannot be modified)                 │
│ • Remaining: ₱325,000                                    │
│                                                           │
│ [Cancel] [Save Changes]                                  │
└─────────────────────────────────────────────────────────┘
```

### User Budget Visibility

**On Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│ Department Budget                                        │
│                                                           │
│ Remaining Budget for 1st Semester 2025-2026:            │
│                                                           │
│ ₱325,000                                                 │
│                                                           │
│ [Progress Bar: 65% remaining]                            │
│                                                           │
│ Used: ₱125,000 | Pending: ₱50,000                      │
│                                                           │
│ [View Details]                                           │
└─────────────────────────────────────────────────────────┘
```

**On Request Form:**
- Show remaining budget before submission
- Warning if budget exceeds remaining
- Display: "Available Budget: ₱325,000"

---

## 🗄️ DATABASE CHANGES

### New Tables

**1. `approval_routing`**
```sql
CREATE TABLE approval_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id),
  from_role TEXT NOT NULL,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_role TEXT NOT NULL,
  to_user_id UUID REFERENCES users(id), -- NULL if role-based routing
  routing_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**2. `department_budgets` (if not exists)**
```sql
-- Already exists, but ensure these columns:
-- total_allocated, total_used, total_pending, remaining
-- Add semester and fiscal_year if not present
```

### Modified Tables

**1. `requests` table**
- Add `routing_history` JSONB column (optional, for tracking)
- Ensure all signature columns exist
- Ensure all timestamp columns exist

**2. `request_history` table**
- Add `routing_decision` JSONB column
- Add `selected_approver_id` UUID column

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Request Details Enhancement
- [ ] Update `RequestDetailsView` component with new layout
- [ ] Implement hoverable profile cards for all names
- [ ] Enhance signature chain display (show all previous signatures)
- [ ] Update date formatting throughout
- [ ] Add print styles
- [ ] Test with various request states

### Phase 2: Approval Workflow with Choices
- [ ] Create `ApproverSelectionModal` component
- [ ] Update approval APIs to accept `next_approver_id`
- [ ] Add routing decision tracking
- [ ] Update Head approval modal
- [ ] Update Admin approval modal (mandatory notes)
- [ ] Update HR approval modal (VP selection)
- [ ] Update VP approval modal (President routing for heads)
- [ ] Test routing scenarios

### Phase 3: Mandatory Notes
- [ ] Add validation for admin notes (required)
- [ ] Add validation for other roles (recommended)
- [ ] Display notes in timeline
- [ ] Display notes in signature sections

### Phase 4: Comptroller Budget Tracking
- [ ] Create budget management page
- [ ] Create budget CRUD APIs
- [ ] Add budget calculation logic
- [ ] Create user budget visibility component
- [ ] Add budget warnings on request form

### Phase 5: Complete Faculty/Staff View
- [ ] Verify Settings page functionality
- [ ] Verify Profile page functionality
- [ ] Verify Notifications functionality
- [ ] Verify Drivers & Vehicles page
- [ ] Verify History page
- [ ] Polish all pages

---

## 🎨 DESIGN PRINCIPLES

1. **Minimal & Professional:** Clean, not colorful, easy on the eyes
2. **Consistent:** Same components across all roles
3. **Accessible:** Keyboard navigation, screen reader support
4. **Responsive:** Works on desktop, tablet, mobile
5. **Print-Ready:** Clean print layout
6. **Fast:** Optimized loading, smooth animations

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ Request details page displays all information beautifully
2. ✅ All names have hoverable profile cards
3. ✅ Signature chain shows previous signatures + next signer
4. ✅ Dates formatted as "November 13, 2025"
5. ✅ Approval workflow allows approver selection
6. ✅ Admin notes are mandatory
7. ✅ Comptroller can manage department budgets
8. ✅ Users see remaining budget for their department
9. ✅ All Faculty/Staff pages are functional
10. ✅ No errors, everything works smoothly

---

**End of Master Prompt**

