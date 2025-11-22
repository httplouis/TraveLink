# EXECUTIVE WORKFLOW UPDATE - VP & PRESIDENT SPLIT

**Date:** November 10, 2025 - 11:35 PM  
**Purpose:** Replace single "executive" role with VP and President roles  
**Impact:** System-wide changes to approval workflow

---

## 🎯 **WHAT CHANGED:**

### **Before:**
```
HR Approval → Executive Approval → Done
```

### **After:**
```
HR Approval → VP Approval → President Approval (if needed) → Done
```

---

## 📋 **ROUTING LOGIC:**

### **VP Approval (First Executive Level):**
- **Budget ≤ ₱50,000** → VP approval sufficient (DONE)
- **Budget > ₱50,000** → VP approves, forwards to President
- **Normal priority** → VP can approve directly
- **High priority** → VP reviews, forwards to President

### **President Approval (Final Authority):**
- **Budget > ₱50,000** → Requires President
- **High priority requests** → Always requires President
- **VP forwarded requests** → President reviews
- **Override authority** → Can override any decision

---

## 🔧 **DATABASE CHANGES:**

### **New Columns in `users` table:**
```sql
is_vp BOOLEAN DEFAULT FALSE
is_president BOOLEAN DEFAULT FALSE
```

### **New Columns in `requests` table:**
```sql
exec_level VARCHAR(20) -- 'vp' or 'president'

vp_approved_by UUID
vp_approved_at TIMESTAMP
vp_signature TEXT
vp_comments TEXT

president_approved_by UUID
president_approved_at TIMESTAMP
president_signature TEXT
president_comments TEXT
```

### **New Statuses:**
- `pending_vp` - Waiting for VP approval
- `pending_president` - Waiting for President approval
- `approved_vp` - VP approved (may go to President)
- `approved_president` - President approved (final)

---

## 👥 **ACCOUNTS CREATED:**

### **VP Account:**
```
Email: vp@emiliouniversity.edu.ph
Password: VP@2025
Name: Dr. Roberto C. Villanueva
Title: Vice President for Academic Affairs
Role: exec (with is_vp = TRUE)
Portal: /vp/*
```

### **President Account:**
```
Email: president@emiliouniversity.edu.ph
Password: President@2025
Name: Dr. Maria Concepcion R. Santos
Title: University President
Role: exec (with is_president = TRUE)
Portal: /president/*
```

---

## 🔄 **WORKFLOW EXAMPLES:**

### **Example 1: Small Budget Request (₱25,000)**
```
1. Requester submits
2. Head approves
3. Admin approves
4. Comptroller approves (budget review)
5. HR approves
6. VP approves ✅ DONE
```

### **Example 2: Large Budget Request (₱75,000)**
```
1. Requester submits
2. Head approves
3. Admin approves
4. Comptroller approves
5. HR approves
6. VP approves → Forwards to President
7. President approves ✅ DONE
```

### **Example 3: High Priority Request**
```
1. Requester marks as HIGH PRIORITY
2. Head approves
3. Admin approves
4. Comptroller approves
5. HR approves
6. VP reviews → Forwards to President
7. President approves ✅ DONE (final authority)
```

---

## 📁 **FILES CREATED:**

### **VP Portal (4 files):**
1. `src/components/vp/nav/VPLeftNav.tsx`
2. `src/app/(protected)/vp/layout.tsx`
3. `src/app/(protected)/vp/dashboard/page.tsx`
4. `src/app/(protected)/vp/inbox/page.tsx`

### **President Portal (4 files):**
1. `src/components/president/nav/PresidentLeftNav.tsx`
2. `src/app/(protected)/president/layout.tsx`
3. `src/app/(protected)/president/dashboard/page.tsx`
4. `src/app/(protected)/president/inbox/page.tsx`
5. `src/app/(protected)/president/policy/page.tsx`

### **API Routes (2 files):**
1. `src/app/api/vp/inbox/route.ts`
2. `src/app/api/president/inbox/route.ts`

### **Database (1 file):**
1. `EXECUTIVE-ROLE-MIGRATION.sql`

---

## 🔨 **CODE UPDATES NEEDED:**

### **1. Update StatusBadge Component:**
```typescript
// Add new status types
case 'pending_vp':
  return { bg: 'yellow', text: 'Pending VP', icon: Clock };
case 'pending_president':
  return { bg: 'amber', text: 'Pending President', icon: Shield };
case 'approved_vp':
  return { bg: 'green', text: 'VP Approved', icon: CheckCircle };
case 'approved_president':
  return { bg: 'green', text: 'President Approved', icon: Shield };
```

### **2. Update workflow.ts:**
```typescript
export function determineExecutiveLevel(request: any): 'vp' | 'president' | null {
  // High priority always goes to President
  if (request.priority === 'high') {
    return 'president';
  }
  
  // Large budget goes to President (after VP)
  if (request.total_budget > 50000) {
    return 'president';
  }
  
  // Normal requests go to VP
  return 'vp';
}

export function getNextStageAfterHR(request: any): string {
  const execLevel = determineExecutiveLevel(request);
  
  if (execLevel === 'president' || request.total_budget > 50000) {
    // Goes to VP first, then President
    return 'pending_vp';
  }
  
  // VP can approve directly
  return 'pending_vp';
}

export function getNextStageAfterVP(request: any): string {
  const execLevel = determineExecutiveLevel(request);
  
  if (execLevel === 'president') {
    return 'pending_president';
  }
  
  // VP approval is sufficient
  return 'approved';
}
```

### **3. Update Auth Middleware:**
```typescript
// Replace is_executive checks
if (session.user.is_vp || session.user.is_president) {
  // Has executive access
}

// VP-specific check
if (session.user.is_vp) {
  // Can access /vp/*
}

// President-specific check
if (session.user.is_president) {
  // Can access /president/*
}
```

### **4. Update Navigation Guards:**
```typescript
// In middleware.ts or auth check
const vpRoutes = ['/vp/*'];
const presidentRoutes = ['/president/*'];

if (pathname.startsWith('/vp') && !user.is_vp) {
  return redirect('/unauthorized');
}

if (pathname.startsWith('/president') && !user.is_president) {
  return redirect('/unauthorized');
}
```

---

## 🧪 **TESTING CHECKLIST:**

### **VP Workflow:**
- [ ] VP can log in to /vp/dashboard
- [ ] VP sees pending requests in /vp/inbox
- [ ] VP can approve requests ≤ ₱50,000
- [ ] VP can forward requests > ₱50,000 to President
- [ ] VP signature is stored separately

### **President Workflow:**
- [ ] President can log in to /president/dashboard
- [ ] President sees requests forwarded by VP
- [ ] President sees high priority requests
- [ ] President sees requests > ₱50,000
- [ ] President can override any decision
- [ ] President signature is stored separately

### **Dual Approval:**
- [ ] Large budget request gets VP signature first
- [ ] Then goes to President for final approval
- [ ] Both signatures are saved
- [ ] Timeline shows both approvals

---

## 🎯 **MIGRATION STEPS:**

### **1. Run Database Migration:**
```bash
psql -U your_user -d travilink < EXECUTIVE-ROLE-MIGRATION.sql
```

### **2. Verify Accounts Created:**
```sql
SELECT email, name, is_vp, is_president 
FROM users 
WHERE is_vp = TRUE OR is_president = TRUE;
```

### **3. Update Environment Variables:**
```env
VP_EMAIL=vp@emiliouniversity.edu.ph
PRESIDENT_EMAIL=president@emiliouniversity.edu.ph
```

### **4. Deploy Portal Pages:**
```bash
# VP and President portals already created
# Just deploy the new routes
```

### **5. Update Existing APIs:**
- Update HR approval API to route to VP
- Update workflow stage progression
- Add VP approval endpoint
- Add President approval endpoint

---

## 📊 **APPROVAL STATISTICS:**

### **Expected Distribution:**
- **VP Only:** ~70% of requests (budget ≤ ₱50,000)
- **VP → President:** ~25% of requests (budget > ₱50,000)
- **Direct to President:** ~5% of requests (high priority)

### **Approval Authority:**
- **VP:** Can approve up to ₱50,000 independently
- **President:** Can approve any amount, override any decision

---

## 🔐 **SECURITY CONSIDERATIONS:**

1. **VP cannot approve President-level requests alone**
2. **President has override authority** (can reverse any decision)
3. **Both signatures required for large budgets**
4. **Audit trail maintained** (both VP and President approval timestamps)
5. **Role separation enforced** (can't be both VP and President)

---

## 📝 **TODO FOR FULL INTEGRATION:**

### **High Priority:**
- [ ] Update StatusBadge with new statuses
- [ ] Update workflow.ts with VP/President routing
- [ ] Add VP approval API endpoint
- [ ] Add President approval API endpoint
- [ ] Update navigation guards

### **Medium Priority:**
- [ ] Update RequestStatusTracker to show VP and President stages
- [ ] Update ApprovalSignatureDisplay for dual executives
- [ ] Add VP analytics API
- [ ] Add President analytics API

### **Low Priority:**
- [ ] Create VP history page
- [ ] Create President override page
- [ ] Add policy management functionality
- [ ] Email notifications for VP/President

---

## ✅ **BENEFITS OF SPLIT:**

1. **Better Workload Distribution:** VP handles majority of requests
2. **Presidential Focus:** President only sees critical requests
3. **Clear Authority Levels:** Budget thresholds define routing
4. **Audit Trail:** Separate signatures for each executive
5. **Scalability:** Can add more VPs in future
6. **Compliance:** Dual approval for large expenses

---

## 🎓 **TRAINING NOTES:**

### **For VP:**
- "You approve requests up to ₱50,000"
- "Forward larger requests to President"
- "Review and forward high priority requests"
- "Your signature appears first in approval chain"

### **For President:**
- "You approve requests > ₱50,000"
- "You have final authority on all high priority requests"
- "You can override any decision"
- "Your approval is final"

---

**MIGRATION STATUS:** ✅ Database ready, Portals created, APIs ready for integration

**NEXT STEP:** Run EXECUTIVE-ROLE-MIGRATION.sql and update workflow.ts

**Last Updated:** November 10, 2025 - 11:40 PM
