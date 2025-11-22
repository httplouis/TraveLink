# 🔐 Azure AD Permission Explanation

## ❓ Bakit Kailangan ng `User.Read.All`?

### Short Answer:
**`User.Read` (Delegated)** = Pwede lang basahin ang profile ng **signed-in user** (yung user mismo)
**`User.Read.All` (Application)** = Pwede basahin ang profile ng **kahit sinong user** (walang sign-in needed)

---

## 📋 Use Cases sa TraviLink:

### 1. **Participant Confirmation** 
- Participant receives email invitation
- Clicks confirmation link
- **Hindi pa sila signed-in** sa app
- Pero kailangan natin i-lookup ang name, department, jobTitle nila from Azure AD
- **Kailangan:** `User.Read.All` (Application) kasi walang signed-in user

### 2. **Registration**
- User nagta-type ng email (e.g., `faculty@mseuf.edu.ph`)
- System needs to lookup that email in Azure AD
- **Kailangan:** `User.Read.All` (Application) kasi hindi pa yun ang signed-in user

### 3. **If User.Read (Delegated) lang:**
- ✅ Pwede basahin ang **signed-in user's own profile**
- ❌ **Hindi** pwede basahin ang profile ng ibang users
- ❌ **Hindi** pwede mag-lookup ng email ng ibang tao

---

## 🔍 Technical Details:

### Current Code Uses: **Client Credentials Flow**
```typescript
grant_type: "client_credentials"
scope: "https://graph.microsoft.com/.default"
```

**Client Credentials Flow:**
- Server-to-server authentication
- **No user sign-in** required
- **Requires Application permissions** (not Delegated)

**Why Client Credentials?**
- Participant confirmation page = public (no login)
- Registration page = user not yet logged in
- Need to lookup ANY user's email, not just signed-in user

---

## ✅ Solution Options:

### Option 1: Add `User.Read.All` (Application Permission) ✅ RECOMMENDED
1. Azure Portal → App registrations → Your app
2. API permissions → Add a permission
3. Microsoft Graph → **Application permissions** (NOT Delegated!)
4. Search "User.Read.All" → Add
5. **Grant admin consent**

**Pros:**
- Works for all use cases
- No user sign-in needed
- Can lookup any user's email

**Cons:**
- Requires admin consent
- More privileged permission

---

### Option 2: Use Delegated Flow (Alternative)
**If you want to use `User.Read` (Delegated) only:**

**Problem:** Hindi gagana sa:
- Participant confirmation (no sign-in)
- Registration (user not logged in yet)

**Would only work if:**
- User is already signed in to the app
- And we're looking up their OWN profile

**Not suitable for our use cases** ❌

---

## 🧪 Testing:

### Test with Current Setup:
1. Try participant confirmation → Check terminal logs
2. If you see `403 Forbidden` → Need `User.Read.All`
3. If you see `✅ User found` → Working! (may `User.Read.All` na)

### Check Current Permissions:
1. Azure Portal → App registrations → Your app
2. API permissions
3. Look for:
   - ✅ `User.Read.All` (Application) = Good!
   - ❌ Only `User.Read` (Delegated) = Need to add `User.Read.All`

---

## 📝 Summary:

| Permission | Type | Can Read | Use Case |
|------------|------|----------|----------|
| `User.Read` | Delegated | Signed-in user only | User viewing own profile |
| `User.Read.All` | Application | Any user | Lookup any email (our use case) |

**For TraviLink:** We need `User.Read.All` (Application) because we lookup OTHER users' emails (participants, registration), not just the signed-in user.

---

## 💡 If Classmate's Setup Works:

**Possible reasons:**
1. ✅ They have `User.Read.All` (Application) - not shown in screenshot
2. ✅ They granted admin consent
3. ✅ Their Azure admin already set it up

**Check their Azure Portal:**
- Go to their app → API permissions
- Look for "Application permissions" section
- Should see `User.Read.All` there

---

## 🎯 Bottom Line:

**Yes, name, department, jobTitle are in the profile** ✅

**But we need `User.Read.All` (Application) to read OTHER users' profiles** (not just signed-in user)

**`User.Read` (Delegated) is not enough** for our use cases ❌

