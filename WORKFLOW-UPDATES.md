# TraviLink Workflow - Important Updates

## 🔄 **Key Clarifications Implemented**

### **1. Vehicle Request Limit (5 per day)** ✅

**Rule**: The 5-request-per-day limit **ONLY applies to requests that need vehicles**.

**Why**: Limited vehicle availability. If no vehicle needed, unlimited requests allowed.

**Implementation**:
```typescript
// Only check limit if vehicle needed
if (params.needsVehicle && params.dailyVehicleRequestCount >= 5) {
  errors.push('Daily vehicle request limit reached');
}

// If needsVehicle = false, no limit check!
```

**Database**:
- Table: `daily_vehicle_request_limits`
- Column: `vehicle_request_count` (only counts `needs_vehicle = true`)
- ✅ No vehicle needed = unlimited requests
- ✅ Vehicle needed = max 5 per day

---

### **2. Two Admin Accounts** ✅

**Admins**:
1. **Ma'am TM** - `admin@mseuf.edu.ph`
2. **Ma'am Cleofe** - `admin.cleofe@mseuf.edu.ph`

**Password for both**: `Admin@123`

**Implementation**:
```typescript
const adminEmails = [
  "admin@mseuf.edu.ph",      // Ma'am TM
  "admin.cleofe@mseuf.edu.ph" // Ma'am Cleofe
];

const isAdmin = adminEmails.includes(userEmail);
```

**Updated Files**:
- ✅ `FINAL-INSERT-USERS.sql` - Both admins inserted
- ✅ `src/middleware.ts` - Both emails checked
- ✅ `src/app/api/auth/login/route.ts` - Both emails checked
- ✅ `src/app/api/me/route.ts` - Both emails checked

---

### **3. Departments Include Offices** ✅

**"Departments" includes**:
- ✅ Academic departments (Nursing, Engineering, Business, etc.)
- ✅ Administrative offices (Finance, Treasury, HR, etc.)
- ✅ Executive offices (President's office, etc.)

**All have "heads"**:
- Academic department heads (CON Head, COE Head, etc.)
- Office heads (HR Head, Finance Head, Treasury Head, etc.)
- Executives (University President = Executive Head)

**Example**:
```sql
-- Sample departments/offices
INSERT INTO departments (name, code) VALUES
  ('College of Nursing', 'CON'),           -- Academic dept
  ('Finance Office', 'FIN'),               -- Administrative office
  ('Treasury Office', 'TRES'),             -- Administrative office
  ('HR Department', 'HR'),                 -- Administrative office
  ('Office of the President', 'EXEC');     -- Executive office
```

---

### **4. Role Structure Clarification** ✅

**Hierarchy**:

```
┌─────────────────────────────────────┐
│ ADMIN (Ma'am TM + Ma'am Cleofe)    │ ← Manage everything
├─────────────────────────────────────┤
│ EXECUTIVE (President)               │ ← Final approver
├─────────────────────────────────────┤
│ HR (HR Head)                        │ ← HR approval
├─────────────────────────────────────┤
│ COMPTROLLER (Finance Officer)       │ ← Budget verification
├─────────────────────────────────────┤
│ DEPARTMENT/OFFICE HEADS             │ ← Approve department requests
│  - Academic (CON, COE, etc.)        │
│  - Administrative (Finance, etc.)   │
├─────────────────────────────────────┤
│ FACULTY/STAFF                       │ ← Regular requesters
├─────────────────────────────────────┤
│ DRIVERS                             │ ← Execute trips
└─────────────────────────────────────┘
```

**Key Points**:
- ✅ All heads (academic + office) use `is_head = true`
- ✅ HR head has `is_head = true AND is_hr = true`
- ✅ Executive has `is_head = true AND is_exec = true`
- ✅ Comptroller is part of admin (admin role)

---

## 📊 **Test Accounts**

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin (TM) | admin@mseuf.edu.ph | Admin@123 | Vehicle assignment |
| Admin (Cleofe) | admin.cleofe@mseuf.edu.ph | Admin@123 | Vehicle assignment |
| Executive | exec.president@mseuf.edu.ph | Exec@123 | Final approver |
| HR Head | hr.admin@mseuf.edu.ph | HR@123 | HR approval |
| Comptroller | comptroller@mseuf.edu.ph | Comp@123 | Budget verification |
| Dept Head | head.nursing@mseuf.edu.ph | Head@123 | Department approval |
| Faculty | faculty@mseuf.edu.ph | Faculty@123 | Regular requester |

---

## 🔄 **Updated Workflows**

### **With Vehicle + Budget**:
```
Faculty → Head → Admin (TM/Cleofe) → Comptroller → HR → Executive ✅
                   ↓ Assign vehicle
                   ↓ Check 5/day limit
```

### **With Vehicle + No Budget**:
```
Faculty → Head → Admin (TM/Cleofe) → HR → Executive ✅
                   ↓ Assign vehicle
                   ↓ Check 5/day limit
```

### **No Vehicle + Budget**:
```
Faculty → Head → Admin (TM/Cleofe) → Comptroller → HR → Executive ✅
                   ↓ No vehicle limit!
                   ↓ Unlimited requests
```

### **No Vehicle + No Budget**:
```
Faculty → Head → Admin (TM/Cleofe) → HR → Executive ✅
                   ↓ No vehicle limit!
                   ↓ Unlimited requests
```

---

## 🎯 **Business Rules Summary**

1. ✅ **5 vehicle requests per day** - Only if `needs_vehicle = true`
2. ✅ **Unlimited requests** - If `needs_vehicle = false`
3. ✅ **Faculty must include head** - Head must travel with faculty
4. ✅ **Skip comptroller** - If `has_budget = false`
5. ✅ **Head requests skip head approval** - Direct to admin
6. ✅ **Two admins** - Ma'am TM and Ma'am Cleofe
7. ✅ **Budget checking** - Can't exceed department budget
8. ✅ **Departments = Academic + Offices** - All have heads

---

## 📁 **Files Updated**

1. ✅ `DATABASE-WORKFLOW-SCHEMA.sql`
   - Renamed table to `daily_vehicle_request_limits`
   - Updated comments to clarify vehicle-only limit

2. ✅ `FINAL-INSERT-USERS.sql`
   - Added Ma'am Cleofe as second admin
   - Updated verification query to include both

3. ✅ `src/middleware.ts`
   - Both admin emails checked in `resolveHomeBase()`
   - Both admin emails checked in `isAllowed()`

4. ✅ `src/app/api/auth/login/route.ts`
   - Both admin emails checked for redirect

5. ✅ `src/app/api/me/route.ts`
   - Both admin emails checked for role detection

6. ✅ `src/lib/workflow/engine.ts`
   - Updated `validateNewRequest()` to check vehicle-only limit
   - Added `needsVehicle` parameter
   - Renamed `dailyRequestCount` to `dailyVehicleRequestCount`

7. ✅ `src/lib/workflow/types.ts`
   - Renamed `DailyLimit` to `DailyVehicleLimit`
   - Updated field names and comments

---

## 🚀 **Next Steps**

All foundation updates complete! Ready to implement:

1. **Request Creation Form** - With vehicle checkbox
2. **Admin Vehicle Assignment** - For both Ma'am TM and Cleofe
3. **Daily Vehicle Limit Check** - Show available slots
4. **Department/Office Management** - Academic + Administrative

**Everything is ready for implementation! 🎯**
