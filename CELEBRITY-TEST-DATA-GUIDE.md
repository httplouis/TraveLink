# 🎬 Hollywood Celebrity Test Data for CNAHS

**Purpose:** Quick test data with celebrity names for testing  
**Department:** College of Nursing and Allied Health Sciences (CNAHS)

---

## 🎯 QUICK START:

### Option 1: Use JSON Data (Frontend Testing)
**File:** `TEST-DATA-CNAHS-CELEBRITIES.json`

Copy/paste values into the form manually or use for reference.

---

### Option 2: Insert to Database (Backend Testing)
**File:** `INSERT-TEST-REQUESTS-CELEBRITIES.sql`

**Run in Supabase SQL Editor:**
```sql
-- This will create 5 test requests automatically!
```

---

## 🎭 CELEBRITY TEST USERS:

### 1. Leonardo DiCaprio
- **Trip:** Hospital partnership visit
- **Destination:** Philippine General Hospital
- **Dates:** Nov 10-12, 2025
- **Department:** CNAHS

### 2. Scarlett Johansson
- **Trip:** Nursing Leadership Seminar
- **Destination:** SMX Convention Center
- **Dates:** Nov 15-17, 2025
- **Budget:** ₱12,000
- **Department:** CNAHS

### 3. Tom Holland
- **Trip:** Medical mission outreach
- **Destination:** Barangay San Isidro, Antipolo
- **Date:** Nov 20, 2025
- **Department:** CNAHS

### 4. Emma Stone
- **Trip:** Curriculum benchmarking
- **Destination:** UST Manila
- **Date:** Nov 25, 2025
- **Department:** CNAHS

### 5. Chris Hemsworth
- **Trip:** Clinical Skills Workshop
- **Destination:** Makati Medical Center
- **Dates:** Dec 1-3, 2025
- **Budget:** ₱17,500
- **Department:** CNAHS

---

## 🗂️ MORE CELEBRITIES AVAILABLE:

```
Actors/Actresses:
- Tom Cruise
- Jennifer Lawrence
- Chris Evans
- Anne Hathaway
- Michael B. Jordan
- Emma Watson
- Dwayne Johnson
- Brie Larson
- Timothée Chalamet
- Florence Pugh
- Ryan Reynolds
- Gal Gadot
- Margot Robbie
- Zendaya Coleman
- Robert Downey Jr.
```

---

## 🏥 COMMON CNAHS DESTINATIONS:

```
Hospitals:
- Philippine General Hospital, Manila
- St. Luke's Medical Center, Quezon City
- Makati Medical Center, Makati City
- Asian Hospital and Medical Center, Muntinlupa
- Philippine Heart Center, Quezon City
- Veterans Memorial Medical Center, Quezon City
- Manila Doctor's Hospital, Manila
- Cardinal Santos Medical Center, San Juan
- The Medical City, Pasig
- Lung Center of the Philippines, Quezon City

Convention Centers:
- SMX Convention Center, Pasay City
- World Trade Center, Pasay City
- Philippine International Convention Center, Manila

Universities:
- University of Santo Tomas
- University of the Philippines Manila
- Far Eastern University
```

---

## 🚗 DRIVERS & VEHICLES:

### Available Drivers:
```
- Ana Garcia
- Carlos Santos
- Pedro Reyes
- Maria Santos
- Juan Dela Cruz
```

### Available Vehicles:
```
- Bus 1 • MSE-001
- Van 1 • MSE-002
- Bus 2 • MSE-003
- Van 2 • MSE-004
```

---

## 📝 SAMPLE TRIP PURPOSES:

### Medical/Clinical:
```
- Campus visit and coordination with partner hospital
- Medical mission and community outreach program
- Hospital exposure and clinical rotation coordination
- Research collaboration and data gathering
- Student immersion program at partner hospital
```

### Training/Development:
```
- Nursing Leadership and Management Seminar
- Advanced Clinical Skills Training Workshop
- International Nursing Conference 2025
- Professional development training
```

### Official Business:
```
- Benchmarking and curriculum development meeting
- Partnership meeting with healthcare institution
- MOA signing with partner hospital
- Accreditation visit
```

---

## 💰 SAMPLE BUDGETS:

### Light Budget (₱2,000-5,000):
```json
{
  "food": 1200,
  "driversAllowance": 800
}
```

### Medium Budget (₱10,000-15,000):
```json
{
  "food": 3000,
  "accommodation": 5000,
  "driversAllowance": 1500,
  "other": 2500
}
```

### Heavy Budget (₱20,000+):
```json
{
  "food": 5000,
  "accommodation": 12000,
  "driversAllowance": 2500,
  "other": 8000
}
```

---

## 🎯 HOW TO USE:

### Manual Entry (Form):
1. Open Request Form
2. Select "Visit" or "Seminar"
3. Select "Owned vehicle" or "Institutional vehicle"
4. Select "Faculty"
5. **Requesting Person:** Pick a celebrity name
6. **Department:** College of Nursing and Allied Health Sciences (CNAHS)
7. **Purpose:** Copy from samples above
8. **Destination:** Pick a hospital/venue
9. **Dates:** Any future date
10. Submit!

---

### Database Insert (SQL):
1. Open Supabase SQL Editor
2. Copy `INSERT-TEST-REQUESTS-CELEBRITIES.sql`
3. Run the script
4. Check `requests` table
5. **Instant 5 test requests!** ✅

---

## ✅ BENEFITS:

1. **Quick Testing** - No need to type long names
2. **Fun Names** - Easy to identify test data
3. **Realistic Data** - Proper CNAHS-related trips
4. **Bulk Insert** - Create multiple requests fast
5. **Easy to Clean** - Delete test data by name pattern

---

## 🧹 CLEANUP:

### To delete test requests later:
```sql
-- Delete all celebrity test requests
DELETE FROM requests
WHERE requester_name IN (
  'Leonardo DiCaprio',
  'Scarlett Johansson',
  'Tom Holland',
  'Emma Stone',
  'Chris Hemsworth',
  'Ryan Reynolds',
  'Gal Gadot',
  'Margot Robbie'
);
```

---

## 🎬 ENJOY TESTING WITH HOLLYWOOD STARS! 

**CNAHS never looked so glamorous!** ⭐
