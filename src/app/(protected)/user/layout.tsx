// app/(protected)/user/layout.tsx
"use client";

import React from "react";
import TopBar from "@/components/user/nav/TopBar";
import UserLeftNav from "@/components/user/nav/UserLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import "leaflet/dist/leaflet.css";

// Keep Toasts at this level
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";
  const [feedbackLock, setFeedbackLock] = React.useState<{
    locked: boolean;
    requestId?: string;
    requestNumber?: string;
    message?: string;
  }>({ locked: false });

  // Check for feedback lock on mount and periodically
  React.useEffect(() => {
    const checkLock = async () => {
      const lockStatus = await checkFeedbackLock();
      setFeedbackLock(lockStatus);
    };

    checkLock();
    // Check every 5 minutes
    const interval = setInterval(checkLock, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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

        {/* Feedback Lock Modal - Forces feedback before continuing */}
        {feedbackLock.locked && feedbackLock.requestId && (
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
