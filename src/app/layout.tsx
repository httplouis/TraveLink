// src/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "TraviLink", template: "%s • TraviLink" },
  description: "University Vehicle Scheduling & Reservation Portal",
  icons: {
    icon: [
      { url: "/vercel.svg" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = { themeColor: "#7f1d1d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="" />}</head>
      <body className="min-h-dvh antialiased bg-white text-neutral-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
