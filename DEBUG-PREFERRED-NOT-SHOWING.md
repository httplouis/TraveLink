# 🔍 DEBUG: Why Preferred Driver/Vehicle Not Showing

**Issue:** "No driver or vehicle preferences" displayed  
**Status:** 🔧 DEBUGGING

---

## 🎯 POSSIBLE CAUSES:

### 1. **Database Columns Don't Exist Yet**
```
❌ Migration not run yet
Result: API saves data but DB rejects it
```

### 2. **Form Not Sending Data**
```
❌ SchoolServiceSection not saving IDs
Result: API receives null values
```

### 3. **API Not Reading Data**
```
❌ Reading wrong property names
Result: Data sent but not saved
```

---

## ✅ STEP-BY-STEP DEBUG:

### Step 1: **Run Database Migrations**

**CRITICAL:** Run these SQL files in Supabase FIRST!

```sql
-- 1. Add submitter tracking columns
-- File: ADD-SUBMITTER-TRACKING.sql
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID,
ADD COLUMN IF NOT EXISTS submitted_by_name TEXT,
ADD COLUMN IF NOT EXISTS is_representative BOOLEAN;

-- 2. Add preferred driver/vehicle columns
-- File: ADD-PREFERRED-DRIVER-VEHICLE.sql
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS preferred_driver_id UUID,
ADD COLUMN IF NOT EXISTS preferred_vehicle_id UUID,
ADD COLUMN IF NOT EXISTS preferred_driver_note TEXT,
ADD COLUMN IF NOT EXISTS preferred_vehicle_note TEXT;
```

**⚠️ If you haven't run these yet, that's the problem!**

---

### Step 2: **Create NEW Request**

**IMPORTANT:** Test with BRAND NEW request!

1. Login as Faculty
2. Go to Create Request
3. Fill basic info
4. Select "University Vehicle" 
5. **CRITICAL:** In SchoolServiceSection, select:
   - Preferred Driver (from dropdown)
   - Preferred Vehicle (from dropdown)
6. Submit

---

### Step 3: **Check Console Logs**

After submitting, check browser console for these logs:

```javascript
// Should see in terminal:
[/api/requests/submit] Full body: { ... }
[/api/requests/submit] School Service data: { ... }
[/api/requests/submit] Preferred driver ID: "uuid..." or null
[/api/requests/submit] Preferred vehicle ID: "uuid..." or null
```

**If NULL:** Form not sending data
**If UUID:** Data is being sent! Check database.

---

### Step 4: **Check Database**

Run this query in Supabase:

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'requests' 
  AND column_name LIKE '%preferred%';

-- Check latest request data
SELECT 
  id,
  request_number,
  requester_name,
  preferred_driver_id,
  preferred_vehicle_id,
  created_at
FROM requests
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- Columns should exist
- Latest request should have UUIDs (if selected in form)

---

## 📊 DIAGNOSIS FLOWCHART:

```
1. Did you run SQL migrations?
   ├─ NO → Run ADD-SUBMITTER-TRACKING.sql
   │        Run ADD-PREFERRED-DRIVER-VEHICLE.sql
   └─ YES → Go to step 2

2. Check console logs after submit
   ├─ "Preferred driver ID: null" → Form not saving
   │   └─ Check SchoolServiceSection dropdown working?
   └─ "Preferred driver ID: uuid..." → Data sent!
       └─ Go to step 3

3. Check database
   ├─ Columns missing → Run migrations!
   ├─ Columns exist but data NULL → API not saving
   └─ Columns exist and have UUID → Should display!
       └─ Check HeadRequestModal debug logs
```

---

## 🔧 FIXES APPLIED:

### 1. Added Extensive Debug Logs

**File:** `src/app/api/requests/submit/route.ts`

```typescript
console.log("[/api/requests/submit] Full body:", JSON.stringify(body, null, 2));
console.log("[/api/requests/submit] School Service data:", schoolService);
console.log("[/api/requests/submit] Preferred driver ID:", preferredDriverId);
console.log("[/api/requests/submit] Preferred vehicle ID:", preferredVehicleId);
```

Now you'll see exactly what data is being sent!

---

### 2. Always Show Section

**File:** `src/components/head/HeadRequestModal.tsx`

```typescript
// Section ALWAYS visible now
<section>
  {hasData ? <DisplayData /> : <EmptyState />}
</section>
```

So you'll see "No preferences" if data is missing.

---

## 🎯 MOST LIKELY CAUSE:

### **Migrations Not Run Yet!**

If you see this error in Supabase logs:
```
column "preferred_driver_id" does not exist
```

**Solution:**
```sql
-- Run these in Supabase SQL Editor:
1. ADD-SUBMITTER-TRACKING.sql
2. ADD-PREFERRED-DRIVER-VEHICLE.sql
```

---

## 📝 QUICK TEST CHECKLIST:

### Before Creating Request:
- [ ] Run ADD-SUBMITTER-TRACKING.sql in Supabase
- [ ] Run ADD-PREFERRED-DRIVER-VEHICLE.sql in Supabase
- [ ] Verify columns exist (run CHECK query)
- [ ] Restart dev server (to clear cache)

### When Creating Request:
- [ ] Select "University Vehicle" mode
- [ ] See driver dropdown populated
- [ ] Select a driver from dropdown
- [ ] See vehicle dropdown populated  
- [ ] Select a vehicle from dropdown
- [ ] Submit request

### After Submitting:
- [ ] Check console logs (should show UUIDs)
- [ ] Check database (should have UUIDs saved)
- [ ] Open in Head view
- [ ] Should display driver/vehicle names!

---

## 🚨 COMMON MISTAKES:

### 1. Using Old Request
```
❌ Old request (before migration) = NULL
✅ NEW request (after migration) = Has data
```

### 2. Not Selecting in Form
```
❌ Leaving dropdowns empty = NULL
✅ Selecting from dropdown = UUID saved
```

### 3. Forgetting Migrations
```
❌ No migrations = Columns don't exist
✅ Run migrations = Columns ready
```

---

## ✅ SUCCESS CRITERIA:

### You'll know it's working when:

1. **Console logs show:**
   ```
   Preferred driver ID: "abc123-uuid-..."
   Preferred vehicle ID: "def456-uuid-..."
   ```

2. **Database shows:**
   ```sql
   preferred_driver_id: abc123-uuid-...
   preferred_vehicle_id: def456-uuid-...
   ```

3. **UI displays:**
   ```
   SERVICE PREFERENCES
   ⚙️ Preferred Driver
      Ana Garcia
   🚗 Preferred Vehicle
      Bus 1 • MSE-001
   ```

---

## 🎯 NEXT STEPS:

1. **RUN MIGRATIONS** (most important!)
2. **CREATE NEW REQUEST** with selections
3. **CHECK CONSOLE** for debug logs
4. **VERIFY DATABASE** has UUIDs
5. **CHECK HEAD VIEW** should display!

---

**Most likely: Migrations not run yet!** 🎯

**Run the SQL files first, then create NEW request!** 🚀
