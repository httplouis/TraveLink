# 📋 NEXT_PUBLIC_APP_URL - Complete Explanation

## ❓ Ano ba yung `NEXT_PUBLIC_APP_URL`?

**Simple answer:** Ito yung **MAIN PRODUCTION URL** ng app mo. Ginagamit ito para sa email links para gumana sa mobile devices.

## 🎯 Ano dapat ilagay?

### Option 1: Main Vercel Production URL (Recommended)
```
NEXT_PUBLIC_APP_URL=https://travilink.vercel.app
```
- Ito yung **main production URL** (hindi preview URL)
- Stable - hindi nagbabago kahit mag-redeploy ka
- Set it **ONCE** - hindi mo na kailangan i-update

### Option 2: Custom Domain (If you have one)
```
NEXT_PUBLIC_APP_URL=https://travilink.mseuf.edu.ph
```
- Kung may custom domain ka
- Mas professional looking
- Set it **ONCE** - hindi mo na kailangan i-update

## ❌ HINDI dapat ilagay:

### ❌ Preview URLs (mga URL na may random characters)
```
❌ https://travilink-qxa94cmc7-jose...vercel.app
❌ https://travilink-git-main-username.vercel.app
```
**Bakit?** Kasi nagbabago yan every deployment. Hindi stable.

### ❌ Localhost
```
❌ http://localhost:3000
```
**Bakit?** Hindi gagana sa mobile devices kasi localhost lang yan sa computer mo.

## 🔄 Kailan mo kailangan i-update?

### ✅ Set ONCE lang - hindi mo na kailangan i-update kung:
- ✅ Main production URL ang ginamit mo
- ✅ Custom domain ang ginamit mo
- ✅ Hindi ka nag-change ng domain

### ⚠️ Kailangan i-update kung:
- ⚠️ Nag-change ka ng custom domain
- ⚠️ Nag-migrate ka sa ibang hosting platform

## 🛡️ Fallback System (Automatic)

Kahit hindi mo i-set ang `NEXT_PUBLIC_APP_URL`, may fallback system:

1. **Priority 1:** `NEXT_PUBLIC_APP_URL` (explicit - BEST) ✅
2. **Priority 2:** Request headers (from current request)
3. **Priority 3:** `VERCEL_URL` (auto-set by Vercel)
4. **Priority 4:** localhost (development only)

**Pero:** Para sa email links sa mobile, kailangan mo talaga i-set ang `NEXT_PUBLIC_APP_URL` kasi wala yung request headers pag-click ng user sa email.

## 📱 Bakit importante sa mobile?

**Scenario:**
1. User receives email sa phone
2. Clicks invitation link
3. **Problem:** Kung localhost ang URL → "No server found" ❌
4. **Solution:** Kung production URL ang URL → Gagana! ✅

## ✅ Current Setup Check

Based sa screenshot mo:
- ✅ May `NEXT_PUBLIC_APP_URL` na naka-set
- ⚠️ Pero mukhang preview URL yan (`travilink-qxa94cmc7-jose...`)

### Recommended Action:

1. **Check mo yung main production URL mo:**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Hanapin yung **main production domain** (usually `travilink.vercel.app`)

2. **Update `NEXT_PUBLIC_APP_URL`:**
   - Value: `https://travilink.vercel.app` (or your custom domain)
   - **NOT** preview URLs

3. **Redeploy:**
   - After updating, redeploy para ma-apply

## 🎯 Summary

| Question | Answer |
|----------|--------|
| **Kailangan i-update palagi?** | ❌ Hindi. Set **ONCE** lang |
| **Ano dapat ilagay?** | Main production URL (e.g., `https://travilink.vercel.app`) |
| **Ano HINDI dapat ilagay?** | Preview URLs, localhost |
| **Bakit importante?** | Para gumana email links sa mobile devices |
| **Line 75 sa getBaseUrl.ts?** | Error message lang - hindi mo kailangan baguhin |

## 🚀 Quick Fix

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Edit `NEXT_PUBLIC_APP_URL`
4. Change to: `https://travilink.vercel.app` (or your main production URL)
5. Save
6. Redeploy

**Done!** Hindi mo na kailangan i-update ulit! ✅

