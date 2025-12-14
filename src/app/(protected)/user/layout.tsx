// app/(protected)/user/layout.tsx
"use client";

import React from "react";
import TopBar from "@/components/user/nav/TopBar";
import UserLeftNav from "@/components/user/nav/UserLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname } from "next/navigation";
import "leaflet/dist/leaflet.css";

// Keep Toasts at this level
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";
  const pathname = usePathname();
  const [feedbackLock, setFeedbackLock] = React.useState<{
    locked: boolean;
    requestId?: string;
    requestNumber?: string;
    message?: string;
  }>({ locked: false });

  // Global error handler for uncaught errors (Turbopack HMR chunk errors)
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if it's a SyntaxError with '<' token in a chunk file (Turbopack HMR issue)
      if (
        event.error instanceof SyntaxError && 
        event.message.includes("Unexpected token '<'") &&
        event.filename && 
        event.filename.includes('_next/static/chunks/')
      ) {
        // This is a known Turbopack Fast Refresh issue - silently suppress it
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a chunk loading error (Turbopack HMR issue)
      if (event.reason && typeof event.reason === 'object' && 'message' in event.reason) {
        const reason = event.reason as any;
        if (reason.message && reason.message.includes("Unexpected token '<'")) {
          // Silently suppress Turbopack HMR chunk errors
          event.preventDefault();
          return;
        }
      }
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Check for feedback lock on mount, on pathname change, and periodically
  React.useEffect(() => {
    const checkLock = async () => {
      console.log("[Layout] Checking feedback lock status...");
      const lockStatus = await checkFeedbackLock();
      console.log("[Layout] Lock status:", lockStatus);
      setFeedbackLock(lockStatus);
    };

    checkLock();
    // Check every 5 minutes
    const interval = setInterval(checkLock, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname]); // Re-check when pathname changes (e.g., after submitting feedback)

  return (
    <ToastProvider>
      <PageTitle title="Travelink | Faculty" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
        {/* fixed top bar */}
        <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
          <TopBar />
        </div>

        {/* app body */}
        <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90 flex flex-col">
            <div className="p-3 flex-1 flex flex-col">
              <UserLeftNav />
            </div>
          </aside>

          <main className="overflow-y-auto px-4 md:px-6">
            <div className="mx-auto max-w-6xl py-6">{children}</div>
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />

        {/* Help Button */}
        <HelpButton role="user" />

        {/* Feedback Lock Modal - Forces feedback before continuing */}
        {feedbackLock.locked &&
          feedbackLock.requestId &&
          pathname &&
          !pathname.startsWith("/user/feedback") && (
            <FeedbackLockModal
              open={true}
              requestId={feedbackLock.requestId}
              requestNumber={feedbackLock.requestNumber}
              message={feedbackLock.message}
            />
          )}
      </div>
    </ToastProvider>
  );
}
