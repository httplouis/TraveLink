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
3. INSTALL DEPENDENCIES (ONE-TIME, ONE COMMAND)
===========================================================
Run this to install **all required packages**:


pnpm add next react react-dom typescript tailwindcss postcss autoprefixer \
pnpm add @supabase/supabase-js \
pnpm add react-leaflet leaflet \
pnpm add lucide-react \
pnpm add @headlessui/react \
pnpm add clsx
pnpm add framer-motion
pnpm add zustand
pnpm add jspdf jspdf-autotable
pnpm add pdf-lib



# For dev tools (optional but recommended)
pnpm add -D eslint prettier @types/react @types/node

===========================================================
4. ENVIRONMENT VARIABLES
===========================================================
Create a file named `.env.local` in the root of the project.

Add the following (replace with your Supabase project values):

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

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
10. CONTACT / HELP
===========================================================
If something breaks:
1. Delete `node_modules` + `pnpm-lock.yaml` then reinstall.
2. Check `.env.local` values are correct.
3. Run `pnpm dev` again.
