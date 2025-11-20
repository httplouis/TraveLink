"use client";

import React from "react";
import VPTopBar from "@/components/vp/nav/VPTopBar";
import VPLeftNav from "@/components/vp/nav/VPLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import "leaflet/dist/leaflet.css";

export default function VPLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";

  // Global error handler for uncaught errors (Turbopack HMR chunk errors)
  React.useEffect(() => {
    // Store original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Helper function to check if error is a Turbopack HMR chunk error
    const isTurbopackHMRError = (error: any, message?: string, filename?: string): boolean => {
      const errorMessage = message || error?.message || error?.toString() || '';
      const errorFilename = filename || error?.filename || '';
      
      return (
        errorMessage.includes("Unexpected token '<'") &&
        (errorMessage.includes('_next/static/chunks/') ||
         errorMessage.includes('_next/static') ||
         errorFilename.includes('_next/static/chunks/') ||
         errorFilename.includes('_next/static') ||
         error?.stack?.includes('_next/static/chunks/'))
      );
    };
    
    // Override console.error to filter Turbopack chunk errors
    console.error = (...args: any[]) => {
      const firstArg = args[0];
      const message = firstArg?.toString() || '';
      const errorObj = args.find(arg => arg instanceof Error || (arg && typeof arg === 'object' && 'message' in arg));
      
      // Check if it's a Turbopack HMR error
      if (isTurbopackHMRError(errorObj || firstArg, message)) {
        // Silently ignore - this is a known Turbopack HMR bug
        return;
      }
      
      // Check all args for chunk file references
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
    
    const handleError = (event: ErrorEvent) => {
      // Check if it's a SyntaxError with '<' token in a chunk file (Turbopack HMR issue)
      if (isTurbopackHMRError(event.error, event.message, event.filename)) {
        // This is a known Turbopack Fast Refresh issue - silently suppress it
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return false; // Prevent default error handling
      }
      
      // For other errors, log them normally (but don't spam console)
      if (!event.error?.message?.includes('ChunkLoadError')) {
        originalConsoleError("[VPLayout] Global error caught:", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a chunk loading error (Turbopack HMR issue)
      if (isTurbopackHMRError(event.reason)) {
        // Silently suppress Turbopack HMR chunk errors
        event.preventDefault();
        return;
      }
      
      // For other rejections, log them (but filter out chunk errors)
      if (event.reason && typeof event.reason === 'object') {
        const reason = event.reason as any;
        if (!reason.message?.includes('Unexpected token') && !reason.message?.includes('ChunkLoadError')) {
          originalConsoleError("[VPLayout] Unhandled promise rejection:", event.reason);
        }
      }
    };

    // Add listeners with capture phase to catch early
    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      // Restore original console methods
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <ToastProvider>
      <PageTitle title="Travelink | VP" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
        {/* fixed top bar */}
        <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
          <VPTopBar />
        </div>

        {/* app body */}
        <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90 flex flex-col">
            <div className="p-3 flex-1 flex flex-col">
              <VPLeftNav />
            </div>
          </aside>

          <main className="overflow-y-auto px-4 md:px-6">
            <div className="mx-auto max-w-6xl py-6">{children}</div>
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />
      </div>
    </ToastProvider>
  );
}
