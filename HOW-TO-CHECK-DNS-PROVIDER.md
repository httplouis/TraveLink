# 🔍 Paano Malaman kung Anong DNS Provider

## Method 1: Check DNS Nameservers (Easiest)

### Step 1: Open Command Prompt or PowerShell

**Windows:**
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

### Step 2: Run This Command

```bash
nslookup -type=NS mseuf.edu.ph
```

**Or:**
```bash
nslookup mseuf.edu.ph
```

### Step 3: Look for Nameservers

Makikita mo ang nameservers, halimbawa:
```
nameserver = ns1.cloudflare.com
nameserver = ns2.cloudflare.com
```
→ **Cloudflare** ang DNS provider

```
nameserver = ns1.google.com
nameserver = ns2.google.com
```
→ **Google Domains** ang DNS provider

```
nameserver = dns1.registrar-servers.com
```
→ **Domain Registrar** mismo (GoDaddy, Namecheap, etc.)

---

## Method 2: Online Tools (No Command Needed)

### Option A: What's My DNS
1. Go to: https://www.whatsmydns.net/
2. Enter: `mseuf.edu.ph`
3. Click "NS" (Nameservers)
4. Makikita mo ang nameservers

### Option B: MXToolbox
1. Go to: https://mxtoolbox.com/
2. Enter: `mseuf.edu.ph`
3. Click "DNS Lookup"
4. Check "Nameservers" section

---

## Method 3: Check Domain Registrar

### Kung alam mo kung saan mo binili/register ang domain:

**Common Registrars:**
- **GoDaddy** → Usually `dns1.registrar-servers.com`
- **Namecheap** → Usually `dns1.registrar-servers.com`
- **Google Domains** → `ns-cloud-*.googledomains.com`
- **Cloudflare** → `ns1.cloudflare.com`, `ns2.cloudflare.com`
- **AWS Route 53** → `ns-*.awsdns-*.com`
- **Name.com** → `dns1.registrar-servers.com`

**Check mo:**
1. Login sa domain registrar account mo
2. Go to "DNS Settings" or "Nameservers"
3. Makikita mo doon kung saan naka-point

---

## Method 4: Ask IT Department

Kung **MSEUF** ang may-ari ng domain:
- Ask IT department kung saan naka-host ang DNS
- Sila ang may access sa DNS settings

---

## Common DNS Providers & How to Identify

### Cloudflare
- Nameservers: `ns1.cloudflare.com`, `ns2.cloudflare.com`
- **Easy:** May "Sign in to Cloudflare" button sa Resend

### Google Domains / Google Cloud DNS
- Nameservers: `ns-cloud-*.googledomains.com`
- **Manual:** Need to add DNS records manually

### GoDaddy / Namecheap / Other Registrars
- Nameservers: `dns1.registrar-servers.com` or similar
- **Manual:** Need to add DNS records manually

### AWS Route 53
- Nameservers: `ns-*.awsdns-*.com`
- **Manual:** Need to add DNS records manually

---

## Quick Test

**Run this sa terminal:**
```bash
nslookup -type=NS mseuf.edu.ph
```

**Or sa browser:**
- Go to: https://www.whatsmydns.net/#NS/mseuf.edu.ph

---

## After Knowing Your DNS Provider

### If Cloudflare:
✅ Click "Sign in to Cloudflare" sa Resend
✅ Automatic na mag-add ng DNS records

### If Other Provider:
✅ Click "Manual setup" sa Resend
✅ Copy DNS records
✅ Add manually sa DNS settings

---

**Try mo muna yung `nslookup` command para malaman!** 🔍

