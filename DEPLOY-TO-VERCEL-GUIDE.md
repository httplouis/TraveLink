# 🚀 Deploy TraviLink to Vercel - Complete Guide

## ✅ GOOD NEWS: DATABASE-BASED NA YAN!

**Oo, lahat ng ginawa natin ay database-based na using Supabase!**

- ✅ User authentication via Supabase Auth
- ✅ Requests stored in Supabase `requests` table
- ✅ History tracking in `request_history` table
- ✅ Real-time approvals flow
- ✅ No more mock data!

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **1. Make Sure SQL is Run**

Run these SQL files in Supabase SQL Editor (in order):

```sql
-- 1. Add enum value
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_parent_head';

-- 2. Add requester_name column
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);

-- 3. Add parent department support
-- Run entire ADD-PARENT-HEAD-SUPPORT.sql file

-- 4. Fix request number race condition
-- Run entire FIX-REQUEST-NUMBER-RACE-CONDITION.sql file
```

### **2. Verify Environment Variables**

Check `.env.local` file - you need:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🌐 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Install Vercel CLI**

```bash
npm install -g vercel
```

### **STEP 2: Login to Vercel**

```bash
vercel login
```

This will open browser - login with your account (GitHub, GitLab, Email, etc.)

### **STEP 3: Initialize Project**

```bash
cd "C:\jolo\College\4th year - 1st sem\CAPSTONE 2\wind\TraviLink"
vercel
```

**Questions it will ask:**

```
? Set up and deploy "TraviLink"? [Y/n] 
→ Y

? Which scope do you want to deploy to? 
→ (Select your personal account)

? Link to existing project? [y/N] 
→ N

? What's your project's name? 
→ travilink (or whatever you want)

? In which directory is your code located? 
→ ./ (press enter)

? Want to override the settings? [y/N] 
→ N
```

Vercel will auto-detect it's a Next.js app!

### **STEP 4: Add Environment Variables**

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to "Settings" → "Environment Variables"
4. Add these:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

**Option B: Via CLI**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
→ Paste your Supabase URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
→ Paste your anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY
→ Paste your service role key
```

### **STEP 5: Deploy!**

```bash
vercel --prod
```

This will:
- Build your app
- Upload to Vercel
- Give you a live URL! 🎉

---

## 🧪 TESTING DEPLOYMENT

### **Step 1: Open Deployment URL**

After deploy, you'll get something like:
```
https://travilink-xxxxx.vercel.app
```

### **Step 2: Test Login**

```
Email: faculty.cnahs@mseuf.edu.ph
Password: Faculty@123
```

### **Step 3: Test Submit Request**

1. Go to `/user/request`
2. Fill form
3. Sign
4. Submit
5. ✅ Should save to Supabase!

### **Step 4: Test Head Approval**

```
Email: head.nursing@mseuf.edu.ph
Password: Head@123
```

1. Go to `/head`
2. Click pending request
3. Sign
4. Approve
5. ✅ Should update in database!

### **Step 5: Test Submissions Tracking**

1. Go to `/user/submissions`
2. Click "View Tracking"
3. ✅ Should show history timeline!

---

## 🔧 TROUBLESHOOTING

### **Problem: Build Fails**

**Check build errors:**
```bash
pnpm build
```

Fix TypeScript errors locally first!

### **Problem: Environment Variables Not Working**

**Solution:**
```bash
# Redeploy after adding env vars
vercel --prod
```

### **Problem: 404 on API Routes**

**Solution:** Make sure `src/app/api/` folder structure is correct

### **Problem: Database Connection Fails**

**Solution:** 
1. Check Supabase project is active
2. Verify environment variables
3. Check Supabase URL doesn't have trailing slash

---

## 📊 WHAT'S DATABASE-BASED NOW?

| Feature | Status | Table |
|---------|--------|-------|
| User Login | ✅ Database | `auth.users` + `public.users` |
| Submit Requests | ✅ Database | `public.requests` |
| Head Approvals | ✅ Database | `public.requests` (status updates) |
| History Tracking | ✅ Database | `public.request_history` |
| Submissions List | ✅ Database | `public.requests` (filtered by requester) |
| Departments | ✅ Database | `public.departments` |

**NO MORE MOCK DATA!** Everything is real! 🎉

---

## 🎯 QUICK DEPLOY (1-MINUTE VERSION)

```bash
# 1. Login
vercel login

# 2. Deploy
cd "C:\jolo\College\4th year - 1st sem\CAPSTONE 2\wind\TraviLink"
vercel --prod

# 3. Add environment variables via dashboard
# Go to https://vercel.com/dashboard → Your Project → Settings → Environment Variables

# 4. Redeploy
vercel --prod

# DONE! ✅
```

---

## 🌟 ADVANCED: Custom Domain

### **Step 1: Buy Domain (optional)**

- Namecheap, GoDaddy, etc.
- Or use free `.vercel.app` domain

### **Step 2: Add Domain in Vercel**

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records (Vercel will show you how)

---

## 📝 MAINTENANCE AFTER DEPLOYMENT

### **Update Code & Redeploy:**

```bash
# After making changes locally:
git add .
git commit -m "Update feature"
git push

# Then redeploy:
vercel --prod
```

### **Check Logs:**

```bash
vercel logs
```

Or in Vercel Dashboard → Your Project → Deployments → Click deployment → View Logs

---

## ✅ FINAL CHECKLIST

Before going live to users:

- [ ] SQL migrations run in Supabase
- [ ] Environment variables added in Vercel
- [ ] Test login works
- [ ] Test submit request works
- [ ] Test head approval works
- [ ] Test submissions tracking works
- [ ] Check all pages load (no 404s)
- [ ] Test on mobile browser
- [ ] Check console for errors

---

## 🎉 YOU'RE READY TO DEPLOY!

**Summary:**
1. `vercel login` - Login to Vercel
2. `vercel` - Initialize project
3. Add env vars in dashboard
4. `vercel --prod` - Deploy!
5. Test everything
6. ✅ **LIVE!**

---

## 💡 PRO TIPS

- Use `vercel --prod` for production
- Use `vercel` (without --prod) for preview deployments
- Each `git push` can trigger auto-deploy if you connect GitHub
- Free tier: 100GB bandwidth, unlimited hobby projects
- Deploy time: ~2-3 minutes

---

**KAHIT HANGGANG HEAD PA LANG, PWEDE NA I-DEPLOY!** 🚀

All database operations work! Just make sure:
1. ✅ Supabase is online
2. ✅ SQL migrations run
3. ✅ Env vars correct
4. ✅ Test users exist in database

---

**LET'S DEPLOY! 🎊**
