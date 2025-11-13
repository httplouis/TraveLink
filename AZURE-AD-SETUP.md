# Azure AD / Microsoft Graph API Setup

## Overview

The TraviLink system now supports automatic retrieval of user information (name, department, position) from Azure Active Directory / Microsoft Graph API when users confirm participant invitations or register.

## Features

1. **Automatic Name/Position Retrieval**: When a participant confirms an invitation using their institutional email, the system automatically retrieves their name, department, and position from Azure AD.

2. **Registration Auto-fill**: During registration, entering an institutional email automatically fills in name and department from Azure AD.

3. **Fallback Support**: If Azure AD is not configured, the system falls back to a simulated directory for development/testing.

## Setup Instructions

### 1. Register App in Azure Portal

**Kung nasa Microsoft Entra ID Overview page ka na (tulad ng screenshot mo):**

1. **Hanapin ang left sidebar** (left side ng screen)
2. **Scroll down** sa left sidebar at hanapin ang **"App registrations"** 
   - May icon na app/document
   - Nasa ilalim ng "Overview", "Monitoring", "Properties", etc.
3. **Click "App registrations"**
4. **Click "+ New registration"** button (top-left, blue button)
5. **Fill in the form:**
   - **Name**: `TraviLink Email Directory`
   - **Supported account types**: Select **"Accounts in this organizational directory only (Single tenant)"**
   - **Redirect URI**: Leave blank (hindi kailangan para sa email directory)
6. Click **"Register"** button (bottom)

---

**Kung hindi ka pa sa Microsoft Entra ID page:**

**Option 1: Search bar (Pinakamabilis)**
1. Sa top search bar (may "Search resources, services, and docs"), type: **"App registrations"**
2. Click sa result na "App registrations"

**Option 2: Hamburger menu**
1. **Hanapin ang hamburger menu (☰)** - nasa **top-left corner** ng Azure portal, sa tabi ng "Microsoft Azure" text
2. Click ang hamburger menu (☰)
3. Scroll down at hanapin **"Microsoft Entra ID"** o **"Azure Active Directory"** sa list
4. Click ito → makikita mo ang left sidebar
5. Sa left sidebar, click **"App registrations"**

### 2. Get Application Credentials

**STEP-BY-STEP VISUAL GUIDE:**

#### Step 1: Pumunta sa App Registration
1. **Sa top search bar** (may "Search resources, services, and docs"), type: **"App registrations"**
2. Click sa result na **"App registrations"**
3. OR: Click sa notification na **"Successfully created application TraviLink Email Directory"** → diretso ka na sa app page

#### Step 2: Hanapin ang "TraviLink Email Directory" app
1. Sa **App registrations** page, makikita mo ang list ng apps
2. **Hanapin at click** ang **"TraviLink Email Directory"** (yung app na ginawa mo)
3. Makikita mo ang **Overview** page ng app

#### Step 3: Kopyahin ang Application (client) ID
1. Sa **Overview** page, scroll down konti
2. Hanapin ang section na may heading **"Essentials"** o **"Application (client) ID"**
3. Makikita mo ang:
   ```
   Application (client) ID
   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  [📋 Copy icon]
   ```
4. **Click ang copy icon (📋)** sa tabi ng ID
5. **Kopyahin ito** → `AZURE_CLIENT_ID`

#### Step 4: Kopyahin ang Directory (tenant) ID
1. Sa **same Overview page**, scroll down pa konti
2. Hanapin ang section na may heading **"Directory (tenant) ID"**
3. Makikita mo ang:
   ```
   Directory (tenant) ID
   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  [📋 Copy icon]
   ```
4. **Click ang copy icon (📋)** sa tabi ng ID
5. **Kopyahin ito** → `AZURE_TENANT_ID`

---

**VISUAL LAYOUT:**
```
┌─────────────────────────────────────────┐
│  App registrations                      │
│  ┌───────────────────────────────────┐  │
│  │ TraviLink Email Directory  [Click] │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓ (Click app)
┌─────────────────────────────────────────┐
│  Overview - TraviLink Email Directory   │
│  ┌───────────────────────────────────┐  │
│  │ Application (client) ID           │  │
│  │ xxxx-xxxx-xxxx-xxxx  [📋 Copy]    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Directory (tenant) ID             │  │
│  │ xxxx-xxxx-xxxx-xxxx  [📋 Copy]    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**QUICK TIP:** 
- Parehong nasa **Overview** page lang ang dalawang IDs
- Scroll down lang konti para makita ang Directory (tenant) ID
- May copy icon (📋) sa tabi ng bawat ID - click mo lang para auto-copy

### 3. Create Client Secret

**Kung nasa Overview page ka pa:**

1. **Sa left sidebar**, hanapin ang **"Certificates & secrets"** (may icon na key/certificate)
2. Click **"Certificates & secrets"**
3. Sa **"Client secrets"** section, click **"+ New client secret"** button
4. Fill in:
   - **Description**: `TraviLink Email Directory API`
   - **Expires**: Select **"24 months"** (recommended)
5. Click **"Add"** button
6. **IMPORTANT**: 
   - Makikita mo ang **"Value"** column sa table
   - **Kopyahin agad ang Value** (yung secret string)
   - ⚠️ **Hindi na ito makikita ulit** pag nag-refresh ka!
   - **Kopyahin ito** → `AZURE_CLIENT_SECRET`

**Tip:** Copy mo agad sa notepad/text file para hindi mawala!

### 4. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Add the following permissions:
   - `User.Read.All` - Read all users' full profiles
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin privileges)

### 5. Add Environment Variables

**STEP-BY-STEP:**

#### Step 1: Hanapin ang `.env.local` file
1. **Open** ang project folder sa File Explorer o VS Code/Cursor
2. **Hanapin** ang `.env.local` file sa **root folder** (same level as `package.json`)
   ```
   TraviLink/
   ├── .env.local          ← DITO!
   ├── package.json
   ├── src/
   └── ...
   ```

#### Step 2: Open ang `.env.local` file
- **Right-click** → **Open with** → Notepad o VS Code/Cursor
- OR: **Double-click** kung naka-associate na sa editor

#### Step 3: Add ang Azure IDs
**Idagdag** sa **bottom** ng file (after ng existing variables):

```env
# Azure AD / Microsoft Graph API
AZURE_CLIENT_ID=paste-your-application-client-id-here
AZURE_TENANT_ID=paste-your-directory-tenant-id-here
AZURE_CLIENT_SECRET=paste-your-client-secret-here
```

**Example:**
```env
# Existing variables (wag galawin)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=onboarding@resend.dev

# Azure AD / Microsoft Graph API (ADD THESE)
AZURE_CLIENT_ID=abc123-def4-5678-90ab-cdef12345678
AZURE_TENANT_ID=ddedb3cc-596d-482b-8e8c-6cc149a7a7b7
AZURE_CLIENT_SECRET=your-secret-here-will-be-added-after-step-3
```

**IMPORTANT:**
- ✅ **No spaces** around `=` sign
- ✅ **No quotes** needed
- ✅ **Replace** `paste-your-...` with actual IDs na kopya mo
- ✅ **Save** ang file (Ctrl+S)

**Note:** 
- `AZURE_CLIENT_SECRET` ay idadagdag mo **after** Step 3 (Create Client Secret)
- For now, add mo lang ang `AZURE_CLIENT_ID` at `AZURE_TENANT_ID`

---

## ✅ AFTER CREATING CLIENT SECRET - Complete Setup

### Step 1: Kopyahin ang Client Secret Value
1. Sa **Certificates & secrets** page, makikita mo ang table ng secrets
2. Hanapin ang **"Value"** column (may secret string)
3. **Kopyahin agad** ang Value (⚠️ hindi na ito makikita ulit!)
4. **Paste** sa `.env.local` file:
   ```env
   AZURE_CLIENT_SECRET=paste-the-secret-value-here
   ```

### Step 2: Grant Admin Consent (IMPORTANT!)
**Nakita ko na may "User.Read.All" permission ka na, pero may yellow warning!**

**WHERE TO FIND THE BUTTON:**

1. **Scroll down** sa "Configured permissions" section
2. **Hanapin ang table** na may columns: "API / Permissions name", "Type", "Description", "Status"
3. **Sa table**, makikita mo ang:
   - "User.Read" (Delegated)
   - "User.Read.All" (Application) - may ⚠️ yellow warning
4. **Sa TOP ng table** (above the table headers), may **TWO buttons**:
   - **"+ Add a permission"** (blue button with plus icon)
   - **"Grant admin consent for Manuel S. Enverga University"** (blue button with checkmark icon) ← **ITO ANG I-CLICK MO!**

**VISUAL GUIDE:**
```
┌─────────────────────────────────────────────────┐
│  Configured permissions                        │
│                                                 │
│  [+ Add a permission]  [✓ Grant admin consent] │ ← DITO!
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ API / Permissions | Type | Status         │ │
│  ├───────────────────────────────────────────┤ │
│  │ User.Read        | Delegated | ✅        │ │
│  │ User.Read.All    | Application | ⚠️      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**STEPS:**
1. **Hanapin ang button** na **"Grant admin consent for Manuel S. Enverga University"** (sa TOP, above the table)
2. **Click** ang button
3. **May popup confirmation** → Click **"Yes"** o **"Accept"**
4. **Wait** for confirmation (may loading indicator)
5. **After successful**, dapat:
   - ✅ Yellow warning triangle → **Green checkmark** ✅
   - ✅ Status: **"Granted for Manuel S. Enverga University"**
   - ✅ Wala na ang warning

---

## ⚠️ PROBLEM: Button ay Grayed-Out / Disabled

**Kung hindi mo ma-click ang "Grant admin consent" button (grayed-out):**

### Reason: Kailangan mo ng Admin Privileges

Ang "Grant admin consent" ay kailangan ng:
- **Global Administrator** role, o
- **Privileged Role Administrator** role, o
- **Application Administrator** role

### Solutions:

#### Option 1: Ask IT Admin / System Administrator
1. **Contact** ang IT Department o System Administrator ng Manuel S. Enverga University
2. **Request** na i-grant ang admin consent para sa "TraviLink Email Directory" app
3. **Provide** ang app name: **"TraviLink Email Directory"**
4. **Tell them** na kailangan ng **"User.Read.All"** permission with admin consent

#### Option 2: Check Your Role
1. **Check** kung may admin role ka:
   - Click sa **user profile icon** (top-right)
   - Check ang **"Roles"** o **"Directory role"**
   - Dapat may **"Global Administrator"** o **"Privileged Role Administrator"**

#### Option 3: Alternative - Use Without Admin Consent (Limited)
**Note:** Kung hindi ma-grant ang admin consent, pwede pa rin gumana ang Azure AD integration, pero:
- ⚠️ **Limited functionality** - hindi lahat ng users makikita
- ⚠️ **May restrictions** sa data access
- ✅ **Pero pwede pa rin** mag-auto-fill ng name at department

**For now, pwede mo na i-test kahit walang admin consent:**
1. Add mo na ang IDs sa `.env.local`
2. Restart server
3. Test kung gumagana (may fallback naman sa simulated directory)

---

## ✅ RECOMMENDED: Contact IT Admin

**Best approach:**
1. **Email or contact** ang IT Department
2. **Request:** "Please grant admin consent for the 'TraviLink Email Directory' application in Azure AD"
3. **Provide details:**
   - App name: TraviLink Email Directory
   - Permission needed: User.Read.All (Application permission)
   - Purpose: Auto-fill user names and departments from Azure AD

**After IT grants consent:**
- Yellow warning → Green checkmark ✅
- Azure AD integration fully functional

**Visual Guide:**
```
Before:
User.Read.All | Application | ⚠️ Not granted for Manuel...

After (after clicking Grant admin consent):
User.Read.All | Application | ✅ Granted for Manuel S. Enverga University
```

**Note:** 
- Kung wala ka pang "User.Read.All" permission, add mo muna:
  1. Click **"+ Add a permission"**
  2. Select **"Microsoft Graph"**
  3. Select **"Application permissions"** (NOT Delegated)
  4. Search: **"User.Read.All"**
  5. Check checkbox → Click **"Add permissions"**
  6. Then grant admin consent (Step 2 above)

### Step 3: Verify Complete Setup
Check mo ang `.env.local` file - dapat may lahat na:
```env
# Azure AD / Microsoft Graph API
AZURE_CLIENT_ID=your-actual-client-id
AZURE_TENANT_ID=your-actual-tenant-id
AZURE_CLIENT_SECRET=your-actual-client-secret
```

### Step 4: Restart Server
**IMPORTANT:** Restart ang dev server para ma-load ang new environment variables:

```bash
# Stop server (Ctrl+C sa terminal)
# Then restart:
pnpm dev
```

### Step 5: Test Azure AD Integration
1. **Test sa Registration:**
   - Go to `/register`
   - Enter institutional email (e.g., `user@mseuf.edu.ph`)
   - Check kung auto-fill ang name at department

2. **Test sa Participant Confirmation:**
   - Send seminar invitation
   - Click confirmation link
   - Check kung auto-fill ang name at department from email

3. **Check Terminal Logs:**
   - Dapat may logs na: `[email-directory] Azure AD lookup successful`
   - O kung may error: `[email-directory] Azure AD lookup error: ...`

---

## 🎉 DONE! Setup Complete

Pagkatapos ng lahat:
- ✅ App registered sa Azure
- ✅ Client ID at Tenant ID copied
- ✅ Client Secret created at copied
- ✅ API Permissions configured
- ✅ Admin consent granted
- ✅ Environment variables added
- ✅ Server restarted

**Azure AD integration ay ready na!** 🚀

## How It Works

### Email Directory API (`/api/email-directory`)

1. **Checks Azure AD first** (if credentials are configured)
   - Gets access token using client credentials flow
   - Queries Microsoft Graph API: `GET /v1.0/users/{email}`
   - Returns: `displayName`, `mail`, `department`, `jobTitle`, `officeLocation`

2. **Falls back to simulated directory** (if Azure AD not configured)
   - Uses hardcoded test data for development

### Participant Confirmation Flow

1. Participant receives invitation email
2. Clicks confirmation link
3. System automatically looks up their email in Azure AD
4. Auto-fills name and department fields
5. Participant can edit if needed, then confirms

### Registration Flow

1. User enters institutional email
2. On blur, system checks email directory
3. If found in Azure AD, auto-fills name and department
4. User completes registration with pre-filled data

## Testing

### Without Azure AD (Development)

The system works without Azure AD configuration. It will use the simulated directory for testing.

### With Azure AD (Production)

1. Ensure all environment variables are set
2. Test with a real institutional email: `user@mseuf.edu.ph`
3. Check server logs for Azure AD lookup results
4. Verify auto-fill works in registration and participant confirmation

## Troubleshooting

### "Azure AD not configured" in logs

- Check that all three environment variables are set
- Restart server after adding variables
- Verify variable names are correct (case-sensitive)

### "User not found in Azure AD"

- Verify the email exists in your Azure AD tenant
- Check that `User.Read.All` permission is granted
- Ensure admin consent was given

### "Failed to get Azure AD token"

- Verify `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `AZURE_TENANT_ID` are correct
- Check that client secret hasn't expired
- Verify app registration is active in Azure Portal

## Security Notes

- **Client Secret**: Never commit `.env.local` to version control
- **Permissions**: Only grant minimum required permissions (`User.Read.All`)
- **HTTPS**: Always use HTTPS in production
- **Token Storage**: Access tokens are not stored, only used for API calls

## API Endpoints

- `GET /api/email-directory?email={email}` - Lookup user by email
  - Returns: `{ ok: true, data: { name, email, department, position }, source: "azure_ad" }`

## Next Steps

1. Set up Azure AD app registration
2. Add environment variables
3. Test with real institutional emails
4. Monitor logs for any errors
5. Grant admin consent for API permissions

