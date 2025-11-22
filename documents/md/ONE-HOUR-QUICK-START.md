# ⚡ 1-Hour Quick Start - Migration Sprint

Time: 60 minutes
Goal: Get immediate visible results!

---

## ✅ Checklist (Check as you go)

### Part 1: Database Setup (10 mins)

- [ ] **Step 1.1:** Open Supabase Dashboard
- [ ] **Step 1.2:** Go to SQL Editor
- [ ] **Step 1.3:** Open `SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql`
- [ ] **Step 1.4:** Copy ENTIRE file (Ctrl+A, Ctrl+C)
- [ ] **Step 1.5:** Paste into Supabase SQL Editor (Ctrl+V)
- [ ] **Step 1.6:** Click **"Run"** button
- [ ] **Step 1.7:** Wait for success message
- [ ] **Step 1.8:** Verify results:
  ```
  Expected output:
  table_name          | count
  --------------------|-------
  Vehicles            | 7
  Drivers (users)     | 5
  Drivers (profiles)  | 5
  ```

**✅ Checkpoint 1:** Data is now in database!

---

### Part 2: Test API Endpoints (10 mins)

- [ ] **Step 2.1:** Start dev server
  ```bash
  npm run dev
  ```

- [ ] **Step 2.2:** Test vehicles API
  ```
  Open browser: http://localhost:3000/api/vehicles
  ```
  **Expected:** JSON with 7 vehicles
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "uuid",
        "name": "L300 Van",
        "plate_number": "ABC-1234",
        "type": "van",
        "capacity": 12,
        "status": "available"
      },
      ...
    ]
  }
  ```

- [ ] **Step 2.3:** Test drivers API
  ```
  Open browser: http://localhost:3000/api/drivers
  ```
  **Expected:** JSON with 5 drivers
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "uuid",
        "name": "Juan Dela Cruz",
        "email": "driver.juan@mseuf.edu.ph",
        "licenseNumber": "DL-2024-001",
        "isAvailable": true
      },
      ...
    ]
  }
  ```

**✅ Checkpoint 2:** APIs working!

---

### Part 3: Test UI Dropdowns (10 mins)

- [ ] **Step 3.1:** Go to request page
  ```
  http://localhost:3000/user/request
  ```

- [ ] **Step 3.2:** Select "Institutional" for vehicle mode

- [ ] **Step 3.3:** Scroll to "School Service Request" section

- [ ] **Step 3.4:** Check "Preferred Driver" dropdown
  - [ ] Should show: Juan Dela Cruz, Maria Santos, Pedro Reyes, etc.
  - [ ] Should NOT show hardcoded mock data

- [ ] **Step 3.5:** Check "Preferred Vehicle" dropdown
  - [ ] Should show: L300 Van • ABC-1234, Toyota Hiace • DEF-5678, etc.
  - [ ] Should NOT show hardcoded mock data

- [ ] **Step 3.6:** Open browser DevTools (F12)
  - [ ] Go to Network tab
  - [ ] Refresh page
  - [ ] Should see API calls to `/api/drivers` and `/api/vehicles`

**✅ Checkpoint 3:** Dropdowns loading from database!

---

### Part 4: Understanding the Mapping (15 mins)

**Read this to understand what's happening:**

#### Database Schema vs Admin Types

Your database uses different names than the admin interface:

| Database Column | Admin Type Field | Mapping Needed? |
|----------------|------------------|-----------------|
| `vehicle_name` | `brand` + `model` | ✅ YES - need to split |
| `plate_number` | `plateNo` | ✅ YES - different name |
| `type` (lowercase) | `type` (capitalized) | ✅ YES - case change |
| `status` (available, in_use, maintenance) | `status` (active, maintenance, inactive) | ✅ YES - different values |
| `capacity` | `capacity` | ✅ NO - same! |
| `notes` | `notes` | ✅ NO - same! |

**What was created:**
- ✅ `mappers.ts` - Handles transformation between database and admin types

**What this means:**
- When fetching from database, we transform: `vehicle_name` → `brand` + `model`
- When saving to database, we transform: `brand` + `model` → `vehicle_name`

---

### Part 5: Quick Verification (15 mins)

#### Test 5.1: Check Database Directly

- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Click on `vehicles` table
- [ ] Verify you see 7 vehicles
- [ ] Click on `drivers` table  
- [ ] Verify you see 5 drivers

#### Test 5.2: Check Browser Console

- [ ] Open request page: http://localhost:3000/user/request
- [ ] Open DevTools Console (F12)
- [ ] Look for any errors (should be none)
- [ ] Check Network tab for successful API calls

#### Test 5.3: Take Screenshot!

- [ ] Screenshot of dropdowns working
- [ ] Screenshot of API response in browser
- [ ] Save for documentation

**✅ Checkpoint 4:** Everything verified!

---

## 🎉 WHAT YOU ACCOMPLISHED (1 Hour)

### ✅ Completed:
1. Added 7 vehicles to database
2. Added 5 drivers to database
3. Tested `/api/vehicles` endpoint
4. Tested `/api/drivers` endpoint
5. Verified dropdowns load from database
6. Created data mapping layer

### 📊 Progress:
```
Before: [░░░░░░░░░░] 0%
After:  [██░░░░░░░░] 15%
```

**Status:** 
- ✅ Dropdowns: Working from database
- ✅ APIs: Working
- ✅ Sample data: In database
- ⏳ Admin pages: Still using localStorage
- ⏳ User requests: Still using localStorage

---

## 🚀 NEXT STEPS (Future Sessions)

### Next 1-Hour Session Option A: Admin Vehicles Page
**Goal:** Make admin vehicles management use database

**Tasks:**
1. Update `admin/vehicles/store.ts` to use `/api/vehicles`
2. Add POST/PATCH/DELETE routes to API
3. Test CRUD operations in admin page

**Estimated:** 1-2 hours

### Next 1-Hour Session Option B: User Request Submission
**Goal:** Save user requests to database

**Tasks:**
1. Create `/api/user/requests` POST route
2. Update `user/request/mockApi.ts` to use API
3. Test request submission

**Estimated:** 2-3 hours (more complex)

### Recommended: Do Option A first (easier win!)

---

## 📝 Notes to Remember

### What's Working Now:
- ✅ SchoolServiceSection dropdowns (drivers & vehicles)
- ✅ API endpoints for vehicles and drivers
- ✅ Database has sample data

### What's Still on localStorage:
- ❌ User request submissions
- ❌ User schedule/calendar
- ❌ Admin requests list
- ❌ Admin vehicles management
- ❌ Admin drivers management
- ❌ Maintenance records
- ❌ Admin schedule

### Files Created Today:
1. `SAFE-MIGRATION-FOR-EXISTING-SCHEMA.sql` - Sample data
2. `mappers.ts` - Data transformation layer
3. `ONE-HOUR-QUICK-START.md` - This guide
4. Various documentation files

---

## ⚠️ Important Notes

### Type Mismatches:
The admin `Vehicle` type expects:
- `brand` and `model` (separate fields)
- `code` field
- `odometerKm` field
- `lastServiceISO` field

But database only has:
- `vehicle_name` (combined)
- `plate_number`
- No mileage tracking yet

**Solution:** The mapper handles this by:
- Splitting `vehicle_name` into brand/model
- Using `plate_number` as `code`
- Setting default values for missing fields

### Enum Differences:
- Database: `'van'`, `'bus'`, `'car'` (lowercase)
- Admin: `'Van'`, `'Bus'`, `'Car'` (capitalized)

**Solution:** Mapper converts case automatically

---

## ✅ Session Complete!

**Time spent:** ~60 minutes
**Result:** Dropdowns now powered by database! 🎉

**Celebrate:** You can now add vehicles and drivers via Supabase, and they'll appear in the request form dropdowns automatically!

**Next time:** Pick one of the next session options above and continue the migration!

---

## 🆘 Troubleshooting

### Problem: Dropdowns empty
**Check:**
1. Did SQL script run successfully?
2. Are there vehicles in database? (Check Supabase Table Editor)
3. Are API endpoints returning data? (Check browser Network tab)
4. Any console errors? (Check browser Console)

### Problem: API returns 500 error
**Check:**
1. Supabase connection working?
2. Environment variables set? (`.env.local`)
3. Column names match? (vehicle_name vs name)

### Problem: Type errors in mapper
**Fix:**
1. Check if `mappers.ts` was created
2. Verify import paths are correct
3. TypeScript compiler might need restart

---

**CONGRATS!** 🎊 You've completed your first 1-hour migration sprint!
