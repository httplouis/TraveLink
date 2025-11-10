// src/app/layout.tsx
import "./globals.css";
import type { Viewport } from "next";
import { ToastProvider } from "@/components/common/ui/Toast";

// Remove static metadata to allow dynamic title changes
// export const metadata: Metadata = {
//   title: { default: "TraviLink", template: "%s • TraviLink" },
//   description: "University Vehicle Scheduling & Reservation Portal",
//   ...
// };

export const viewport: Viewport = { themeColor: "#7f1d1d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>TraviLink</title>
        <meta name="description" content="University Vehicle Scheduling & Reservation Portal" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="icon" href="/vercel.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="" />}
      </head>
      <body className="min-h-dvh antialiased bg-white text-neutral-900" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
