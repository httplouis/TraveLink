# 🔧 Azure AD Integration - Fix Summary

## ✅ What Was Fixed

### 1. **Enhanced Azure AD Email Directory API** (`src/app/api/email-directory/route.ts`)

**Improvements:**
- ✅ **Better error handling** - More detailed error messages with helpful tips
- ✅ **Enhanced logging** - Detailed logs for debugging token acquisition and Graph API calls
- ✅ **Improved data transformation** - Added fallback fields (`userPrincipalName`, `office`, `companyName`)
- ✅ **Better error messages** - Specific guidance for 403 errors (missing permissions)
- ✅ **Token validation** - Checks if access token exists before using it

**Key Changes:**
```typescript
// Before: Basic error handling
if (!tokenResponse.ok) {
  console.error("Failed to get token");
  return null;
}

// After: Detailed error handling with helpful messages
if (!tokenResponse.ok) {
  const errorData = await tokenResponse.json().catch(() => ({}));
  console.error("[email-directory] ❌ Failed to get Azure AD token");
  console.error("[email-directory] Status:", tokenResponse.status);
  console.error("[email-directory] Error:", JSON.stringify(errorData, null, 2));
  
  if (tokenResponse.status === 401) {
    console.error("[email-directory] 💡 Check: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID are correct");
  } else if (tokenResponse.status === 400) {
    console.error("[email-directory] 💡 Check: Client secret might be expired or incorrect");
  }
  return null;
}
```

### 2. **Graph API Query Enhancement**

**Added more fields:**
- `id` - User ID
- `userPrincipalName` - Fallback email
- `office` - Office location (fallback)
- `companyName` - Company name

**Better error handling for 403:**
```typescript
if (graphResponse.status === 403) {
  console.error("[email-directory] 💡 403 Forbidden: Check if 'User.Read.All' Application permission is granted with admin consent");
  console.error("[email-directory] 💡 Go to Azure Portal → App registrations → API permissions → Add permission → Microsoft Graph → Application permissions → User.Read.All → Grant admin consent");
}
```

---

## ⚠️ IMPORTANT: Required Azure Permission

### Current Status (from screenshot):
- ✅ `email` (Delegated)
- ✅ `openid` (Delegated)
- ✅ `profile` (Delegated)
- ✅ `User.Read` (Delegated)
- ❌ **MISSING: `User.Read.All` (Application permission)**

### Why You Need `User.Read.All`:

The code uses **client credentials flow** (server-to-server authentication), which requires **Application permissions**, not Delegated permissions.

**Delegated permissions** = User signs in, app acts on behalf of user
**Application permissions** = App acts on its own (no user sign-in needed)

### How to Add `User.Read.All`:

1. **Go to Azure Portal** → **App registrations** → Your app
2. **Click "API permissions"**
3. **Click "Add a permission"**
4. **Select "Microsoft Graph"**
5. **Select "Application permissions"** (NOT Delegated!)
6. **Search for "User.Read.All"**
7. **Check the box** and click **"Add permissions"**
8. **Click "Grant admin consent for [Your Organization]"** (requires admin privileges)

---

## 🔍 How to Test

### 1. Check Environment Variables

Make sure `.env.local` has:
```env
AZURE_CLIENT_ID=your-client-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 2. Test Email Directory API

**Option A: Using Browser/Postman**
```
GET http://localhost:3000/api/email-directory?email=user@mseuf.edu.ph
```

**Option B: Check Terminal Logs**
When you use the registration page or participant confirmation, check terminal for:
```
[email-directory] ✅ Azure AD token acquired successfully
[email-directory] ✅ User found in Azure AD: user@mseuf.edu.ph
```

### 3. Common Errors and Solutions

#### Error: `403 Forbidden`
**Solution:** Add `User.Read.All` Application permission and grant admin consent

#### Error: `401 Unauthorized`
**Solution:** Check if `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `AZURE_TENANT_ID` are correct

#### Error: `400 Bad Request`
**Solution:** Client secret might be expired - create a new one in Azure Portal

#### Error: `404 Not Found`
**Solution:** User email doesn't exist in Azure AD (this is normal, will use fallback)

---

## 📊 Supabase Schema Status

### ✅ Already Correct:
- `users` table has `department_id` (UUID FK to `departments`)
- `users` table has `role` column
- `users` table has `is_admin` column
- Foreign key relationship exists: `users.department_id → departments.id`

### No Changes Needed:
The Supabase schema is already correct for Azure AD integration. The email directory API just retrieves data from Azure AD and uses it to populate user registration/confirmation forms.

---

## 🎯 Summary of Changes

1. ✅ **Enhanced error handling** in Azure AD integration
2. ✅ **Better logging** for debugging
3. ✅ **Improved data transformation** with fallback fields
4. ✅ **Helpful error messages** with specific guidance
5. ✅ **Token validation** before use
6. ✅ **Documentation** updated with permission requirements

---

## 🚀 Next Steps

1. **Add `User.Read.All` Application permission** in Azure Portal
2. **Grant admin consent** for the permission
3. **Restart dev server** (`pnpm dev`)
4. **Test** by registering a new user or confirming a participant invitation
5. **Check terminal logs** to see if Azure AD lookup is working

---

## 📝 Notes

- The code will **automatically fallback** to simulated directory if Azure AD is not configured or fails
- This means the system will still work even if Azure AD is not set up
- Once Azure AD is properly configured, it will automatically use real data from Azure AD

