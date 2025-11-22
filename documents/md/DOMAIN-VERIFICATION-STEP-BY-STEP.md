# 🔐 Step-by-Step: Domain Verification sa Resend

## 📋 Overview

Para makapag-send ng emails sa **LAHAT** ng email addresses (including @mseuf.edu.ph at @student.mseuf.edu.ph), kailangan mong i-verify ang domain sa Resend.

---

## 🚀 Step 1: Login sa Resend Dashboard

1. Pumunta sa [https://resend.com](https://resend.com)
2. **Login** sa account mo
3. Kung wala pa, **Sign up** (free - 100 emails/day)

---

## 🚀 Step 2: Add Domain

1. Sa left sidebar, click **"Domains"**
2. Click **"Add Domain"** button (sa top right)
3. Enter domain name:
   - **Option A:** `mseuf.edu.ph` (main domain)
   - **Option B:** `travilink.mseuf.edu.ph` (subdomain - mas recommended)
4. Click **"Add"**

---

## 🚀 Step 3: Get DNS Records

Pagkatapos mag-add ng domain, makikita mo ang listahan ng DNS records na kailangan mong i-add:

### Typical DNS Records:

**1. Domain Verification (TXT)**
```
Type: TXT
Name: @
Value: resend-verification=abc123xyz...
TTL: 3600 (or default)
```

**2. DKIM (TXT)**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
TTL: 3600
```

**3. SPF (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com include:_spf.resend.com ~all
TTL: 3600
```

**4. DMARC (TXT) - Optional pero recommended**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@mseuf.edu.ph
TTL: 3600
```

**5. MX Record (for receiving emails) - Optional**
```
Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
TTL: 3600
```

---

## 🚀 Step 4: Add DNS Records sa Domain Registrar

### Kung saan i-add:

**Kailangan mong malaman:**
- **Sino ang nagma-manage ng DNS ng `mseuf.edu.ph`?**
  - IT Department ng MSEUF?
  - Cloudflare?
  - Other DNS provider?

### Common DNS Providers:

**A. Cloudflare:**
1. Login sa [cloudflare.com](https://cloudflare.com)
2. Select domain `mseuf.edu.ph`
3. Go to **DNS** section
4. Click **"Add record"**
5. Add each record (Type, Name, Value, TTL)
6. Click **"Save"**

**B. cPanel/Hosting Provider:**
1. Login sa hosting control panel
2. Go to **DNS Management** or **Zone Editor**
3. Add each record
4. Save

**C. Domain Registrar (GoDaddy, Namecheap, etc.):**
1. Login sa registrar account
2. Go to **DNS Management**
3. Add each record
4. Save

---

## 🚀 Step 5: Wait for DNS Propagation

1. **DNS propagation** usually takes **5-30 minutes**
2. Minsan umaabot ng **24 hours** (rare)
3. Pwede mong i-check kung propagated na:
   - Use [https://dnschecker.org](https://dnschecker.org)
   - Enter domain: `mseuf.edu.ph`
   - Check TXT records

---

## 🚀 Step 6: Verify sa Resend Dashboard

1. **Go back** sa Resend dashboard
2. **Refresh** ang Domains page
3. **Check status:**
   - ⏳ **Pending** - DNS records pa lang na-add, waiting for verification
   - ✅ **Verified** - Domain verified na! Pwede na mag-send
   - ❌ **Failed** - May problema sa DNS records, check ulit

4. Kung **Failed:**
   - Check kung tama ang DNS records
   - Wait ulit ng 30 minutes
   - Check Resend dashboard for error messages

---

## 🚀 Step 7: Update Environment Variables

Pagkatapos ma-verify:

1. **Update `.env.local`:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@mseuf.edu.ph
   # OR kung subdomain ginamit mo:
   # EMAIL_FROM=noreply@travilink.mseuf.edu.ph
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   pnpm dev
   ```

---

## 🚀 Step 8: Test Email Sending

1. **Send invitation** sa seminar application form
2. **Check recipient's inbox** (at spam folder)
3. **Check Resend dashboard** → **Emails** section para makita ang delivery status

---

## ⚠️ Important Notes

### Kung Hindi Mo Maa-access ang DNS:

**Option 1: Ask IT Department**
- Contact MSEUF IT Department
- Request na i-add ang DNS records
- Provide mo ang exact records from Resend

**Option 2: Use Subdomain**
- Pwede mong i-verify ang subdomain (e.g., `travilink.mseuf.edu.ph`)
- Mas madali kung may access ka sa subdomain DNS

**Option 3: Use Test Domain (Temporary)**
- Gamitin ang `onboarding@resend.dev` (current setup)
- Pwede mag-send sa verified email mo lang
- For testing purposes

---

## 🔍 Troubleshooting

### "Domain verification failed"

**Check:**
1. ✅ Tama ba ang DNS records?
2. ✅ Na-add na ba sa DNS provider?
3. ✅ Wait ka ng at least 30 minutes
4. ✅ Check Resend dashboard for specific error

### "Still can't send emails"

**Check:**
1. ✅ Domain status = **Verified** ✅?
2. ✅ `EMAIL_FROM` uses verified domain?
3. ✅ Restart dev server after updating `.env.local`?
4. ✅ Check Resend dashboard → Emails section for errors

### "DNS records not showing"

**Wait longer:**
- DNS propagation can take up to 24 hours
- Use [dnschecker.org](https://dnschecker.org) to check if records are live

---

## 📞 Need Help?

Kung may problema:
1. **Check Resend dashboard** for error messages
2. **Check DNS records** using dnschecker.org
3. **Contact IT Department** kung kailangan ng access sa DNS

---

## ✅ After Verification

Once verified:
- ✅ Pwede na mag-send sa **LAHAT** ng email addresses
- ✅ Pwede na mag-send sa `@mseuf.edu.ph`
- ✅ Pwede na mag-send sa `@student.mseuf.edu.ph`
- ✅ Pwede na mag-send sa `@gmail.com`, etc.
- ✅ No more restrictions!

---

**Good luck! 🚀**

