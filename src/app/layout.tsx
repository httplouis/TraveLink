// src/app/layout.tsx
import "./globals.css";
import type { Viewport, Metadata } from "next";
import { ToastProvider } from "@/components/common/ui/Toast";

export const metadata: Metadata = {
  title: { default: "Travelink", template: "%s • Travelink" },
  description: "University Vehicle Scheduling & Reservation Portal",
  icons: {
    icon: [
      { url: "/travelink.png", type: "image/png", sizes: "any" },
    ],
    apple: [
      { url: "/travelink.png", sizes: "any", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = { themeColor: "#7f1d1d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
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
