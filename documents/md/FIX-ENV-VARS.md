# 🔧 Fix: Environment Variables Not Loading

## ⚠️ Problem

Terminal shows:
```
RESEND_API_KEY exists: false
RESEND_API_KEY length: 0
EMAIL_FROM: not set
```

Pero may `RESEND_API_KEY` ka na sa `.env.local`!

---

## ✅ Solutions (Try in Order)

### Solution 1: Hard Restart Dev Server

**IMPORTANT:** Next.js minsan hindi nagreload ng `.env.local` kahit nag-restart ka.

1. **Stop** dev server completely (Ctrl+C)
2. **Close** terminal window
3. **Open NEW terminal**
4. **Navigate** to project:
   ```bash
   cd "C:\jolo\College\4th year - 1st sem\CAPSTONE 2\wind\TraviLink"
   ```
5. **Start** dev server:
   ```bash
   pnpm dev
   ```

---

### Solution 2: Verify `.env.local` Location

Make sure ang file ay nasa **project root** (same folder as `package.json`):

```
TraviLink/
├── .env.local          ← DITO dapat!
├── package.json        ← Same level
├── src/
└── ...
```

**Check:**
- Open File Explorer
- Go to project folder
- Make sure `.env.local` is there (not in `src/` or other folders)

---

### Solution 3: Check File Format

Open `.env.local` and verify:

```bash
# ✅ CORRECT FORMAT
RESEND_API_KEY=re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM=onboarding@resend.dev

# ❌ WRONG (may spaces)
RESEND_API_KEY = re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg

# ❌ WRONG (may quotes)
RESEND_API_KEY="re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg"

# ❌ WRONG (may trailing spaces)
RESEND_API_KEY=re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg 
```

**Important:**
- No spaces around `=`
- No quotes
- No trailing spaces
- Each variable on separate line

---

### Solution 4: Verify File is Saved

1. Open `.env.local` in editor
2. Make sure it's **saved** (Ctrl+S)
3. Check file size - dapat may content

---

### Solution 5: Check for Hidden Characters

Minsan may hidden characters na nag-cause ng issue:

1. Open `.env.local` in VS Code/Cursor
2. Check for:
   - BOM (Byte Order Mark) - dapat wala
   - Line endings - dapat LF or CRLF
   - Special characters

---

### Solution 6: Try `.env` Instead

As a test, try creating `.env` file (without `.local`):

1. Copy `.env.local` to `.env`
2. Restart dev server
3. Test if it works

**Note:** `.env` is less secure (might be committed to git), pero for testing lang.

---

### Solution 7: Manual Environment Variable

As last resort, set manually sa terminal:

**Windows PowerShell:**
```powershell
$env:RESEND_API_KEY="re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg"
$env:EMAIL_FROM="onboarding@resend.dev"
pnpm dev
```

**Windows CMD:**
```cmd
set RESEND_API_KEY=re_dS1Ge4w9_FYxV3GkPuAK9tsYkz6yL7Kpg
set EMAIL_FROM=onboarding@resend.dev
pnpm dev
```

---

## 🧪 Test After Fix

After trying solutions above:

1. **Restart dev server**
2. **Send invitation**
3. **Check terminal** - dapat may:
   ```
   [sendEmail] 🔍 Environment check:
     - RESEND_API_KEY exists: true
     - RESEND_API_KEY length: 51
     - RESEND_API_KEY starts with 're_': true
     - EMAIL_FROM: onboarding@resend.dev
   [sendEmail] 🔑 API Key check: ✅ Found
   ```

---

## 📝 Most Common Issue

**90% of the time:** Dev server wasn't properly restarted!

**Solution:**
1. Close terminal completely
2. Open new terminal
3. Navigate to project
4. Run `pnpm dev`

---

**Try Solution 1 first - hard restart usually fixes it!**

