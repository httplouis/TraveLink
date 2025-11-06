# TraviLink Migration to Supabase Database

This guide will help you migrate all mock data from localStorage and in-memory storage to Supabase PostgreSQL database.

## Table of Contents
1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [What's Been Migrated](#whats-been-migrated)
4. [Migration Steps](#migration-steps)
5. [API Routes](#api-routes)
6. [Component Updates](#component-updates)
7. [Testing](#testing)

---

## Overview

The system has been updated to use Supabase as the primary database instead of mock data. This provides:

✅ **Persistent data storage** - Data survives page refreshes and browser changes  
✅ **Real-time capabilities** - Multiple users can see updates instantly  
✅ **Proper authentication & security** - Row Level Security (RLS) policies  
✅ **Scalability** - Handle production workloads  
✅ **Data relationships** - Foreign keys and referential integrity  

---

## Database Setup

### Step 1: Run the Database Schema Scripts

Execute these SQL scripts in order on your Supabase SQL Editor:

```bash
# 1. Create base workflow schema (if not already done)
psql -f DATABASE-WORKFLOW-SCHEMA.sql

# 2. Add additional tables (vehicles, drivers, feedback, trips)
psql -f DATABASE-ADDITIONAL-TABLES.sql

# 3. Seed initial data
psql -f DATABASE-SEED-DATA.sql
```

Or manually in Supabase Dashboard:
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste contents of each file in order:
   - `DATABASE-WORKFLOW-SCHEMA.sql`
   - `DATABASE-ADDITIONAL-TABLES.sql`
   - `DATABASE-SEED-DATA.sql`
3. Click **Run** for each script

### Step 2: Verify Tables Were Created

Run this query to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- ✅ `users`
- ✅ `departments`
- ✅ `requests`
- ✅ `request_history`
- ✅ `vehicles`
- ✅ `driver_profiles`
- ✅ `trips`
- ✅ `feedback`
- ✅ `vehicle_maintenance`
- ✅ `department_budgets`

---

## What's Been Migrated

### 1. **Vehicles** 🚐
**Before:** Mock data in `SchoolServiceSection.ui.tsx`  
**After:** `vehicles` table in Supabase  
**API:** `/api/vehicles`

Sample data includes:
- L300 Van (ABC-1234)
- Toyota Hiace (DEF-5678)
- Mitsubishi Adventure (GHI-9012)
- School buses and cars

### 2. **Drivers** 👨‍✈️
**Before:** Mock data in `SchoolServiceSection.ui.tsx`  
**After:** `driver_profiles` + `users` tables  
**API:** `/api/drivers`

Sample drivers:
- Juan Dela Cruz
- Maria Santos
- Pedro Reyes
- Ana Garcia
- Roberto Fernandez

### 3. **Trips/Schedule** 📅
**Before:** `src/lib/user/schedule/mock.ts`  
**After:** `trips` table in Supabase  
**API:** `/api/trips`

### 4. **Feedback** 💬
**Before:** `src/lib/admin/feedback/mock.ts`  
**After:** `feedback` table in Supabase  
**API:** `/api/admin/feedback`

### 5. **Requests** 📋
**Before:** `src/lib/admin/requests/data.ts` + localStorage  
**After:** `requests` + `request_history` tables  
**API:** `/api/requests/*` (already implemented)

---

## Migration Steps

### For Development/Testing

1. **Backup existing data** (if any):
   ```bash
   # Export from localStorage if needed
   # Open browser console and run:
   console.log(localStorage.getItem('travilink_user_request_drafts'))
   console.log(localStorage.getItem('travilink_user_request_submissions'))
   ```

2. **Run database scripts** (see Step 1 above)

3. **Verify API routes work**:
   ```bash
   # Test in browser or Postman
   GET http://localhost:3000/api/vehicles
   GET http://localhost:3000/api/drivers
   GET http://localhost:3000/api/trips
   GET http://localhost:3000/api/admin/feedback
   ```

4. **Clear localStorage** (optional, to force fresh data):
   ```javascript
   // In browser console
   localStorage.clear()
   ```

### For Production

1. **Backup production database** first!
2. Run migration scripts on production Supabase instance
3. Verify all data migrated correctly
4. Update environment variables if needed
5. Deploy updated application code
6. Monitor for errors

---

## API Routes

### Vehicles API

```typescript
// GET /api/vehicles
// Fetch all available vehicles
GET /api/vehicles?status=available&type=Van

Response:
{
  ok: true,
  data: [
    {
      id: "uuid",
      name: "L300 Van",
      plate_number: "ABC-1234",
      type: "Van",
      capacity: 12,
      status: "available"
    }
  ]
}
```

### Drivers API

```typescript
// GET /api/drivers
// Fetch all available drivers
GET /api/drivers?available=true

Response:
{
  ok: true,
  data: [
    {
      id: "uuid",
      name: "Juan Dela Cruz",
      email: "driver.juan@mseuf.edu.ph",
      licenseNumber: "DL-2024-001",
      canDriveTypes: ["Van", "Car"],
      isAvailable: true,
      totalTrips: 145,
      badges: ["safe_driver", "veteran"]
    }
  ]
}
```

### Trips API

```typescript
// GET /api/trips
// Fetch trips/schedule
GET /api/trips?date=2025-01-15&status=scheduled

// POST /api/trips
// Create new trip
POST /api/trips
Body: {
  vehicleId: "uuid",
  driverId: "uuid",
  departmentId: "uuid",
  destination: "CHED Region IV-A",
  purpose: "Official Meeting",
  tripDate: "2025-01-15",
  departureTime: "08:00",
  returnTime: "17:00"
}
```

### Feedback API

```typescript
// GET /api/admin/feedback
GET /api/admin/feedback?status=NEW

// POST /api/admin/feedback
POST /api/admin/feedback
Body: {
  userName: "John Doe",
  message: "Great system!",
  rating: 5
}

// PATCH /api/admin/feedback
PATCH /api/admin/feedback
Body: {
  id: "uuid",
  status: "REVIEWED",
  adminResponse: "Thank you for your feedback"
}
```

---

## Component Updates

### SchoolServiceSection ✅ UPDATED
**File:** `src/components/user/request/ui/SchoolServiceSection.ui.tsx`

**Changes:**
- ✅ Fetches drivers from `/api/drivers`
- ✅ Fetches vehicles from `/api/vehicles`
- ✅ Shows loading state while fetching
- ✅ Dropdowns populated from database
- ✅ No longer uses mock data

### Components Still Using Mock Data

These need to be updated to use Supabase:

#### 1. Admin Dashboard
**File:** `src/lib/admin/requests/data.ts`  
**TODO:** Replace `REQUESTS` array with API call to `/api/requests`

#### 2. User Schedule/Dashboard
**File:** `src/lib/user/schedule/mock.ts`  
**TODO:** Replace `MOCK_TRIPS` with API call to `/api/trips`

#### 3. Admin Feedback Page
**File:** `src/lib/admin/feedback/store.ts`  
**TODO:** Replace mock store with API calls to `/api/admin/feedback`

#### 4. Driver Profile
**File:** `src/lib/data/driverProfile.ts`  
**TODO:** Fetch from `/api/drivers` or user profile API

---

## Testing

### Test the Migration

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test School Service Request:**
   - Navigate to `/user/request`
   - Select "Institutional" vehicle mode
   - Check if driver and vehicle dropdowns load
   - Verify data comes from Supabase

3. **Test API endpoints:**
   ```bash
   # Check vehicles
   curl http://localhost:3000/api/vehicles
   
   # Check drivers
   curl http://localhost:3000/api/drivers
   
   # Check trips
   curl http://localhost:3000/api/trips
   
   # Check feedback
   curl http://localhost:3000/api/admin/feedback
   ```

4. **Verify in Supabase Dashboard:**
   - Go to **Table Editor**
   - Check data in `vehicles`, `driver_profiles`, `trips`, `feedback`
   - Verify counts match seed data

---

## Rollback Plan

If something goes wrong:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   ```

2. **Restore mock data:**
   - Components will fall back to empty arrays if API fails
   - Original mock data is still in git history

3. **Database rollback:**
   ```sql
   -- Drop new tables if needed
   DROP TABLE IF EXISTS vehicle_maintenance CASCADE;
   DROP TABLE IF EXISTS trips CASCADE;
   DROP TABLE IF EXISTS feedback CASCADE;
   DROP TABLE IF EXISTS driver_profiles CASCADE;
   DROP TABLE IF EXISTS vehicles CASCADE;
   ```

---

## Next Steps

1. ✅ **Database schema created**
2. ✅ **Seed data inserted**
3. ✅ **API routes implemented**
4. ✅ **SchoolServiceSection updated**
5. ⏳ **Update remaining components** (Admin Dashboard, User Schedule, etc.)
6. ⏳ **Add real-time subscriptions** (optional)
7. ⏳ **Implement caching** (optional)
8. ⏳ **Add data validation** (Zod schemas)

---

## Common Issues & Solutions

### Issue: API returns empty data
**Solution:** Check if seed data was inserted. Run `DATABASE-SEED-DATA.sql` again.

### Issue: Permission denied errors
**Solution:** Check RLS policies. You may need to disable RLS for testing:
```sql
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
```

### Issue: Dropdown shows "Loading..." forever
**Solution:** Check browser console for errors. Verify API endpoints are accessible.

### Issue: Database connection fails
**Solution:** Verify environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in dashboard
3. Verify all SQL scripts ran successfully
4. Test API endpoints directly using curl or Postman

Happy migrating! 🚀
