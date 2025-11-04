# 🔄 MockData → Real Database Migration Plan

## ✅ COMPLETED:

### 1. Login/Auth - Supabase Sessions
**File:** `src/app/login/page.tsx`

**Changes:**
- ❌ REMOVED: `localStorage.setItem("rememberedEmail")` 
- ✅ REPLACED: Supabase automatic session management
- ✅ ADDED: Session check on mount → auto-redirect if logged in

```tsx
// OLD (localStorage):
localStorage.setItem("rememberedEmail", email);

// NEW (Supabase session):
supabase.auth.getSession() // Auto-handles persistence
```

**Benefits:**
- ✅ Cross-tab session sync
- ✅ Secure httpOnly cookies
- ✅ Auto-refresh tokens
- ✅ No manual localStorage management

---

## 🚧 IN PROGRESS:

### 2. User Requests - Database Integration

**Mock File:** `src/lib/user/request/mockApi.ts`  
**Real API:** `src/app/api/requests/` (already exists!)

**Current Status:**
- ✅ API endpoint exists: `/api/requests/submit`
- ❌ Still using localStorage for drafts
- ❌ Still using mock submissions list

**Migration Plan:**

#### A. Create Drafts API:
```typescript
// NEW: /api/requests/drafts/route.ts
GET    /api/requests/drafts          → Get all user drafts
POST   /api/requests/drafts          → Save new draft
PATCH  /api/requests/drafts/[id]     → Update draft
DELETE /api/requests/drafts/[id]     → Delete draft
```

#### B. Database Schema (Already in RBAC SQL):
```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  current_status VARCHAR(50),
  payload JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE request_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### C. Replace mockApi calls:
```typescript
// OLD (mockApi.ts):
import { saveDraft, getDraft } from "@/lib/user/request/mockApi";

// NEW (api.ts):
import { saveDraft, getDraft } from "@/lib/user/request/api";

// Implementation in api.ts:
export async function saveDraft(data: RequestFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: draft, error } = await supabase
    .from('request_drafts')
    .insert({
      user_id: user.id,
      title: generateTitle(data),
      data: data
    })
    .select()
    .single();
  
  if (error) throw error;
  return draft;
}
```

---

## 📋 PENDING:

### 3. Dashboard Data - Real Queries

**Mock Files:**
- `src/lib/user/schedule/mock.ts` - MOCK_TRIPS
- `src/lib/admin/adapters/mock.ts` - Dashboard stats

**Migration:**

#### A. User Dashboard Stats API:
```typescript
// NEW: /api/user/stats/route.ts
GET /api/user/stats → {
  activeRequests: number,
  pendingApprovals: number,
  upcomingTrips: number,
  draftsSaved: number
}

// Query:
SELECT 
  COUNT(*) FILTER (WHERE current_status NOT IN ('approved', 'rejected')) as active_requests,
  COUNT(*) FILTER (WHERE current_status = 'pending_head') as pending_approvals,
  -- ... more stats
FROM requests
WHERE user_id = $1;
```

#### B. Schedule/Trips API:
```typescript
// NEW: /api/user/trips/route.ts
GET /api/user/trips → Trip[]

// Query from requests table:
SELECT 
  id,
  payload->>'purpose' as purpose,
  payload->>'travelFrom' as origin,
  payload->>'travelTo' as destination,
  payload->>'travelDate' as date,
  payload->>'travelTime' as time
FROM requests
WHERE user_id = $1
  AND current_status = 'approved'
  AND payload->>'travelDate' >= CURRENT_DATE
ORDER BY payload->>'travelDate' ASC;
```

---

### 4. Admin Data - Real Queries

**Mock Files:**
- `src/lib/admin/requests/store.ts` - In-memory store
- `src/lib/admin/feedback/mock.ts`
- `src/lib/admin/maintenance/mocks.ts`
- `src/lib/admin/report/mock.ts`

**Migration:**

#### A. Admin Requests API:
```typescript
// ALREADY EXISTS: /api/admin/requests/route.ts
// Just need to replace AdminRequestsRepo with real DB calls

// Replace:
AdminRequestsRepo.list() 
// With:
supabase.from('requests').select('*')
```

#### B. Feedback API:
```typescript
// NEW: /api/admin/feedback/route.ts
GET /api/admin/feedback → Feedback[]

CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(20),
  subject TEXT,
  message TEXT,
  rating INT,
  status VARCHAR(20),
  created_at TIMESTAMP
);
```

#### C. Maintenance API:
```typescript
// NEW: /api/admin/maintenance/route.ts  
GET /api/admin/maintenance → MaintenanceRecord[]

CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  type VARCHAR(50),
  description TEXT,
  cost DECIMAL,
  date DATE,
  technician TEXT,
  status VARCHAR(20)
);
```

---

### 5. Driver Data - Real Queries

**Mock Files:**
- `src/lib/data/api/mock.ts` - Driver profiles
- `src/lib/mock.ts` - Vehicles, drivers lists

**Migration:**

#### A. Driver Profile API:
```typescript
// MODIFY: /api/dev/driver/register/route.ts
// Add GET method for profile fetch

GET /api/driver/profile → DriverProfile

CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phone VARCHAR(20),
  address TEXT,
  license_number VARCHAR(50),
  license_expiry DATE,
  emergency_contact JSONB,
  created_at TIMESTAMP
);
```

#### B. Vehicles API:
```typescript
// NEW: /api/admin/vehicles/route.ts
GET /api/admin/vehicles → Vehicle[]

CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  plate_number VARCHAR(20),
  model TEXT,
  type VARCHAR(50),
  capacity INT,
  status VARCHAR(20),
  last_maintenance DATE
);
```

---

## 🗑️ FILES TO DELETE (After Migration):

1. ❌ `src/lib/user/request/mockApi.ts`
2. ❌ `src/lib/user/schedule/mock.ts`
3. ❌ `src/lib/admin/adapters/mock.ts`
4. ❌ `src/lib/admin/feedback/mock.ts`
5. ❌ `src/lib/admin/maintenance/mocks.ts`
6. ❌ `src/lib/admin/report/mock.ts`
7. ❌ `src/lib/data/api/mock.ts`
8. ❌ `src/lib/mock.ts`

**Keep ONLY:**
- Type definitions
- Utility functions
- Constants

---

## 📝 DATABASE TABLES NEEDED:

### Already Have (from RBAC SQL):
- ✅ `users`
- ✅ `departments`
- ✅ `role_grants`
- ✅ `department_heads`
- ✅ `requests` (approvals table)

### Need to Add:
```sql
-- 1. Request Drafts
CREATE TABLE request_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Travel Requests (main)
CREATE TABLE travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  request_number VARCHAR(50) UNIQUE,
  purpose TEXT,
  destination TEXT,
  origin TEXT,
  travel_date DATE,
  travel_time TIME,
  return_date DATE,
  return_time TIME,
  current_status VARCHAR(50),
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(20) UNIQUE,
  model TEXT,
  type VARCHAR(50),
  capacity INT,
  status VARCHAR(20) DEFAULT 'available',
  last_maintenance DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Driver Profiles
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  address TEXT,
  license_number VARCHAR(50),
  license_expiry DATE,
  emergency_contact JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20),
  subject TEXT,
  message TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Maintenance Records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  type VARCHAR(50),
  description TEXT,
  cost DECIMAL(10,2),
  date DATE,
  technician TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Trips (scheduled/completed)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES travel_requests(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES users(id),
  status VARCHAR(20),
  actual_departure TIMESTAMP,
  actual_arrival TIMESTAMP,
  distance_km DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 MIGRATION STEPS:

### Phase 1: Core Requests (CURRENT)
1. ✅ Remove localStorage from login
2. ✅ Add session management
3. 🚧 Create request_drafts table
4. 🚧 Create /api/requests/drafts endpoints
5. 🚧 Replace mockApi imports

### Phase 2: Dashboard Data
1. Create travel_requests table
2. Create /api/user/stats endpoint
3. Create /api/user/trips endpoint
4. Replace MOCK_TRIPS with real query

### Phase 3: Admin Features
1. Create vehicles table
2. Create feedback table
3. Create maintenance_records table
4. Create admin API endpoints
5. Replace all AdminRepo with DB queries

### Phase 4: Driver Features
1. Create driver_profiles table
2. Create trips table
3. Create driver API endpoints
4. Replace mock driver data

### Phase 5: Cleanup
1. Delete all mock*.ts files
2. Remove localStorage usage (except Supabase)
3. Update all imports
4. Test end-to-end

---

## ⚠️ NOT TOUCHING (As Requested):

- ❌ PDF generation/handling
- ❌ Document templates
- ❌ Print functionality

---

## 📊 PROGRESS TRACKER:

- [x] Login/Auth (Supabase sessions)
- [ ] Request Drafts
- [ ] Travel Requests
- [ ] Dashboard Stats
- [ ] Schedule/Trips
- [ ] Admin Requests
- [ ] Feedback
- [ ] Maintenance
- [ ] Vehicles
- [ ] Drivers
- [ ] Reports

**Total: 1/11 Complete (9%)**

---

**Next Action:** Create database migration SQL file with all needed tables, then create API endpoints one by one.
