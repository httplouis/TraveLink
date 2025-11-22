# 📧 Paano i-Change ang Sender Email (Custom Domain)

## 🎯 Goal

Gusto mong palitan ang `onboarding@resend.dev` ng custom email like `noreply@travilink.mseuf.edu.ph` o `noreply@mseuf.edu.ph`.

---

## ✅ Step 1: Verify Domain sa Resend

### Option A: Use MSEUF Domain (Recommended)

1. **Go to Resend Dashboard:**
   - Login sa [https://resend.com](https://resend.com)
   - Go to **Domains** section

2. **Add Domain:**
   - Click **Add Domain**
   - Enter: `mseuf.edu.ph` (or `travilink.mseuf.edu.ph` if subdomain)
   - Click **Add**

3. **Add DNS Records:**
   Resend will show you DNS records na need mo i-add:
   
   **Example DNS Records:**
   ```
   Type: TXT
   Name: @
   Value: resend-verification=abc123...
   
   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   
   Type: CNAME
   Name: resend
   Value: resend.net
   ```

4. **Add sa Domain Registrar:**
   - Go to your domain registrar (where you manage `mseuf.edu.ph`)
   - Add the DNS records Resend provided
   - Wait for verification (usually 5-30 minutes)

5. **Verify:**
   - Go back to Resend dashboard
   - Wait for status to change to **"Verified"** ✅

---

### Option B: Use Resend's Test Domain (Quick Test)

Kung hindi mo pa ma-verify ang domain, pwede mo gamitin:
- `onboarding@resend.dev` (current - no verification needed)
- `delivered@resend.dev` (alternative)

**Pero limited lang ang emails per day sa test domain.**

---

## ✅ Step 2: Update `.env.local`

After ma-verify ang domain, update `.env.local`:

```bash
# Development
EMAIL_FROM=noreply@travilink.mseuf.edu.ph
# OR
EMAIL_FROM=noreply@mseuf.edu.ph

# Production (sa Vercel)
# Set this sa Vercel Environment Variables
EMAIL_FROM=noreply@mseuf.edu.ph
```

---

## ✅ Step 3: Update Code (Optional - Already Done!)

The code already uses `EMAIL_FROM` from environment variables:

```typescript
// src/lib/email.ts
const fromEmail = from || process.env.EMAIL_FROM || "noreply@travilink.mseuf.edu.ph";
```

So just update `.env.local` lang!

---

## ✅ Step 4: Restart Dev Server

```bash
# Stop (Ctrl+C)
pnpm dev
```

---

## ✅ Step 5: Test

1. **Send invitation**
2. **Check email** - dapat ang sender ay `noreply@mseuf.edu.ph` (or whatever you set)

---

## 📝 For Production (Vercel)

1. **Go to Vercel Dashboard:**
   - Select your project
   - Go to **Settings** → **Environment Variables**

2. **Add:**
   ```
   EMAIL_FROM = noreply@mseuf.edu.ph
   ```

3. **Redeploy** - Vercel will automatically use the new value

---

## ⚠️ Important Notes

1. **Domain Verification Required:**
   - Hindi mo pwedeng gamitin ang `@mseuf.edu.ph` kung hindi verified sa Resend
   - Need mo ng access sa domain DNS settings

2. **Email Limits:**
   - Test domains (`@resend.dev`) - limited emails
   - Verified domains - higher limits (depends on plan)

3. **SPF/DKIM Records:**
   - Resend automatically sets these up
   - Pero make sure na-add mo lahat ng DNS records na sinabi nila

---

## 🆘 Troubleshooting

### "Domain not verified" Error

**Fix:**
- Check DNS records - dapat lahat naka-add na
- Wait 30 minutes for DNS propagation
- Check Resend dashboard for verification status

### "Email not sending"

**Fix:**
- Make sure domain is verified
- Check `EMAIL_FROM` in `.env.local`
- Restart dev server

---

**After ma-verify ang domain, update mo lang `.env.local` and restart!** 🚀

