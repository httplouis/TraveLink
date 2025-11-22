# ✅ ADD REDIRECT URI IN AZURE PORTAL

## 🎯 Step-by-Step: Add Supabase Callback URL

### Step 1: Paste the Callback URL
1. **Sa "Redirect URI" field** (yung may placeholder `e.g. https://example.com/auth`)
2. **Paste this URL:**
   ```
   https://ysfwjlswuxggegkvbdzn.supabase.co/auth/v1/callback
   ```
3. This is the callback URL from Supabase (nakita natin kanina)

### Step 2: Leave Other Fields (Optional)
- **Front-channel logout URL** - Leave empty (optional)
- **Access tokens** checkbox - Leave unchecked
- **ID tokens** checkbox - Leave unchecked

### Step 3: Save
1. **Click "Configure"** button (bottom of modal)
2. Wait for confirmation
3. Modal will close

### Step 4: Verify
1. **Check the list** - Dapat may lalabas na redirect URI
2. Should show: `https://ysfwjlswuxggegkvbdzn.supabase.co/auth/v1/callback`

---

## ✅ After Adding Redirect URI:

### Go Back to Supabase:
1. **Open Supabase Dashboard** → Your project
2. **Authentication** → **Providers** → **Azure**
3. **Turn ON "Azure enabled" toggle** (if hindi pa naka-ON)
4. **Click "Save"**

### Then Test:
1. **Restart dev server:**
   ```bash
   pnpm dev
   ```

2. **Go to:** `http://localhost:3000/login`

3. **Click "Sign in with Microsoft"**

4. **Should redirect to Microsoft login!** ✅

---

## 🎯 Quick Checklist:

- [ ] Redirect URI added in Azure Portal ✅
- [ ] "Azure enabled" toggle ON in Supabase ✅
- [ ] All fields filled in Supabase (Client ID, Secret) ✅
- [ ] Clicked "Save" in Supabase ✅
- [ ] Restarted dev server ✅

---

**Paste mo yung callback URL sa field, then click "Configure"!** 🚀

