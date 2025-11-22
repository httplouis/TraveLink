# 🔍 Paano i-Check kung Naload ang Environment Variables

## ⚠️ Problem

Nakikita sa terminal:
```
[sendEmail] 🔑 API Key check: ❌ Not found (will use console logging)
```

Ibig sabihin, hindi nababasa ang `RESEND_API_KEY` mula sa `.env.local`.

---

## ✅ Solutions

### Solution 1: Restart Dev Server (IMPORTANT!)

**Next.js ay hindi auto-reload ang `.env.local` changes!**

1. **Stop** ang dev server (Ctrl+C sa terminal)
2. **Restart**:
   ```bash
   pnpm dev
   ```
3. **Test ulit** - dapat may `✅ Found` na

---

### Solution 2: Check `.env.local` Format

Make sure ang format ay correct:

```bash
# ✅ CORRECT
RESEND_API_KEY=re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg

# ❌ WRONG (may spaces)
RESEND_API_KEY = re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg

# ❌ WRONG (may quotes)
RESEND_API_KEY="re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg"
```

**Important:**
- ✅ No spaces around `=`
- ✅ No quotes needed
- ✅ No trailing spaces

---

### Solution 3: Verify File Location

Ang `.env.local` dapat nasa **project root** (same level as `package.json`):

```
TraviLink/
├── .env.local          ← DITO!
├── package.json
├── src/
└── ...
```

---

### Solution 4: Check File Name

Make sure ang file name ay **exactly** `.env.local`:
- ✅ `.env.local` (correct)
- ❌ `env.local` (missing dot)
- ❌ `.env` (different file)
- ❌ `.env.local.txt` (wrong extension)

---

### Solution 5: Add Debug Logging

Temporarily add this sa `src/lib/email.ts` to check:

```typescript
console.log("[sendEmail] 🔍 Environment check:");
console.log("  - RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log("  - RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length || 0);
console.log("  - RESEND_API_KEY starts with 're_':", process.env.RESEND_API_KEY?.startsWith('re_'));
```

---

## 🧪 Quick Test

1. **Stop dev server** (Ctrl+C)
2. **Check `.env.local`** - make sure `RESEND_API_KEY=re_...` is there
3. **Restart dev server**: `pnpm dev`
4. **Send invitation** ulit
5. **Check terminal** - dapat may:
   ```
   [sendEmail] 🔑 API Key check: ✅ Found
   [sendEmail] ✅ Email sent to email@example.com
   [sendEmail] 📧 Resend Email ID: abc123...
   ```

---

## 📝 Common Mistakes

1. **Forgot to restart** - Most common! Next.js doesn't auto-reload `.env.local`
2. **Wrong file location** - Should be in project root
3. **Spaces in value** - `RESEND_API_KEY = value` (wrong) vs `RESEND_API_KEY=value` (correct)
4. **Quotes around value** - Not needed for simple strings
5. **File not saved** - Make sure you saved the file after editing

---

## ✅ Success Indicators

After fixing, you should see in terminal:
```
[sendEmail] 🔑 API Key check: ✅ Found
[sendEmail] ✅ Email sent to email@example.com
[sendEmail] 📧 Resend Email ID: abc123def456...
[sendEmail] 📧 Check delivery status at: https://resend.com/emails/abc123...
```

And in Resend dashboard:
- Email appears in "Emails" → "Sending" tab
- Shows delivery status (sent, delivered, etc.)

---

**Most likely issue: Dev server wasn't restarted after adding RESEND_API_KEY!**

