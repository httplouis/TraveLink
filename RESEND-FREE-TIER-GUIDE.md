# 📧 Resend Free Tier Guide - Paano Mag-Send ng Emails

## 🎯 Current Situation

**Free Tier Limitations:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ⚠️ Can only send to **verified recipients** OR **verified domain**

## ✅ Solution 1: Verify Domain (BEST OPTION)

### Kung may access ka sa DNS ng MSEUF:

1. **Go to Resend Dashboard:**
   - Login sa [https://resend.com](https://resend.com)
   - Go to **Domains** section (left sidebar)
   - Click **Add Domain**

2. **Add Domain:**
   - Enter: `mseuf.edu.ph` (main domain)
   - OR: `student.mseuf.edu.ph` (subdomain)
   - Click **Add**

3. **Add DNS Records:**
   Resend will show you DNS records na need mo i-add sa Cloudflare/DNS provider:
   
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

4. **Add sa DNS Provider:**
   - Go to Cloudflare (or your DNS provider)
   - Add all DNS records Resend provided
   - Wait 5-30 minutes for DNS propagation

5. **Verify:**
   - Go back to Resend dashboard
   - Wait for status to change to **"Verified"** ✅

6. **Update `.env.local`:**
   ```bash
   EMAIL_FROM=noreply@mseuf.edu.ph
   # OR
   EMAIL_FROM=noreply@student.mseuf.edu.ph
   ```

**Result:** ✅ Can send to ANY email address under that domain (unlimited!)

---

## ✅ Solution 2: Use Your Account Email (FOR TESTING ONLY)

### ⚠️ IMPORTANT: Resend Free Tier Limitations

**Current Resend Free Tier:**
- ❌ **NO "Add Recipient" option** - This feature doesn't exist in free tier
- ✅ Can only send to **your account email** (the one you used to sign up)
- ✅ Can send to **any email** IF you verify a domain

### Kung wala kang access sa DNS (Testing Only):

**Option A: Test with Your Account Email**
- Use your Resend account email (e.g., `joselouis.rosales.cdscdb@gmail.com`)
- This is automatically verified
- Good for testing the email functionality
- ⚠️ Limited - can only send to this one email

**Option B: Upgrade to Paid Plan**
- Paid plans allow more flexibility
- But still need to verify domain for best results

**Option C: Use Console Logging (Development)**
- If `RESEND_API_KEY` is not set, emails are logged to console
- Good for development/testing without sending real emails
- Check terminal/console for email content

**Option D: Multiple Resend Accounts (NOT RECOMMENDED)**
- Create separate Resend account for each email (e.g., one for `a22-34976@student.mseuf.edu.ph`)
- Each account gets its own API key
- ⚠️ **Problem:** Code can only use ONE API key at a time
- ⚠️ **Problem:** Need to switch API keys manually or update code to support multiple
- ⚠️ **Problem:** Very complicated and not scalable
- ✅ **Better:** Just verify the domain instead!

---

## ✅ Solution 3: Use Test Domain (CURRENT - FOR TESTING)

**Current Setup:**
- Using `onboarding@resend.dev` (Resend's test domain)
- Can send to verified recipients only
- Good for development/testing

**Limitations:**
- ⚠️ Can only send to verified recipients
- ⚠️ Limited functionality

---

## 🎯 Recommendation

**Best Option:** Verify the domain (`@mseuf.edu.ph` or `@student.mseuf.edu.ph`)
- ✅ Unlimited emails to any address under that domain
- ✅ Professional email address
- ✅ Better deliverability
- ✅ No need to verify each email one by one

**If no domain access:** 
- ⚠️ Can only send to your account email (the one you used to sign up)
- ⚠️ No way to add individual verified recipients in free tier
- ✅ Best solution: Verify domain OR upgrade to paid plan

**For testing:** Current setup with test domain works fine

---

## 📝 Current Code Status

The code already handles:
- ✅ Auto-fallback to test domain if custom domain not verified
- ✅ Error handling for unverified recipients
- ✅ Console logging for development (if no API key)

**No code changes needed** - just need to verify domain or recipients in Resend Dashboard!

