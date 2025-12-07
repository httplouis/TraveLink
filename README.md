# TraviLink

> A comprehensive travel order and seminar application management system for Manuel S. Enverga University Foundation (MSEUF)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-travilink.vercel.app-blue)](https://travilink.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Overview

TraviLink is a smart web application designed to streamline and automate the entire travel order request process for MSEUF. The system handles request submission, multi-level approval workflows, vehicle/driver assignment, budget management, and post-trip feedback collection.

### Key Features

- 🚗 **Request Management** - Submit and track travel orders and seminar applications with budget tracking
- ✅ **Multi-Level Approval Workflow** - Automated routing through Department Head → Admin → Comptroller → HR → Executive
- 🚐 **Vehicle & Driver Assignment** - Intelligent assignment based on availability and requirements
- 📊 **Real-Time Tracking** - Live updates on request status and approval progress
- ⭐ **Feedback System** - Post-trip feedback collection with ratings and reviews
- 📈 **Dashboard Analytics** - Comprehensive metrics and processing time tracking
- 📄 **Document Generation** - Automated PDF generation for approved travel orders
- 🔔 **Notification System** - In-app and email notifications for status changes

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Microsoft Azure AD (OAuth) integration
- **Real-Time**: Supabase Realtime subscriptions
- **Additional**: AI-powered chatbot (Google Gemini), PDF generation, Map integration

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- pnpm (preferred) or npm/yarn
- Git
- A Supabase project (for database, auth, and realtime)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/httplouis/TraviLink.git
   cd TraviLink
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Optional: Email service
   RESEND_API_KEY=your-resend-api-key
   
   # Optional: AI Chatbot
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
TraviLink/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (protected)/       # Protected routes
│   │   │   ├── admin/         # Admin features
│   │   │   ├── driver/        # Driver portal
│   │   │   └── user/          # User features
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   ├── common/            # Shared components
│   │   └── user/              # User components
│   └── lib/                   # Utilities and helpers
│       ├── admin/             # Admin utilities
│       ├── supabase/          # Supabase client
│       └── workflow/         # Approval workflow logic
├── documents/                 # Documentation
└── public/                    # Static assets
```

## 👥 User Roles

- **Super Admin** - Full system access and user management
- **Admin** - Request processing and vehicle/driver assignment
- **Comptroller** - Budget review and payment confirmation
- **HR** - Human resources approval
- **VP/President** - Executive approval
- **Department Head** - Department-level approval
- **Faculty/Staff** - Request submission
- **Driver** - Trip execution and status updates

## 🔧 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 📚 Documentation

For detailed documentation, please refer to the `documents/` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Contributors

- [@httplouis](https://github.com/httplouis)
- [@Hans-Madridano25](https://github.com/Hans-Madridano25)
- [@Gaboogsh](https://github.com/Gaboogsh)

## 🔗 Links

- **Live Demo**: [travilink.vercel.app](https://travilink.vercel.app)
- **Repository**: [github.com/httplouis/TraviLink](https://github.com/httplouis/TraviLink)

---

Made with ❤️ for Manuel S. Enverga University Foundation

