# Existing System vs New Workflow System

## 📋 **What's Already in Your System**

### **1. ✅ Request Form (User/Faculty)** - MERON NA!
**Location**: `/user/request`

**Features Present**:
- ✅ Request wizard with step-by-step form
- ✅ Vehicle mode selection (owned/institutional/rent)
- ✅ Travel Order form
- ✅ Seminar application form
- ✅ School Service section
- ✅ Cost breakdown input
- ✅ Draft saving and loading
- ✅ Auto-save functionality
- ✅ Quick-fill dev tools

**Status**: **WORKING** pero may issues:

**PROBLEMA**:
```
message: 'new row violates row-level security policy for table "requests"'
```

**Root cause**: 
- API (`/api/requests/submit`) trying to insert to **`requests`** table
- Table exists in `DATABASE-WORKFLOW-SCHEMA.sql` (yung bago nating gawa)
- **WALANG RLS POLICIES YET** kaya bawal mag-insert
- Old table: `travel_requests` (may RLS na)
- New table: `requests` (walang RLS pa)

---

### **2. ✅ Admin Dashboard** - MERON NA!
**Location**: `/admin/requests`

**Features Present**:
- ✅ List all requests (pending/approved/rejected)
- ✅ Search and filter requests
- ✅ View request details modal
- ✅ Bulk operations (select multiple)
- ✅ Pagination
- ✅ Status filtering
- ✅ Date range filtering
- ✅ Department filtering
- ✅ Driver and vehicle display

**Status**: **WORKING** pero outdated

**PROBLEMA**:
- Using old `travel_requests` table structure
- Hindi aligned sa new workflow (pending_head, pending_admin, etc.)
- Walang vehicle assignment UI
- Walang daily vehicle limit checker

---

### **3. ❌ Vehicle Limit Checker** - WALA PA!
**Location**: Not implemented

**What's Missing**:
- ❌ Daily vehicle availability display ("3/5 vehicles available")
- ❌ Calendar view for vehicle bookings
- ❌ Real-time limit checking
- ❌ Warning when slots almost full
- ❌ Alternative date suggestions

---

## 🗃️ **Database Situation**

### **Two Table Structures Exist:**

#### **Old System** (database-app-tables.sql):
```sql
CREATE TABLE public.travel_requests (
  id UUID,
  user_id UUID,
  request_number VARCHAR(50),
  current_status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  payload JSONB,
  assigned_head_id UUID,
  assigned_head_email VARCHAR,
  driver VARCHAR,
  vehicle VARCHAR,
  ...
);
```
- ✅ Has RLS policies
- ✅ Works with current API
- ❌ Hindi aligned sa new workflow

#### **New System** (DATABASE-WORKFLOW-SCHEMA.sql):
```sql
CREATE TABLE public.requests (
  id UUID,
  request_type request_type, -- 'travel_order', 'seminar'
  request_number VARCHAR(50),
  status request_status, -- 'pending_head', 'pending_admin', etc.
  requester_id UUID,
  requester_is_head BOOLEAN,
  has_budget BOOLEAN,
  needs_vehicle BOOLEAN,
  head_approved_at TIMESTAMP,
  admin_processed_at TIMESTAMP,
  comptroller_approved_at TIMESTAMP,
  hr_approved_at TIMESTAMP,
  exec_approved_at TIMESTAMP,
  ...
);
```
- ❌ **WALANG RLS POLICIES PA** ← YAN ANG PROBLEMA
- ✅ Complete workflow tracking
- ✅ All approval stages
- ✅ Budget tracking
- ✅ Vehicle limit logic

---

## 🔧 **What Needs to be Fixed**

### **Priority 1: Fix RLS Policies** 🚨
**Para gumana yung request submission**

Need to create:
```sql
-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create requests"
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Allow users to view their own requests
CREATE POLICY "Users can view own requests"
ON public.requests FOR SELECT
TO authenticated
USING (auth.uid() = requester_id);

-- Allow admins to view all requests
CREATE POLICY "Admins can view all requests"
ON public.requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND email IN ('admin@mseuf.edu.ph', 'admin.cleofe@mseuf.edu.ph')
  )
);

-- etc...
```

---

### **Priority 2: Migrate or Align Tables**
**Choose one approach:**

**Option A: Migrate to New Table**
- Add RLS policies to `requests` table
- Update API to use new table
- Migrate old data from `travel_requests` to `requests`
- Update admin dashboard to use new table

**Option B: Update Old Table**
- Add new columns to `travel_requests` (requester_is_head, has_budget, etc.)
- Add new status values (pending_head, pending_admin, etc.)
- Keep using existing RLS policies

**Recommendation**: Option A (cleaner, future-proof)

---

### **Priority 3: Update API Routes**
Currently using:
- `/api/requests/submit` ← trying to use new `requests` table
- Needs RLS policies

Should also create:
- `/api/requests/create` - Create with workflow engine
- `/api/requests/[id]/approve` - Approve at current stage
- `/api/requests/[id]/reject` - Reject request
- `/api/requests/daily-vehicle-limit` - Check vehicle availability

---

### **Priority 4: Update Admin Dashboard**
Add features:
- ✅ Vehicle assignment UI
- ✅ Daily vehicle limit display
- ✅ New workflow status display
- ✅ Stage-by-stage approval tracking

---

### **Priority 5: Add Vehicle Limit Checker**
Build UI showing:
- Available vehicle slots per day
- Calendar view
- Real-time updates
- Booking preview

---

## 🎯 **Recommended Fix Order**

1. **Add RLS Policies** (15 minutes) ← CRITICAL!
2. **Update API to use workflow engine** (30 minutes)
3. **Test request submission** (10 minutes)
4. **Update admin dashboard** (1 hour)
5. **Add vehicle limit UI** (45 minutes)

---

## 📝 **Summary**

**Meron na:**
- ✅ Request form (with vehicle checkbox)
- ✅ Admin dashboard (basic)
- ✅ Database schema (both old and new)
- ✅ Workflow engine logic

**Kulang pa:**
- ❌ RLS policies for new `requests` table ← **FIX THIS FIRST!**
- ❌ Vehicle limit checker UI
- ❌ Updated admin dashboard for new workflow
- ❌ Migration plan for old data

**Next Step**: Add RLS policies para gumana na yung request submission! 🚀
