# 📊 COMPLETE DATABASE SCHEMA

**TraviLink - Full Schema Overview**

---

## ✅ EXISTING TABLES (Already in your DB)

### 1. **users** - User accounts
```sql
- id (UUID, PK)
- auth_user_id (UUID) - Links to Supabase Auth
- email (TEXT)
- name (TEXT)
- role (TEXT) - 'admin', 'faculty', 'driver', 'head', etc.
- department_id (UUID FK)
- is_head (BOOLEAN)
- is_hr (BOOLEAN)
- is_exec (BOOLEAN)
- status (TEXT) - 'active', 'inactive'
- created_at, updated_at
```

### 2. **departments** - Department hierarchy
```sql
- id (UUID, PK)
- name (TEXT)
- code (TEXT)
- parent_department_id (UUID FK) - Self-referencing
- created_at, updated_at
```

### 3. **drivers** - Driver-specific info
```sql
- id (UUID, PK)
- user_id (UUID FK → users)
- license_no (TEXT)
- license_expiry (DATE)
- driver_rating (DECIMAL)
- created_at, updated_at
```

### 4. **vehicles** - Vehicle fleet
```sql
- id (UUID, PK)
- plate_number (TEXT, UNIQUE)
- vehicle_name (TEXT)
- type (vehicle_type ENUM) - 'van', 'bus', 'car', 'motorcycle'
- capacity (INTEGER)
- status (TEXT) - 'available', 'in_use', 'maintenance', 'inactive'
- notes (TEXT)
- created_at, updated_at
```

### 5. **requests** - Travel/transport requests
```sql
- id (UUID, PK)
- request_number (TEXT, UNIQUE) - Auto-generated
- request_type (TEXT) - 'travel_order', 'seminar'
- title (TEXT)
- purpose (TEXT)
- destination (TEXT)
  
- travel_start_date (TIMESTAMPTZ)
- travel_end_date (TIMESTAMPTZ)
  
- requester_id (UUID FK → users)
- requester_name (TEXT)
- requester_signature (TEXT)
- requester_is_head (BOOLEAN)
  
- department_id (UUID FK → departments)
- parent_department_id (UUID FK)
  
- participants (JSONB) - Array of participants
- head_included (BOOLEAN)
  
- has_budget (BOOLEAN)
- total_budget (DECIMAL)
- expense_breakdown (JSONB)
  
- needs_vehicle (BOOLEAN)
- vehicle_type (TEXT)
- needs_rental (BOOLEAN)
- assigned_vehicle_id (UUID FK)
- assigned_driver_id (UUID FK)
  
- status (TEXT) - Complex workflow status
- current_approver_role (TEXT)
  
- head_approved_by, head_approved_at, head_signature
- admin_processed_by, admin_processed_at, admin_signature, admin_comments
- comptroller_approved_by, comptroller_approved_at
- hr_approved_by, hr_approved_at, hr_signature
- exec_approved_by, exec_approved_at, exec_signature
  
- created_at, updated_at
```

### 6. **request_history** - Audit trail
```sql
- id (UUID, PK)
- request_id (UUID FK → requests)
- action (TEXT) - 'created', 'approved', 'rejected', 'modified'
- actor_id (UUID FK → users)
- actor_role (TEXT)
- previous_status (TEXT)
- new_status (TEXT)
- comments (TEXT)
- changes (JSONB)
- created_at
```

---

## 🆕 NEW TABLES (Run ADD-REMAINING-TABLES.sql to add)

### 7. **maintenance_records** ⭐ NEW!
```sql
- id (UUID, PK)
- vehicle_id (UUID FK → vehicles)
  
-- Maintenance info
- maintenance_type (TEXT) - 'oil_change', 'tire_rotation', 'brake_service', etc.
- description (TEXT)
- cost (DECIMAL)
  
-- Scheduling
- scheduled_date (TIMESTAMPTZ)
- completed_date (TIMESTAMPTZ)
- next_service_date (TIMESTAMPTZ)
  
-- Personnel
- performed_by (TEXT) - Mechanic name
- approved_by (UUID FK → users)
  
-- Status
- status (TEXT) - 'scheduled', 'in_progress', 'completed', 'cancelled'
- priority (TEXT) - 'low', 'normal', 'high', 'urgent'
  
-- Details
- odometer_reading (INTEGER)
- parts_replaced (JSONB) - [{part, quantity, cost}]
- notes (TEXT)
- attachments (JSONB)
  
- created_at, updated_at
```

**Use Case:** Track all vehicle maintenance, schedule services, manage costs.

### 8. **feedback** ⭐ NEW!
```sql
- id (UUID, PK)
  
-- Who gave feedback
- user_id (UUID FK → users)
- user_name (TEXT)
- user_email (TEXT)
  
-- Related to
- trip_id (UUID FK → requests)
- driver_id (UUID FK → drivers)
- vehicle_id (UUID FK → vehicles)
  
-- Feedback content
- rating (INTEGER 1-5)
- message (TEXT)
- category (TEXT) - 'service', 'driver', 'vehicle', 'app', 'general'
  
-- Admin response
- status (TEXT) - 'new', 'reviewed', 'resolved', 'archived'
- admin_response (TEXT)
- responded_by (UUID FK → users)
- responded_at (TIMESTAMPTZ)
  
- created_at, updated_at
```

**Use Case:** Collect user feedback, ratings, manage responses.

### 9. **notifications** ⭐ NEW!
```sql
- id (UUID, PK)
  
-- Recipient
- user_id (UUID FK → users)
  
-- Notification content
- type (TEXT) - 'request_approved', 'request_rejected', 'trip_assigned', etc.
- title (TEXT)
- message (TEXT)
  
-- Related entity
- related_type (TEXT) - 'request', 'trip', 'vehicle', 'maintenance'
- related_id (UUID)
  
-- Action
- action_url (TEXT) - Link to view details
- action_label (TEXT) - Button text
  
-- Status
- read (BOOLEAN)
- read_at (TIMESTAMPTZ)
  
-- Priority
- priority (TEXT) - 'low', 'normal', 'high', 'urgent'
  
- created_at
- expires_at (TIMESTAMPTZ) - Auto-delete after
```

**Use Case:** In-app notifications, alerts, messages to users.

### 10. **trips** ⭐ NEW!
```sql
- id (UUID, PK)
  
-- Links to request
- request_id (UUID FK → requests)
  
-- Assignment
- driver_id (UUID FK → drivers)
- vehicle_id (UUID FK → vehicles)
  
-- Schedule
- departure_date (TIMESTAMPTZ)
- return_date (TIMESTAMPTZ)
- actual_departure (TIMESTAMPTZ)
- actual_return (TIMESTAMPTZ)
  
-- Trip details
- destination (TEXT)
- purpose (TEXT)
- department_id (UUID FK → departments)
  
-- Participants
- passengers (JSONB)
- passenger_count (INTEGER)
  
-- Status
- status (TEXT) - 'scheduled', 'in_progress', 'completed', 'cancelled'
  
-- Post-trip
- distance_km (DECIMAL)
- fuel_used (DECIMAL)
- notes (TEXT)
  
- created_at, updated_at
```

**Use Case:** Active trip tracking, separate from requests (approved requests become trips).

### 11. **activity_logs** ⭐ NEW!
```sql
- id (UUID, PK)
  
-- Who did what
- user_id (UUID FK → users)
- user_name (TEXT)
- user_role (TEXT)
  
-- Action details
- action (TEXT) - 'create', 'update', 'delete', 'approve', 'reject'
- entity_type (TEXT) - 'request', 'vehicle', 'driver', 'user'
- entity_id (UUID)
  
-- Changes
- changes (JSONB) - Before/after values
  
-- Context
- ip_address (TEXT)
- user_agent (TEXT)
  
- created_at
```

**Use Case:** Complete audit trail, who did what when.

### 12. **export_history** ⭐ NEW!
```sql
- id (UUID, PK)
  
-- Who exported
- user_id (UUID FK → users)
- user_name (TEXT)
  
-- Export details
- export_type (TEXT) - 'requests', 'trips', 'maintenance', 'feedback'
- format (TEXT) - 'csv', 'excel', 'pdf'
- filters (JSONB) - What filters were applied
  
-- File info
- file_name (TEXT)
- file_size (INTEGER)
- download_url (TEXT)
  
- created_at
- expires_at (TIMESTAMPTZ) - Auto-delete file after
```

**Use Case:** Track exports, provide download history.

---

## 🔄 ADDITIONAL COLUMNS (Added to existing tables)

### users table:
```sql
+ phone (TEXT)
+ avatar_url (TEXT)
+ preferences (JSONB) - User settings
+ last_login (TIMESTAMPTZ)
```

### drivers table:
```sql
+ phone (TEXT)
+ address (TEXT)
+ emergency_contact (JSONB) - {name, phone, relationship}
+ vehicle_assignments (JSONB) - Preferred vehicles
```

---

## 📊 COMPLETE TABLE LIST

```
✅ EXISTING (6 tables):
1.  users
2.  departments
3.  drivers
4.  vehicles
5.  requests
6.  request_history

🆕 TO ADD (6 tables):
7.  maintenance_records
8.  feedback
9.  notifications
10. trips
11. activity_logs
12. export_history

TOTAL: 12 tables
```

---

## 🚀 HOW TO ADD NEW TABLES

### Step 1: Copy the SQL
Open: `ADD-REMAINING-TABLES.sql`

### Step 2: Run in Supabase
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Paste the entire SQL file
4. Click "Run"

### Step 3: Verify
Run verification queries at bottom of SQL file:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check row counts
SELECT 'maintenance_records', COUNT(*) FROM maintenance_records;
-- ... etc
```

---

## 🎯 WHAT THIS ENABLES

### With These Tables:
- ✅ Complete maintenance tracking
- ✅ User feedback & ratings
- ✅ Real-time notifications
- ✅ Trip management separate from requests
- ✅ Complete audit trail
- ✅ Export history tracking

### Benefits:
- 📊 Better reporting
- 🔍 Complete traceability
- 📧 User engagement
- 🚗 Fleet management
- 📈 Analytics ready

---

## ⚠️ IMPORTANT NOTES

### RLS (Row Level Security):
- Currently DISABLED for all tables
- OK for internal applications
- Enable if exposing to external users

### Indexes:
- Added for common queries
- Improves performance significantly
- Covers foreign keys, status fields, dates

### JSONB Fields:
- Used for flexible data (participants, changes, preferences)
- Indexed where needed
- Queryable with JSON operators

---

## 📝 NEXT STEPS

After adding tables:
1. ✅ Run `ADD-REMAINING-TABLES.sql`
2. ✅ Verify tables created
3. ✅ Check sample data inserted
4. ✅ Continue with code migration

---

**Ready to add tables?** 
Just copy `ADD-REMAINING-TABLES.sql` and paste in Supabase SQL Editor! 🚀
