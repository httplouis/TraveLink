# 📝 Paano i-Setup ang `.env.local` File

## ✅ File Created!

Na-create na ang `.env.local` file sa project root (same level as `package.json`).

---

## 📍 Location

Ang `.env.local` file ay nasa:
```
TraviLink/
├── .env.local          ← DITO!
├── package.json
├── src/
└── ...
```

---

## 🔧 Paano i-Edit

### Option 1: Using VS Code / Cursor
1. **Open** `.env.local` file sa editor
2. **Replace** yung values:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here
   ```

### Option 2: Using Notepad
1. **Right-click** `.env.local` file
2. **Open with** → Notepad
3. **Edit** yung values
4. **Save**

---

## 📧 Para sa Email (Resend API Key)

### Step 1: Get API Key
1. Go to [https://resend.com](https://resend.com)
2. **Sign up** (free - 100 emails/day)
3. Go to **API Keys** → **Create API Key**
4. **Copy** the key (starts with `re_...`)

### Step 2: Add to `.env.local`
Open `.env.local` and add:
```bash
RESEND_API_KEY=re_your_actual_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=onboarding@resend.dev
```

### Step 3: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
pnpm dev
```

---

## ⚠️ Important Notes

1. **DON'T commit `.env.local` to git** - it contains sensitive keys!
2. **Restart dev server** after editing `.env.local`
3. **Check terminal** for email logs (not browser console)

---

## 🧪 Testing

### Without API Key (Development):
- Emails logged sa **TERMINAL** only
- Check terminal pagkatapos mag-send ng invitation

### With API Key (Production):
- Real emails sent to Gmail
- Check inbox (and spam folder!)

---

## 📝 Example `.env.local` Content

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email (Optional)
RESEND_API_KEY=re_abc123def456...
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=onboarding@resend.dev
```

---

**Need help?** Check `EMAIL-SETUP.md` for detailed email setup instructions.

