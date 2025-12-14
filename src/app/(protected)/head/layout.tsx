// src/app/(protected)/head/layout.tsx
"use client";

import React from "react";
import HeadTopBar from "@/components/head/nav/HeadTopBar";
import HeadLeftNav from "@/components/head/nav/HeadLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname } from "next/navigation";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import "leaflet/dist/leaflet.css";

export default function HeadLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";
  const pathname = usePathname();
  const [feedbackLock, setFeedbackLock] = React.useState<{
    locked: boolean;
    requestId?: string;
    requestNumber?: string;
    message?: string;
  }>({ locked: false });

  // Check for feedback lock on mount, on pathname change, and periodically
  React.useEffect(() => {
    const checkLock = async () => {
      console.log("[Head Layout] Checking feedback lock status...");
      const lockStatus = await checkFeedbackLock();
      console.log("[Head Layout] Lock status:", lockStatus);
      setFeedbackLock(lockStatus);
    };

    checkLock();
    // Check every 5 minutes
    const interval = setInterval(checkLock, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <ToastProvider>
      <PageTitle title="Travelink | Head" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
        {/* fixed top bar */}
        <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
          <HeadTopBar />
        </div>

        {/* app body */}
        <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90 flex flex-col">
            <div className="p-3 flex-1 flex flex-col">
              <HeadLeftNav />
            </div>
          </aside>

          <main className="overflow-y-auto px-4 md:px-6">
            <div className="mx-auto max-w-6xl py-6">{children}</div>
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />

        {/* Help Button */}
        <HelpButton role="head" />

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
