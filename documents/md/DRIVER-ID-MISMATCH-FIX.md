# Driver Preference Not Saving - ID Mismatch Bug Fix

## 🔴 Critical Bug Found!

**Symptom**: User selects a driver when submitting request, but driver preference is NOT saved (shows as NULL in database)

**Request**: TO-2025-066 (submitted Nov 7, 2025, 8:23 PM)
- Vehicle saved: ✅ School Bus 01 • BUS-0001
- Driver saved: ❌ NULL (not saved!)

---

## 🔍 Root Cause Analysis

### The ID Mismatch Chain:

1. **Client fetches drivers** from `/api/drivers`
   ```typescript
   // Returns: { id: user.id, name: "Driver Name", ... }
   id: user?.id || driver.user_id,  // Returns users.id
   ```

2. **Client sends USER ID** as `preferredDriverId`
   ```typescript
   value: driver.id,  // This is users.id, not drivers.id
   ```

3. **Submit API validates INCORRECTLY**
   ```typescript
   // ❌ WRONG: Looking for users.id in drivers.id column
   .from("drivers")
   .eq("id", preferredDriverId)
   ```

4. **Validation fails** → `preferredDriverId` set to NULL → Driver not saved!

---

## ✅ The Fix

Changed validation to check `user_id` column instead of `id` column:

```typescript
// ✅ CORRECT: Looking for users.id in drivers.user_id column
.from("drivers")
.eq("user_id", preferredDriverId)
```

### File Changed:
`/api/requests/submit/route.ts` - Lines 194-210

---

## 📊 Database Schema

**requests table:**
- `preferred_driver_id` → FK to `users.id` (not `drivers.id`)
- `preferred_vehicle_id` → FK to `vehicles.id`

**drivers table:**
- `id` → Primary key (UUID)
- `user_id` → FK to `users.id`

**Correct Flow:**
1. Client sends: `user.id` (e.g., "abc-123")
2. Validation checks: `drivers.user_id = 'abc-123'` ✅
3. Saves to DB: `requests.preferred_driver_id = 'abc-123'` ✅
4. API joins: `users!preferred_driver_id` ✅

---

## 🧪 Testing

### Verify Fix:

1. **Run schema check** (optional):
   ```sql
   -- Execute CHECK-SCHEMA-FK.sql
   -- Confirms preferred_driver_id references users.id
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Submit new request**:
   - Go to user request form
   - Select a driver from dropdown
   - Select a vehicle
   - Submit
   - Check logs for: `✅ Driver with user_id XXX validated`

4. **Verify in database**:
   ```sql
   SELECT 
     request_number,
     preferred_driver_id,
     preferred_vehicle_id,
     (SELECT name FROM users WHERE id = preferred_driver_id) as driver_name
   FROM requests
   WHERE request_number = 'TO-2025-XXX';
   ```

5. **Check UI**:
   - Open request in user submission history
   - Should show both driver AND vehicle! ✅
   - Check browser console for logs

---

## 📝 What Was Broken vs Fixed

### Before Fix:
- ❌ Driver validation failed (looking in wrong column)
- ❌ `preferred_driver_id` set to NULL
- ❌ Only vehicle saved
- ❌ User confused why driver not showing

### After Fix:
- ✅ Driver validation succeeds (correct column)
- ✅ `preferred_driver_id` saved with user.id
- ✅ Both driver and vehicle saved
- ✅ Both display in UI

---

## 🎯 Impact

**Old Requests** (Before fix):
- TO-2025-066 and earlier: Driver = NULL (cannot retroactively fix)
- These will show "No driver preference" message ✅

**New Requests** (After fix):
- All new submissions will properly save driver preferences ✅

---

## 🔧 Additional Improvements Made

1. **Enhanced Logging** ✅
   - Submit API logs validation results
   - Client-side logs what it receives
   - Easier debugging

2. **Better Error Messages** ✅
   - Shows which user_id failed validation
   - Shows driver.id for reference

3. **SQL Debug Scripts** ✅
   - `CHECK-TO-2025-066.sql` - Check specific request
   - `CHECK-SCHEMA-FK.sql` - Verify FK constraints

---

**RESTART SERVER → SUBMIT NEW REQUEST → DRIVER SHOULD SAVE! 🚀**
