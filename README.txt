===========================================================
                TRAVILINK - ADMIN SYSTEM
===========================================================

📌 About
--------
TraviLink is a SMART Web Application for Scheduling and Tracking
Campus Transport Services. Built with Next.js (App Router),
TypeScript, Tailwind CSS, Supabase, and React components.

This README explains how to set up, install dependencies,
configure environment variables, and run the system.

===========================================================
1. REQUIREMENTS
===========================================================
- Node.js >= 18.x
- pnpm (preferred) or npm/yarn
- Git
- A Supabase project (for DB + Auth + Realtime)
- Internet connection (for map tiles / OpenStreetMap)

Optional (for development convenience):
- VS Code with ESLint + Prettier extensions
- GitHub Desktop / Git CLI

===========================================================
2. CLONING THE PROJECT
===========================================================
# Clone the repository
git clone https://github.com/httplouis/TraviLink.git

# Go into the folder
cd TraviLink

# Switch to the correct branch if needed
git switch travilink-admin

===========================================================
3. INSTALL DEPENDENCIES (ONE-TIME, COMPLETE LIST)
===========================================================
Run these commands to install **ALL required packages**:

# Core Framework & React
pnpm add next@15 react@19 react-dom@19

# TypeScript & Types
pnpm add -D typescript@^5 @types/react@^19 @types/node@^20 @types/react-dom@^19

# Styling
pnpm add tailwindcss@^4.1.12 postcss@^8.5.6 autoprefixer@^10.4.21
pnpm add clsx@^2.1.1 tailwind-merge@^3.3.1
pnpm add -D @tailwindcss/postcss@^4.1.12

# Database & Authentication
pnpm add @supabase/supabase-js@^2.55.0 @supabase/ssr@^0.7.0

# UI Components & Icons
pnpm add lucide-react@^0.539.0
pnpm add @headlessui/react@^2.2.7

# Maps & Location Services
pnpm add react-leaflet@^5.0.0 leaflet@^1.9.4
pnpm add @react-google-maps/api@^2.20.7
pnpm add @mapbox/mapbox-sdk@^0.16.2 mapbox-gl@^3.15.0
pnpm add react-map-gl@^8.0.4
pnpm add -D @types/leaflet@^1.9.20

# Animations
pnpm add framer-motion@^12.23.22

# State Management
pnpm add zustand@^5.0.8

# Data Fetching
pnpm add swr@^2.3.6

# PDF Generation
pnpm add pdf-lib@^1.17.1
pnpm add jspdf@^3.0.3 jspdf-autotable@^5.0.2

# Charts & Analytics
pnpm add recharts@^3.1.2

# AI & Machine Learning
pnpm add @google/generative-ai@0.21.0

# Validation
pnpm add zod@^4.1.3

# Utilities
pnpm add date-fns@^4.1.0
pnpm add -D @types/date-fns@^2.6.3

# Development Tools
pnpm add -D eslint@^9 eslint-config-next@15.4.6
pnpm add -D @eslint/eslintrc@^3

===========================================================
ALTERNATIVE: Install all at once (RECOMMENDED)
===========================================================
Copy and paste this single command to install everything:

pnpm add next@15 react@19 react-dom@19 @supabase/supabase-js@^2.55.0 @supabase/ssr@^0.7.0 tailwindcss@^4.1.12 postcss@^8.5.6 autoprefixer@^10.4.21 clsx@^2.1.1 tailwind-merge@^3.3.1 lucide-react@^0.539.0 @headlessui/react@^2.2.7 react-leaflet@^5.0.0 leaflet@^1.9.4 @react-google-maps/api@^2.20.7 @mapbox/mapbox-sdk@^0.16.2 mapbox-gl@^3.15.0 react-map-gl@^8.0.4 framer-motion@^12.23.22 zustand@^5.0.8 swr@^2.3.6 pdf-lib@^1.17.1 jspdf@^3.0.3 jspdf-autotable@^5.0.2 recharts@^3.1.2 @google/generative-ai@0.21.0 zod@^4.1.3 date-fns@^4.1.0 && pnpm add -D typescript@^5 @types/react@^19 @types/node@^20 @types/react-dom@^19 @types/leaflet@^1.9.20 @types/date-fns@^2.6.3 eslint@^9 eslint-config-next@15.4.6 @eslint/eslintrc@^3 @tailwindcss/postcss@^4.1.12

===========================================================
EASIEST METHOD: Use package.json (RECOMMENDED)
===========================================================
After pulling from git, simply run:

pnpm install

This will automatically install ALL dependencies listed in package.json.
No need to manually install each package!

To verify all dependencies are installed:
pnpm list --depth=0

===========================================================
COMPLETE DEPENDENCY LIST (for reference)
===========================================================
PRODUCTION DEPENDENCIES:
- @google/generative-ai: 0.21.0
- @headlessui/react: ^2.2.7
- @mapbox/mapbox-sdk: ^0.16.2
- @react-google-maps/api: ^2.20.7
- @supabase/ssr: ^0.7.0
- @supabase/supabase-js: ^2.55.0
- clsx: ^2.1.1
- date-fns: ^4.1.0
- framer-motion: ^12.23.22
- jspdf: ^3.0.3
- jspdf-autotable: ^5.0.2
- leaflet: ^1.9.4
- lucide-react: ^0.539.0
- mapbox-gl: ^3.15.0
- next: 15
- pdf-lib: ^1.17.1
- react: 19
- react-dom: 19
- react-leaflet: ^5.0.0
- react-map-gl: ^8.0.4
- recharts: ^3.1.2
- swr: ^2.3.6
- tailwind-merge: ^3.3.1
- zod: ^4.1.3
- zustand: ^5.0.8

DEV DEPENDENCIES:
- @eslint/eslintrc: ^3
- @tailwindcss/postcss: ^4.1.12
- @types/date-fns: ^2.6.3
- @types/leaflet: ^1.9.20
- @types/node: ^20
- @types/react: ^19
- @types/react-dom: ^19
- autoprefixer: ^10.4.21
- eslint: ^9
- eslint-config-next: 15.4.6
- postcss: ^8.5.6
- tailwindcss: ^4.1.12
- typescript: ^5

===========================================================
4. ENVIRONMENT VARIABLES
===========================================================
Create a file named `.env.local` in the root of the project.

Add the following (replace with your Supabase project values):

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email service (for sending notifications)
RESEND_API_KEY=your-resend-api-key

# Optional: Mapbox or MapTiler if you want custom maps
# NEXT_PUBLIC_MAPBOX_TOKEN=your-token

===========================================================
5. RUNNING THE APP (DEVELOPMENT)
===========================================================
# Start the dev server
pnpm dev

The app will be available at:
http://localhost:3000

===========================================================
6. BUILD & PRODUCTION
===========================================================
# Build the app
pnpm build

# Start production server
pnpm start

===========================================================
7. FOLDER STRUCTURE (IMPORTANT PARTS)
===========================================================
src/
 ├─ app/                        # Next.js App Router pages
 │   └─ (protected)/admin/       # Admin features
 │       ├─ schedule/            # Vehicle scheduling
 │       ├─ drivers/             # Driver management
 │       ├─ vehicles/            # Vehicle management
 │       ├─ maintenance/         # Maintenance logs
 │       ├─ track/               # Live tracking (Leaflet)
 │       └─ feedback/            # Feedback module
 ├─ components/admin/            # UI + logic, separated
 ├─ lib/admin/                   # Types, store, utils
 └─ lib/supabase/                # Supabase client

===========================================================
8. COMMON COMMANDS
===========================================================
# Pull the latest changes from GitHub
git pull origin travilink-admin

# Add and commit changes
git add .
git commit -m "your message"
git push origin travilink-admin

# Reset and reinstall dependencies if errors occur
rm -rf node_modules
pnpm install

===========================================================
9. NOTES
===========================================================
- Maps use OpenStreetMap tiles (free, but with fair use).
- Supabase free tier is enough for capstone/demo usage.
- Location tracking simulator can be enabled in
  `Track / Live` page until mobile app is ready.
- Always separate UI vs logic vs store for cleaner code.
- Make sure `.env.local` is NEVER committed to GitHub.

===========================================================
10. TROUBLESHOOTING (Common Issues After Git Pull)
===========================================================

ISSUE: "router is not defined" or similar errors
SOLUTION:
- Make sure you ran `pnpm install` after pulling from git
- Check if all dependencies are installed: `pnpm list --depth=0`
- Delete `node_modules` and `.next` folder, then run `pnpm install` again

ISSUE: Missing dependencies or "Cannot find module" errors
SOLUTION:
- Run `pnpm install` to install all dependencies from package.json
- If still missing, check the COMPLETE DEPENDENCY LIST above
- Verify your package.json matches the repository version

ISSUE: Slow loading or "Invalid Date" errors
SOLUTION:
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check if Supabase connection is working
- Verify environment variables in `.env.local` are correct
- Restart the dev server: Stop (Ctrl+C) then `pnpm dev` again

ISSUE: Environment variables not working
SOLUTION:
- Make sure `.env.local` is in the ROOT directory (not in src/)
- Restart the dev server after changing .env.local
- Check variable names match exactly (case-sensitive)
- Never commit .env.local to git (it's in .gitignore)

ISSUE: Build errors or TypeScript errors
SOLUTION:
- Run `pnpm install` to ensure all types are installed
- Check if TypeScript version matches: `typescript@^5`
- Delete `.next` folder and rebuild: `pnpm build`

ISSUE: Styling not working (Tailwind CSS)
SOLUTION:
- Make sure tailwindcss and postcss are installed
- Check if `tailwind.config.js` exists
- Restart the dev server

===========================================================
11. VERIFICATION CHECKLIST
===========================================================
After pulling from git, verify everything is set up:

✓ Run `pnpm install` (or `npm install`)
✓ Check all dependencies installed: `pnpm list --depth=0`
✓ Create `.env.local` with Supabase credentials
✓ Run `pnpm dev` and check for errors
✓ Open http://localhost:3000 and verify it loads
✓ Check browser console for any errors

===========================================================
12. VERCEL AUTO-DEPLOYMENT SETUP
===========================================================

AUTO-DEPLOYMENT IS NOW CONFIGURED! 🚀

The project includes:
- vercel.json (Vercel configuration)
- .github/workflows/ (GitHub Actions for deployment)

HOW TO ENABLE AUTO-DEPLOYMENT:

OPTION 1: Vercel Dashboard (RECOMMENDED - EASIEST)
---------------------------------------------------
1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository (TraviLink)
4. Vercel will automatically detect Next.js
5. Add your environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - (and any other env vars you need)
6. Click "Deploy"
7. ✅ DONE! Every push to main/master will auto-deploy

OPTION 2: Using GitHub Actions (Alternative)
---------------------------------------------
If you prefer GitHub Actions instead:

1. Go to your GitHub repository Settings > Secrets and variables > Actions
2. Add these secrets:
   - VERCEL_TOKEN (get from Vercel dashboard > Settings > Tokens)
   - VERCEL_ORG_ID (get from Vercel dashboard > Settings > General)
   - VERCEL_PROJECT_ID (get from Vercel dashboard > Project Settings > General)
3. Push to main/master branch
4. GitHub Actions will automatically deploy to Vercel

VERIFICATION:
-------------
After setup, every time you:
- git push origin main (or master)
- Vercel will automatically:
  1. Build your project
  2. Run tests (if configured)
  3. Deploy to production
  4. Send you a notification

You can check deployment status at:
https://vercel.com/dashboard

===========================================================
13. CONTACT / HELP
===========================================================
If something breaks:
1. Delete `node_modules` + `pnpm-lock.yaml` then reinstall.
2. Delete `.next` folder and rebuild.
3. Check `.env.local` values are correct.
4. Verify all dependencies are installed (see list above).
5. Run `pnpm dev` again.
6. Check browser console for specific error messages.
