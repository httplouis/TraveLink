// src/app/layout.tsx
import "./globals.css";
import type { Viewport, Metadata } from "next";
import { ToastProvider } from "@/components/common/ui/Toast";
import TopLoadingBar from "@/components/common/TopLoadingBar";
import { AccessibilitySettingsProvider } from "@/contexts/AccessibilitySettingsContext";

export const metadata: Metadata = {
  title: { default: "Travelink", template: "%s • Travelink" },
  description: "University Vehicle Scheduling & Reservation Portal",
  icons: {
    icon: [
      { url: "/travelink.png", type: "image/png", sizes: "any" },
      { url: "/travelink.png", type: "image/png", sizes: "32x32" },
      { url: "/travelink.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/travelink.png", sizes: "any", type: "image/png" },
    ],
    shortcut: "/travelink.png",
  },
};

export const viewport: Viewport = { themeColor: "#7f1d1d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/travelink.png" type="image/png" />
        <link rel="shortcut icon" href="/travelink.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/site.webmanifest" />
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="" />}
        {/* Suppress Turbopack HMR chunk loading errors - these are harmless timing issues */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                const isTurbopackHMRError = (error, message, filename) => {
                  const errorMessage = message || error?.message || error?.toString() || '';
                  const errorFilename = filename || error?.filename || '';
                  const errorStack = error?.stack || '';
                  
                  // Check if it's a SyntaxError with '<' token (Turbopack HMR issue)
                  const isSyntaxError = error instanceof SyntaxError || 
                                       errorMessage.includes("Unexpected token '<'") ||
                                       errorMessage.includes("SyntaxError");
                  
                  // Check if it's related to Next.js chunks or Turbopack
                  const isChunkError = errorMessage.includes('_next/static/chunks/') ||
                                      errorMessage.includes('_next/static') ||
                                      errorMessage.includes('src ') || // Turbopack chunk pattern
                                      errorFilename.includes('_next/static/chunks/') ||
                                      errorFilename.includes('_next/static') ||
                                      errorFilename.includes('src ') ||
                                      errorStack.includes('_next/static/chunks/') ||
                                      errorStack.includes('src ');
                  
                  return isSyntaxError && isChunkError;
                };
                
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const firstArg = args[0];
                  const message = firstArg?.toString() || '';
                  const errorObj = args.find(arg => arg instanceof Error || (arg && typeof arg === 'object' && 'message' in arg));
                  
                  if (isTurbopackHMRError(errorObj || firstArg, message)) {
                    return; // Silently ignore Turbopack HMR errors
                  }
                  
                  const hasChunkReference = args.some(arg => {
                    if (typeof arg === 'string') return arg.includes('_next/static/chunks/');
                    if (arg && typeof arg === 'object') {
                      return arg.filename?.includes('_next/static/chunks/') ||
                             arg.stack?.includes('_next/static/chunks/');
                    }
                    return false;
                  });
                  
                  if (message.includes("Unexpected token '<'") && hasChunkReference) {
                    return; // Silently ignore
                  }
                  
                  originalConsoleError.apply(console, args);
                };
                
                window.addEventListener('error', function(event) {
                  if (isTurbopackHMRError(event.error, event.message, event.filename)) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true);
                
                window.addEventListener('unhandledrejection', function(event) {
                  if (isTurbopackHMRError(event.reason)) {
                    event.preventDefault();
                    return;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased bg-white text-neutral-900" suppressHydrationWarning>
        <AccessibilitySettingsProvider>
          <TopLoadingBar />
          <ToastProvider>
            {children}
          </ToastProvider>
        </AccessibilitySettingsProvider>
      </body>
    </html>
  );
}
