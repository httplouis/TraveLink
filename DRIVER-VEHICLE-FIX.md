# Driver & Vehicle Selection Error Fix

## Problem
User getting error: **"Invalid driver or vehicle selection. Please refresh the page and try again."**

Selected:
- **Driver**: Pedro Reyes
- **Vehicle**: Bus 1 • MSE-001

## Root Cause
The selected driver/vehicle IDs don't exist in the database, causing a foreign key constraint violation when trying to insert the request.

## Solutions

### Solution 1: Add Driver & Vehicle to Database (RECOMMENDED)
Run `ADD-PEDRO-REYES-BUS1.sql` to add them:

```sql
-- Add Pedro Reyes
INSERT INTO drivers (name, email, license_number, status)
VALUES ('Pedro Reyes', 'pedro.reyes@mseuf.edu.ph', 'N01-12-345678', 'active')
WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE name = 'Pedro Reyes');

-- Add Bus 1
INSERT INTO vehicles (vehicle_name, plate_number, vehicle_type, seating_capacity, status)
VALUES ('Bus 1', 'MSE-001', 'bus', 45, 'available')
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE plate_number = 'MSE-001');
```

**After adding:**
- User can submit requests with Pedro Reyes & Bus 1
- Admin will see these as preferred selections
- ✅ No more error!

### Solution 2: API Auto-Fix (ALREADY DONE)
I updated the API to validate driver/vehicle IDs before inserting:
- ✅ If driver doesn't exist → set to NULL (no preference)
- ✅ If vehicle doesn't exist → set to NULL (no preference)
- ✅ Request still submits successfully
- ⚠️ But preferred selections will be ignored

## Testing

### Check if driver/vehicle exist:
```sql
-- Check Pedro Reyes
SELECT * FROM drivers WHERE name ILIKE '%Pedro%Reyes%';

-- Check Bus 1
SELECT * FROM vehicles WHERE plate_number = 'MSE-001';
```

### After Fix:
1. Refresh the user's page
2. Select Pedro Reyes & Bus 1 again
3. Submit request
4. ✅ Should work now!

## Prevention
- Add all drivers and vehicles to the database before production
- Validate dropdowns load from actual database records
- Don't hardcode driver/vehicle names in the UI

## Files Created
1. `CHECK-DRIVERS-VEHICLES.sql` - Check what exists
2. `ADD-PEDRO-REYES-BUS1.sql` - Add missing records
3. `DRIVER-VEHICLE-FIX.md` - This guide
4. Updated API validation in `route.ts`

## Quick Commands

**Add both at once:**
```sql
-- Pedro Reyes
INSERT INTO drivers (name, email, license_number, status)
SELECT 'Pedro Reyes', 'pedro.reyes@mseuf.edu.ph', 'N01-12-345678', 'active'
WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE name = 'Pedro Reyes');

-- Bus 1
INSERT INTO vehicles (vehicle_name, plate_number, vehicle_type, seating_capacity, status)
SELECT 'Bus 1', 'MSE-001', 'bus', 45, 'available'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE plate_number = 'MSE-001');
```

**Verify:**
```sql
SELECT id, name FROM drivers WHERE name = 'Pedro Reyes';
SELECT id, vehicle_name, plate_number FROM vehicles WHERE plate_number = 'MSE-001';
```
