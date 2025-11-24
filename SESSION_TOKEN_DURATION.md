# Session Token Duration - Login Session

## Default Supabase Session Settings

### Access Token (JWT)
- **Duration**: **1 hour (3600 seconds)**
- **Purpose**: Used for API requests and authentication
- **Auto-refresh**: Yes, automatically refreshed using refresh token

### Refresh Token
- **Duration**: **30 days (2,592,000 seconds)**
- **Purpose**: Used to get new access tokens when they expire
- **Auto-refresh**: Yes, session stays active as long as user is active

## How It Works

1. **User logs in** → Gets access token (1 hour) + refresh token (30 days)
2. **Access token expires** (after 1 hour) → System automatically uses refresh token to get new access token
3. **User stays logged in** → As long as refresh token is valid (30 days) and user is active
4. **After 30 days of inactivity** → User needs to log in again

## Actual Session Duration

**Effective session duration**: **30 days** (as long as user is active)

- User can stay logged in for up to 30 days
- Access token refreshes automatically every hour
- No need to log in again unless:
  - 30 days of inactivity
  - User manually logs out
  - Session is invalidated

## How to Check/Change Session Duration

### Option 1: Supabase Dashboard
1. Go to **Supabase Dashboard** → Your Project
2. **Authentication** → **Settings** → **JWT Settings**
3. Look for:
   - **JWT expiry**: Default is 3600 seconds (1 hour)
   - **Refresh token expiry**: Default is 2592000 seconds (30 days)

### Option 2: Check Current Settings
Run this SQL in Supabase SQL Editor:

```sql
-- Check JWT settings (if accessible)
SELECT 
  name,
  value
FROM pg_settings
WHERE name LIKE '%jwt%' OR name LIKE '%token%'
ORDER BY name;
```

### Option 3: Check via API
The session object contains `expires_at` field:

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session expires at:', session.expires_at);
console.log('Access token expires in:', (new Date(session.expires_at) - new Date()) / 1000 / 60, 'minutes');
```

## Current Configuration

Based on code analysis:
- **No custom expiration set** → Using Supabase defaults
- **Access token**: 1 hour
- **Refresh token**: 30 days
- **Auto-refresh**: Enabled (default)

## Summary

**Session token duration**: 
- **Access token**: 1 hour (auto-refreshes)
- **Effective session**: 30 days (with auto-refresh)
- **User experience**: Stays logged in for 30 days if active

If you need to change this, you can configure it in Supabase Dashboard → Authentication → Settings → JWT Settings.

