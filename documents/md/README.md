# TraviLink - Travel Management System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Dependencies

### Production Dependencies

Make sure all these packages are installed:

```json
{
  "@google/generative-ai": "0.21.0",
  "@headlessui/react": "^2.2.7",
  "@mapbox/mapbox-sdk": "^0.16.2",
  "@react-google-maps/api": "^2.20.7",
  "@supabase/ssr": "^0.7.0",
  "@supabase/supabase-js": "^2.55.0",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "framer-motion": "^12.23.22",
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.539.0",
  "mapbox-gl": "^3.15.0",
  "next": "15",
  "pdf-lib": "^1.17.1",
  "react": "19",
  "react-dom": "19",
  "react-leaflet": "^5.0.0",
  "react-map-gl": "^8.0.4",
  "recharts": "^3.1.2",
  "swr": "^2.3.6",
  "tailwind-merge": "^3.3.1",
  "zod": "^4.1.3",
  "zustand": "^5.0.8"
}
```

### Development Dependencies

```json
{
  "@eslint/eslintrc": "^3",
  "@tailwindcss/postcss": "^4.1.12",
  "@types/date-fns": "^2.6.3",
  "@types/leaflet": "^1.9.20",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "autoprefixer": "^10.4.21",
  "eslint": "^9",
  "eslint-config-next": "15.4.6",
  "postcss": "^8.5.6",
  "tailwindcss": "^4.1.12",
  "typescript": "^5"
}
```

### Installation

After pulling from git, run:

```bash
npm install
# or
pnpm install
```

This will install all dependencies listed in `package.json`.

### Verify Installation

To check if all dependencies are installed correctly:

```bash
npm list --depth=0
# or
pnpm list --depth=0
```

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
