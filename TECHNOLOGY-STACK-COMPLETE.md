# 🛠️ TraviLink - Complete Technology Stack

**Comprehensive list of all libraries, modules, tools, APIs, and services used in the TraviLink project.**

---

## 📋 Table of Contents

1. [Core Framework & Runtime](#core-framework--runtime)
2. [Database & Backend Services](#database--backend-services)
3. [AI Services](#ai-services)
4. [Email Services](#email-services)
5. [Mapping & Location Services](#mapping--location-services)
6. [UI Libraries & Components](#ui-libraries--components)
7. [State Management](#state-management)
8. [Data Fetching](#data-fetching)
9. [PDF Generation](#pdf-generation)
10. [QR Code Generation](#qr-code-generation)
11. [Date & Time Utilities](#date--time-utilities)
12. [Form Validation](#form-validation)
13. [Development Tools](#development-tools)
14. [Build Tools](#build-tools)

---

## 🚀 Core Framework & Runtime

### Next.js
- **Version:** `^15.5.6`
- **Purpose:** React framework for production
- **Features Used:**
  - App Router
  - Server Components
  - API Routes
  - Server Actions
  - Middleware
  - Image Optimization
  - Turbopack (dev mode)

### React
- **Version:** `^19.2.0`
- **Purpose:** UI library
- **Features Used:**
  - React Server Components
  - React Client Components
  - Hooks
  - Context API

### React DOM
- **Version:** `^19.2.0`
- **Purpose:** React rendering for web

### TypeScript
- **Version:** `^5`
- **Purpose:** Type-safe JavaScript
- **Configuration:** `tsconfig.json`

---

## 🗄️ Database & Backend Services

### Supabase
- **Platform:** [supabase.com](https://supabase.com)
- **Services Used:**
  - PostgreSQL Database
  - Authentication (Email/Password, JWT)
  - Row Level Security (RLS)
  - Storage (File uploads)
  - Real-time subscriptions
  - Database Functions (RPC)

#### Supabase Packages
- **@supabase/supabase-js:** `^2.55.0`
  - Main Supabase client library
  - Database queries
  - Authentication
  - Storage operations

- **@supabase/ssr:** `^0.7.0`
  - Server-side rendering support
  - Cookie management
  - PKCE flow for authentication

#### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Features Used
- **Authentication:**
  - Email/password authentication
  - JWT tokens
  - Session management
  - Password reset flows

- **Database:**
  - PostgreSQL with custom schemas
  - Foreign key constraints
  - Database functions (RPC)
  - Triggers
  - Row Level Security (RLS) policies

- **Storage:**
  - File uploads (documents, images)
  - Public/private buckets
  - RLS-protected storage

---

## 🤖 AI Services

### Google Gemini AI
- **Platform:** [Google AI Studio](https://aistudio.google.com)
- **API:** Google Generative Language API (v1beta)
- **Model Used:** `gemini-2.5-flash-lite`
- **Package:** `@google/generative-ai@0.21.0`

#### Features
- AI Chatbot for faculty users
- Natural language processing
- Context-aware conversations
- Intent detection
- Quick suggestions

#### API Endpoints
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/chat` - Get quick suggestions
- `GET /api/ai/test` - Test API connection
- `GET /api/ai/list-models` - List available models

#### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Free Tier Limits
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per month
- No credit card required

#### Implementation Files
- `src/lib/ai/gemini-service.ts` - Main AI service
- `src/lib/ai/gemini.ts` - Dashboard AI insights
- `src/components/ai/ChatbotWidget.tsx` - Chatbot UI
- `src/app/api/ai/chat/route.ts` - Chat API endpoint

---

## 📧 Email Services

### Resend
- **Platform:** [resend.com](https://resend.com)
- **Service Type:** REST API (no npm package)
- **Purpose:** Transactional email delivery

#### Features
- Email notifications
- Participant invitations
- Request confirmations
- HTML email templates
- Email delivery tracking

#### API Endpoint
```
POST https://api.resend.com/emails
```

#### Environment Variables
```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_API_KEY_1=re_key_for_account_1  # Optional: Multiple accounts
RESEND_API_KEY_2=re_key_for_account_2  # Optional: Multiple accounts
RESEND_API_KEY_3=re_key_for_account_3  # Optional: Multiple accounts
RESEND_API_KEY_4=re_key_for_account_4  # Optional: Multiple accounts
EMAIL_FROM=onboarding@resend.dev  # Or verified domain email
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For email links
```

#### Free Tier
- 100 emails per day
- 3,000 emails per month
- Domain verification available

#### Implementation Files
- `src/lib/email.ts` - Email service with Resend integration
- Email templates for:
  - Participant invitations
  - Request confirmations
  - Head endorsement invitations
  - Requester invitations

#### Email Types Sent
1. **Participant Invitations** - For seminar applications
2. **Head Endorsement Invitations** - For department head approvals
3. **Requester Invitations** - For co-requesters
4. **Request Confirmations** - For submitted requests
5. **Status Updates** - For request status changes

---

## 🗺️ Mapping & Location Services

### Mapbox
- **Platform:** [mapbox.com](https://mapbox.com)
- **Purpose:** Interactive maps and location services

#### Packages
- **mapbox-gl:** `^3.15.0`
  - Mapbox GL JS library
  - WebGL-powered maps
  - Custom styling

- **@mapbox/mapbox-sdk:** `^0.16.2`
  - Mapbox SDK for Node.js
  - Geocoding
  - Directions API
  - Matrix API

- **react-map-gl:** `^8.0.4`
  - React wrapper for Mapbox GL
  - React components for maps
  - Interactive map controls

#### Environment Variables (Optional)
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Google Maps
- **Platform:** [Google Maps Platform](https://mapsplatform.google.com)
- **Package:** `@react-google-maps/api@^2.20.7`
- **Purpose:** Alternative mapping solution

### Leaflet
- **Package:** `leaflet@^1.9.4`
- **Package:** `react-leaflet@^5.0.0`
- **Package:** `@types/leaflet@^1.9.20`
- **Purpose:** Open-source mapping library
- **Features:**
  - Interactive maps
  - Markers
  - Popups
  - Custom layers

---

## 🎨 UI Libraries & Components

### Tailwind CSS
- **Version:** `^4.1.12`
- **Purpose:** Utility-first CSS framework
- **Package:** `tailwindcss@^4.1.12`
- **PostCSS Plugin:** `@tailwindcss/postcss@^4.1.12`

### Headless UI
- **Package:** `@headlessui/react@^2.2.7`
- **Purpose:** Unstyled, accessible UI components
- **Components Used:**
  - Dialog (Modal)
  - Menu (Dropdown)
  - Popover
  - Transition

### Lucide React
- **Package:** `lucide-react@^0.539.0`
- **Purpose:** Icon library
- **Features:**
  - 1000+ icons
  - Tree-shakeable
  - TypeScript support

### Framer Motion
- **Package:** `framer-motion@^12.23.22`
- **Purpose:** Animation library
- **Features:**
  - Component animations
  - Page transitions
  - Gesture support
  - Layout animations

### Recharts
- **Package:** `recharts@^3.1.2`
- **Purpose:** Charting library
- **Features:**
  - Line charts
  - Bar charts
  - Pie charts
  - Area charts
  - Responsive design

### Utility Libraries
- **clsx:** `^2.1.1` - Conditional className utility
- **tailwind-merge:** `^3.3.1` - Merge Tailwind classes intelligently

---

## 🔄 State Management

### Zustand
- **Package:** `zustand@^5.0.8`
- **Purpose:** Lightweight state management
- **Usage:**
  - Request form state
  - User preferences
  - UI state

### React Context API
- **Built-in:** React Context
- **Usage:**
  - Accessibility settings
  - Theme preferences
  - User authentication state

---

## 📡 Data Fetching

### SWR
- **Package:** `swr@^2.3.6`
- **Purpose:** Data fetching with caching
- **Features:**
  - Automatic revalidation
  - Cache management
  - Error handling
  - Loading states

### Native Fetch API
- **Built-in:** Browser/Node.js fetch
- **Usage:**
  - API route calls
  - External API requests
  - File uploads

---

## 📄 PDF Generation

### jsPDF
- **Package:** `jspdf@^3.0.3`
- **Purpose:** PDF document generation
- **Features:**
  - Create PDFs from HTML
  - Text rendering
  - Image embedding

### jsPDF AutoTable
- **Package:** `jspdf-autotable@^5.0.2`
- **Purpose:** Table generation in PDFs
- **Features:**
  - Automatic table layout
  - Styling options
  - Multi-page tables

### PDF-lib
- **Package:** `pdf-lib@^1.17.1`
- **Purpose:** PDF manipulation
- **Features:**
  - Create PDFs
  - Modify existing PDFs
  - Merge PDFs
  - Add text/images

#### Implementation
- Travel Order PDF generation
- Seminar Application PDF generation
- Request document exports

---

## 📱 QR Code Generation

### QRCode
- **Package:** `qrcode@^1.5.4`
- **Package:** `@types/qrcode@^1.5.6`
- **Purpose:** QR code generation
- **Features:**
  - Generate QR codes
  - Data URL output
  - Custom error correction
  - Size customization

#### Usage
- Feedback QR codes for trips
- Request tracking QR codes
- Quick access links

---

## 📅 Date & Time Utilities

### date-fns
- **Package:** `date-fns@^4.1.0`
- **Package:** `@types/date-fns@^2.6.3`
- **Purpose:** Date manipulation and formatting
- **Features:**
  - Format dates
  - Parse dates
  - Date arithmetic
  - Locale support
  - Timezone handling

---

## ✅ Form Validation

### Zod
- **Package:** `zod@^4.1.3`
- **Purpose:** Schema validation
- **Features:**
  - Type-safe validation
  - Runtime type checking
  - Form validation
  - API request validation

---

## 🛠️ Development Tools

### ESLint
- **Package:** `eslint@^9`
- **Package:** `eslint-config-next@15.4.6`
- **Package:** `@eslint/eslintrc@^3`
- **Purpose:** Code linting
- **Configuration:** Next.js recommended rules

### TypeScript Types
- **@types/node:** `^20` - Node.js type definitions
- **@types/react:** `^19` - React type definitions
- **@types/react-dom:** `^19` - React DOM type definitions
- **@types/leaflet:** `^1.9.20` - Leaflet type definitions
- **@types/date-fns:** `^2.6.3` - date-fns type definitions
- **@types/qrcode:** `^1.5.6` - QRCode type definitions

---

## 🔨 Build Tools

### PostCSS
- **Package:** `postcss@^8.5.6`
- **Purpose:** CSS processing
- **Plugins:**
  - Tailwind CSS
  - Autoprefixer

### Autoprefixer
- **Package:** `autoprefixer@^10.4.21`
- **Purpose:** Automatic vendor prefixes
- **Usage:** PostCSS plugin

### Package Manager
- **pnpm** - Fast, disk space efficient package manager
- **npm** - Alternative (also supported)

---

## 🗂️ Additional Tools & Services

### SQLite3
- **Package:** `sqlite3@^5.1.7`
- **Purpose:** Local database (if needed for development/testing)
- **Note:** Not actively used in production (Supabase PostgreSQL is primary)

---

## 📦 Package Installation

### Quick Install
```bash
pnpm install
```

### Manual Install (if needed)
```bash
# Core dependencies
pnpm add next@^15.5.6 react@^19.2.0 react-dom@^19.2.0

# Supabase
pnpm add @supabase/supabase-js@^2.55.0 @supabase/ssr@^0.7.0

# UI & Styling
pnpm add tailwindcss@^4.1.12 postcss@^8.5.6 autoprefixer@^10.4.21
pnpm add clsx@^2.1.1 tailwind-merge@^3.3.1 lucide-react@^0.539.0
pnpm add @headlessui/react@^2.2.7 framer-motion@^12.23.22

# Maps
pnpm add leaflet@^1.9.4 react-leaflet@^5.0.0
pnpm add @react-google-maps/api@^2.20.7
pnpm add @mapbox/mapbox-sdk@^0.16.2 mapbox-gl@^3.15.0 react-map-gl@^8.0.4

# State & Data
pnpm add zustand@^5.0.8 swr@^2.3.6

# PDF & QR
pnpm add jspdf@^3.0.3 jspdf-autotable@^5.0.2 pdf-lib@^1.17.1
pnpm add qrcode@^1.5.4

# Utilities
pnpm add date-fns@^4.1.0 zod@^4.1.3 recharts@^3.1.2

# AI
pnpm add @google/generative-ai@0.21.0

# Dev dependencies
pnpm add -D typescript@^5 @types/react@^19 @types/node@^20
pnpm add -D @types/react-dom@^19 @types/leaflet@^1.9.20
pnpm add -D @types/date-fns@^2.6.3 @types/qrcode@^1.5.6
pnpm add -D eslint@^9 eslint-config-next@15.4.6 @eslint/eslintrc@^3
pnpm add -D @tailwindcss/postcss@^4.1.12
```

---

## 🔐 Environment Variables Summary

### Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional (but recommended)
```bash
# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Maps (Mapbox - optional)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

## 📊 Technology Stack Summary

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Next.js API Routes

### External Services
- **Email:** Resend API
- **AI:** Google Gemini API
- **Maps:** Mapbox, Google Maps, Leaflet

### Development
- **Language:** TypeScript 5
- **Package Manager:** pnpm
- **Linting:** ESLint
- **Build Tool:** Next.js (Turbopack)

---

## 📝 Notes

1. **Resend** is used via REST API, not as an npm package
2. **Supabase** provides database, auth, and storage in one platform
3. **Google Gemini** offers a generous free tier for AI features
4. **Multiple map providers** are available (Mapbox, Google Maps, Leaflet) for flexibility
5. **PDF generation** uses multiple libraries for different use cases
6. **TypeScript** is used throughout for type safety

---

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Google Gemini API](https://ai.google.dev)
- [Mapbox Documentation](https://docs.mapbox.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated:** Generated from codebase analysis  
**Project:** TraviLink - Campus Transport Management System

