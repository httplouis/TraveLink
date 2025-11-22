# ✅ CHECK USER DATA IN SUPABASE

## 🔍 Issue Fixed: Schema Cache Error

**Fixed:** Removed the join query that was causing "Could not find a relationship between 'users' and 'departments' in the schema cache"

**Solution:** Now fetching department separately, just like other API routes.

---

## 🧪 Next Steps: Check if Data Exists

### Step 1: Refresh Profile Page
1. **Go to:** `http://localhost:3000/user/profile`
2. **Press F5** to refresh
3. **Should work now** (no more schema error)

### Step 2: Check Terminal Logs
When you refresh, check terminal for:
- `[GET /api/profile]` logs
- Any errors

### Step 3: If Still Empty - Check Database

**Go to Supabase Dashboard:**
1. **Table Editor** → `users` table
2. **Find your user** (by email: `a22-34976@student.mseuf.edu.ph`)
3. **Check these fields:**
   - `name` - Should have your name
   - `department` - Should have department name (text)
   - `department_id` - Should have department ID (if linked)
   - `position_title` - Should have job title/position

---

## 🔧 If Data is Missing:

### Option 1: Re-login
1. **Logout** from the app
2. **Login again** with Microsoft
3. **Check terminal logs** for:
   - `[auth/callback] ✅ Profile retrieved from Microsoft Graph...`
   - OR `[auth/callback] ✅ Profile retrieved from email directory API...`
4. **Check database** again - should have data now

### Option 2: Check Callback Route Logs
When you login, terminal should show:
- Graph API success/failure
- Email directory API fallback
- User created/updated with profile data

---

## 🎯 Expected Result:

After refresh:
- ✅ No schema error
- ✅ Profile page loads
- ✅ Shows name (if exists in database)
- ✅ Shows department (if exists in database)
- ✅ Shows position (if exists in database)

---

**Try mo: Refresh ang profile page (F5) - dapat walang error na!** 🚀

