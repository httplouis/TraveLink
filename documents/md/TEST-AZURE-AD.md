# 🧪 How to Test Azure AD Integration

## Quick Test Steps

### Step 1: Check if Environment Variables are Loaded

1. **Open** `.env.local` file
2. **Verify** na may:
   ```env
   AZURE_CLIENT_ID=your-client-id-here
   AZURE_TENANT_ID=your-tenant-id-here
   AZURE_CLIENT_SECRET=your-client-secret-here
   ```

### Step 2: Restart Server (IMPORTANT!)

**Kailangan i-restart ang server para ma-load ang new environment variables!**

1. **Stop** ang server (press `Ctrl + C` sa terminal)
2. **Start** ulit: `pnpm dev`
3. **Wait** for "Ready" message

### Step 3: Test via Browser / API

#### Option A: Test via Browser (Easiest)

1. **Open** browser
2. **Go to:**
   ```
   http://localhost:3000/api/email-directory?email=YOUR_EMAIL@mseuf.edu.ph
   ```
   Replace `YOUR_EMAIL@mseuf.edu.ph` with an actual institutional email

3. **Example:**
   ```
   http://localhost:3000/api/email-directory?email=head.nursing@mseuf.edu.ph
   ```

4. **Check the response:**
   - ✅ **If Azure AD works:** May `"source": "azure_ad"` sa response
   - ⚠️ **If fallback:** May `"source": "simulated_directory"` sa response

#### Option B: Test via Registration Page

1. **Go to:** `http://localhost:3000/register`
2. **Enter** an institutional email (e.g., `test@mseuf.edu.ph`)
3. **Click** outside the email field (blur event)
4. **Check** kung auto-filled ang name at department
5. **Open** browser DevTools (F12) → Console tab
6. **Look** for logs na may `[email-directory]`

#### Option C: Test via Terminal (curl)

**Windows PowerShell:**
```powershell
curl "http://localhost:3000/api/email-directory?email=head.nursing@mseuf.edu.ph"
```

**Or use Invoke-WebRequest:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/email-directory?email=head.nursing@mseuf.edu.ph" | Select-Object -ExpandProperty Content
```

---

## Expected Responses

### ✅ Success (Azure AD Working)

```json
{
  "ok": true,
  "data": {
    "email": "head.nursing@mseuf.edu.ph",
    "name": "Dr. Maria Santos",
    "department": "College of Nursing and Allied Health Sciences",
    "position": "Department Head"
  },
  "source": "azure_ad",
  "note": "Data retrieved from Azure Active Directory"
}
```

### ⚠️ Fallback (Simulated Directory)

```json
{
  "ok": true,
  "data": {
    "email": "head.nursing@mseuf.edu.ph",
    "name": "Dr. Maria Santos",
    "department": "College of Nursing and Allied Health Sciences (CNAHS)",
    "position": "Department Head"
  },
  "source": "simulated_directory",
  "note": "Department and position may be outdated; use as provisional data only. Actual roles are assigned by administrators."
}
```

### ❌ Error (No Azure AD Config)

```json
{
  "ok": false,
  "error": "Email not found in directory",
  "note": "You can still register. Your role will be set to faculty/staff by default."
}
```

---

## Check Server Logs

**Look for these logs sa terminal:**

### ✅ Azure AD Working:
```
[email-directory] Azure AD configured, attempting lookup...
[email-directory] ✅ User found in Azure AD: test@mseuf.edu.ph
```

### ⚠️ Azure AD Not Configured:
```
[email-directory] Azure AD not configured, using fallback directory
```

### ❌ Azure AD Error:
```
[email-directory] Azure AD lookup error: [error message]
[email-directory] Falling back to simulated directory
```

---

## Troubleshooting

### Problem: Still getting "simulated_directory"

**Solutions:**
1. ✅ **Check** `.env.local` - dapat may `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`
2. ✅ **Restart** server (important!)
3. ✅ **Check** terminal logs - may error ba?
4. ✅ **Verify** Azure AD credentials are correct
5. ✅ **Check** if admin consent was granted (kung hindi, fallback lang)

### Problem: Getting 401 or 403 errors

**Solutions:**
1. ✅ **Check** `AZURE_CLIENT_SECRET` - dapat correct
2. ✅ **Check** `AZURE_TENANT_ID` - dapat correct
3. ✅ **Check** `AZURE_CLIENT_ID` - dapat correct
4. ✅ **Verify** admin consent was granted sa Azure portal

### Problem: "Email not found in directory"

**Solutions:**
1. ✅ **Check** kung institutional email (`@mseuf.edu.ph`)
2. ✅ **Check** kung existing ang email sa Azure AD
3. ✅ **Try** different email address

---

## Quick Test Checklist

- [ ] Environment variables added to `.env.local`
- [ ] Server restarted
- [ ] Tested via browser API endpoint
- [ ] Checked server logs for Azure AD messages
- [ ] Verified response has `"source": "azure_ad"` (if working)
- [ ] Tested on registration page (auto-fill)

---

## Next Steps

**If Azure AD is working:**
- ✅ Auto-fill ng name at department sa registration
- ✅ Real-time data from Azure AD
- ✅ No need for manual updates

**If using fallback:**
- ⚠️ Still works, pero simulated data lang
- ⚠️ Need to contact IT Admin for admin consent
- ✅ Pwede pa rin mag-register at gumamit ng system

