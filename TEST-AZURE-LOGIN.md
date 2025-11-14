# ✅ AZURE LOGIN - TESTING GUIDE

## 🎯 Next Steps: Test the Login!

### Step 1: Restart Dev Server
1. **Stop current server:**
   - Press `Ctrl+C` in terminal
   
2. **Start server again:**
   ```bash
   pnpm dev
   ```

### Step 2: Test Login
1. **Open browser:** `http://localhost:3000/login`
2. **Click "Sign in with Microsoft"**
3. **Should redirect to Microsoft login page** ✅

### Step 3: Login with Your Account
1. **Enter your institutional email:** `@mseuf.edu.ph`
2. **Enter password**
3. **Complete MFA** (if required)
4. **Should redirect back to your app** ✅

---

## ✅ What Should Happen:

1. **After Microsoft login:**
   - Redirects to: `/api/auth/callback`
   - Fetches profile from Microsoft Graph API
   - Auto-creates user in Supabase `users` table
   - Sets default role: `faculty`
   - Syncs: name, department, jobTitle from Graph API
   - Redirects to appropriate dashboard

2. **User Created:**
   - Email: Your Microsoft email
   - Name: From Graph API (displayName)
   - Department: From Graph API (department)
   - Position: From Graph API (jobTitle)
   - Role: `faculty` (default)
   - Status: `active`

---

## 🧪 Testing Checklist:

- [ ] Dev server restarted
- [ ] Go to `/login` page
- [ ] Click "Sign in with Microsoft"
- [ ] Redirects to Microsoft login (no error!)
- [ ] Login with @mseuf.edu.ph account
- [ ] Redirects back to app
- [ ] User profile shows correct name/department
- [ ] Landed on faculty dashboard (default role)

---

## 🐛 If There Are Errors:

### Error: "Unsupported provider"
- Check: Azure enabled = ON in Supabase
- Restart dev server

### Error: Redirect URI mismatch
- Check: Callback URL added in Azure Portal
- Should be: `https://ysfwjlswuxggegkvbdzn.supabase.co/auth/v1/callback`

### Error: Invalid client
- Check: Client ID and Secret are correct
- Check: Secret not expired

### Error: User not found in Graph API
- Check: User.Read permission in Azure Portal
- Check: User exists in Azure AD

---

## 🎯 Expected Result:

✅ **Success!** You should:
- See Microsoft login page
- Login successfully
- Redirect back to app
- See your profile with name/department
- Land on faculty dashboard

---

**Try mo na! Go to `/login` and click "Sign in with Microsoft"!** 🚀

