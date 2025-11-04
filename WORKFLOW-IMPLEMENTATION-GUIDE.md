# TraviLink Workflow Implementation Guide

## ✅ What's Been Created

### 1. **Database Schema** (`DATABASE-WORKFLOW-SCHEMA.sql`)

Complete PostgreSQL schema with:
- ✅ `requests` table with all approval stages
- ✅ `request_history` for audit trail
- ✅ `department_budgets` for budget tracking
- ✅ `daily_request_limits` for 5-per-day rule
- ✅ Auto-generated request numbers (TO-2024-001, SEM-2024-001)
- ✅ Triggers for timestamps and numbering
- ✅ Helper functions for workflow logic

### 2. **TypeScript Types** (`src/lib/workflow/types.ts`)

Type-safe definitions for:
- ✅ Request, RequestStatus, RequestType
- ✅ Participant, ExpenseItem
- ✅ DepartmentBudget, RequestHistory
- ✅ All approval stages

### 3. **Workflow Engine** (`src/lib/workflow/engine.ts`)

Business logic implementation:
- ✅ Dynamic workflow routing based on requester role
- ✅ Budget-based routing (with/without comptroller)
- ✅ Validation rules (daily limits, budget checks, head inclusion)
- ✅ Progress tracking
- ✅ Permission checking
- ✅ Workflow visualization

---

## 📋 Workflow Rules Implemented

### **Travel Order / Seminar Flows**

#### Faculty Request (with budget):
```
Faculty → Head → Admin (TM) → Comptroller → HR → Executive → ✅
```

#### Faculty Request (no budget):
```
Faculty → Head → Admin (TM) → HR → Executive → ✅
```

#### Head Request (with budget):
```
Head → Admin (TM) → Comptroller → HR → Executive → ✅
```

#### Head Request (no budget):
```
Head → Admin (TM) → HR → Executive → ✅
```

### **Business Rules**

✅ **Faculty must include head** - Head must be in participants list  
✅ **5 requests per day limit** - Validated in `validateNewRequest()`  
✅ **Budget checking** - Can't request if department budget exhausted  
✅ **Auto-routing** - Skips comptroller if no budget  
✅ **Role-based access** - Only authorized approvers can act  
✅ **Audit trail** - Every action logged in `request_history`

---

## 🔄 Next Steps

### **Phase 1: Database Setup** ⏳
```bash
# Run the schema creation
psql -h your-db-host -U postgres -d travilink < DATABASE-WORKFLOW-SCHEMA.sql
```

### **Phase 2: API Routes** (Need to create)
```
/api/requests/create      - Create new request
/api/requests/list        - List requests (filtered by role)
/api/requests/[id]        - Get request details
/api/requests/[id]/approve - Approve at current stage
/api/requests/[id]/reject  - Reject request
/api/requests/daily-limit  - Check daily limit
/api/budgets/department   - Get department budget
```

### **Phase 3: UI Components** (Need to create)
```
components/requests/
  ├── RequestForm.tsx           - Create new request
  ├── RequestList.tsx           - List all requests
  ├── RequestDetail.tsx         - View request details
  ├── ApprovalCard.tsx          - Approve/reject interface
  ├── WorkflowTimeline.tsx      - Visual workflow progress
  └── BudgetDisplay.tsx         - Show budget breakdown
```

### **Phase 4: Role-Specific Pages** (Need to create)
```
app/(protected)/
  ├── user/request/new          - Faculty create request
  ├── head/inbox                - Head approvals
  ├── admin/requests            - Admin (TM) processing
  ├── hr/endorsements           - HR approvals
  └── exec/inbox                - Executive approvals
```

---

## 🎯 Key Features to Implement

### **Request Creation Flow**
```typescript
// Example usage
const newRequest = {
  request_type: 'travel_order',
  title: 'Research Conference',
  purpose: 'Present research paper',
  destination: 'Manila',
  travel_start_date: '2024-12-01',
  travel_end_date: '2024-12-03',
  has_budget: true,
  total_budget: 15000,
  expense_breakdown: [
    { item: 'Transportation', amount: 5000 },
    { item: 'Accommodation', amount: 8000 },
    { item: 'Meals', amount: 2000 }
  ],
  needs_vehicle: true,
  participants: [userId, headId]
};

// Workflow automatically determines:
// - Initial status: pending_head (faculty) or pending_admin (head)
// - Next approver: head or admin
// - Whether to include comptroller based on budget
```

### **Approval Interface**
```typescript
// For each approver role
const approveRequest = async (requestId, comments, signature) => {
  // 1. Check if user has permission
  // 2. Record approval with timestamp
  // 3. Move to next status using WorkflowEngine
  // 4. Log in request_history
  // 5. Notify next approver
};
```

### **Dashboard Views**

**Faculty/User:**
- My Requests (all statuses)
- Create New Request
- Request History

**Head:**
- Pending My Approval
- My Department Requests
- Budget Overview

**Admin (Ma'am TM):**
- Pending Vehicle Assignment
- All Active Requests
- Driver Scheduling

**Comptroller:**
- Pending Budget Review
- Budget Adjustments
- Department Budget Status

**HR:**
- Pending HR Approval
- Approved Requests
- Employee Travel Records

**Executive:**
- Pending Final Approval
- Approved Requests
- Executive Dashboard

---

## 📊 Example Queries

### Get requests pending for a specific role
```sql
SELECT * FROM requests 
WHERE status = 'pending_head' 
AND department_id = (SELECT department_id FROM users WHERE id = $1);
```

### Get department budget status
```sql
SELECT 
  total_allocated,
  total_used,
  total_pending,
  remaining
FROM department_budgets
WHERE department_id = $1 AND fiscal_year = EXTRACT(YEAR FROM NOW());
```

### Check daily request limit
```sql
SELECT request_count 
FROM daily_request_limits 
WHERE request_date = CURRENT_DATE;
```

---

## 🚀 Ready to Implement?

The foundation is complete! Next steps:

1. **Run database schema** - Sets up all tables
2. **Create API routes** - Handle CRUD operations
3. **Build UI components** - Forms and approval interfaces
4. **Test workflows** - Verify all approval chains work

**Let me know which part you want me to implement next!** 🎯
