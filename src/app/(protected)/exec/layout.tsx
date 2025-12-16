// src/app/(protected)/exec/layout.tsx
"use client";

import React from "react";
import ExecTopBar from "@/components/exec/nav/ExecTopBar";
import ExecLeftNav from "@/components/exec/nav/ExecLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname, useRouter } from "next/navigation";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import "leaflet/dist/leaflet.css";

export default function ExecLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";
  const pathname = usePathname();
  const router = useRouter();
  const [feedbackLock, setFeedbackLock] = React.useState<{
    locked: boolean;
    requestId?: string;
    requestNumber?: string;
    message?: string;
  }>({ locked: false });

  // Check for feedback lock on mount, on pathname change, and periodically
  React.useEffect(() => {
    const checkLock = async () => {
      const lockStatus = await checkFeedbackLock();
      setFeedbackLock(lockStatus);
    };
    checkLock();
    const interval = setInterval(checkLock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <ToastProvider>
      <PageTitle title="Travelink | Executive" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
      {/* fixed top bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
        <ExecTopBar />
      </div>

      {/* app body */}
      <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
        <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90">
          <div className="p-3">
            <ExecLeftNav />
          </div>
        </aside>

        <main className="overflow-y-auto px-4 md:px-6 bg-gray-50">
          <div className="mx-auto max-w-7xl py-6">{children}</div>
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <ChatbotWidget />

      {/* Help Button */}
      <HelpButton role="exec" />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        shortcuts={[
          { key: "d", description: "Dashboard", action: () => router.push("/exec/dashboard") },
          { key: "i", description: "Inbox", action: () => router.push("/exec/inbox") },
          { key: "n", description: "New Request", action: () => router.push("/exec/request") },
          { key: "s", description: "Schedule", action: () => router.push("/exec/schedule") },
        ]}
      />

      {/* Feedback Lock Modal */}
      {feedbackLock.locked && feedbackLock.requestId && pathname && !pathname.startsWith("/user/feedback") && (
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
