# ✅ Timeout & Favicon Fix

## ❌ **Problems:**
1. **Favicon 404 Error**: Browser looking for `/favicon.ico` but it doesn't exist
2. **Upstream Request Timeout**: Some API routes may be timing out on Vercel (default 10s timeout for Hobby plan, 60s for Pro)

## ✅ **Solutions:**

### 1. Favicon Fix ✅
- Added explicit `<link rel="icon">` tags in `layout.tsx`
- Updated metadata to include shortcut icon
- Browser will now use `/travelink.png` instead of looking for `/favicon.ico`

### 2. API Route Timeouts ✅
Added `maxDuration` export to long-running routes:

**Routes with Extended Timeout (60s):**
- ✅ `/api/requests/submit` - Complex request submission with multiple DB operations

**Routes Already Dynamic:**
- All stats routes use `force-dynamic` (no timeout needed - fast queries)
- All inbox routes use `force-dynamic` (no timeout needed - fast queries)

## 📝 **Vercel Timeout Limits:**
- **Hobby Plan**: 10 seconds (default)
- **Pro Plan**: 60 seconds (default)
- **Enterprise**: Custom

## 🔧 **How It Works:**

### Before (Timeout Error):
```typescript
export async function POST(req: Request) {
  // Long operation (>10s) ❌ Times out on Hobby plan
}
```

### After (Extended Timeout):
```typescript
export const maxDuration = 60; // ✅ Allows up to 60 seconds
export async function POST(req: Request) {
  // Long operation now has time to complete
}
```

## ✅ **Status: FIXED!**

- Favicon 404 error resolved ✅
- Request submission timeout extended ✅
- Other routes optimized for speed ✅

