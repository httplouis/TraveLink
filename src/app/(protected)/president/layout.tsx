"use client";

import React from "react";
import PresidentTopBar from "@/components/president/nav/PresidentTopBar";
import PresidentLeftNav from "@/components/president/nav/PresidentLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname, useRouter } from "next/navigation";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import "leaflet/dist/leaflet.css";

export default function PresidentLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";
  const pathname = usePathname();
  const router = useRouter();
  const [feedbackLock, setFeedbackLock] = React.useState<{
    locked: boolean;
    requestId?: string;
    requestNumber?: string;
    message?: string;
  }>({ locked: false });

  // Check for feedback lock
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
      <PageTitle title="Travelink | President" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
        {/* fixed top bar */}
        <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
          <PresidentTopBar />
        </div>

        {/* app body */}
        <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90 flex flex-col">
            <div className="p-3 flex-1 flex flex-col">
              <PresidentLeftNav />
            </div>
          </aside>

          <main className="overflow-y-auto px-4 md:px-6">
            <div className="mx-auto max-w-6xl py-6">{children}</div>
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />

        {/* Help Button */}
        <HelpButton role="president" />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          shortcuts={[
            { key: "d", description: "Dashboard", action: () => router.push("/president/dashboard") },
            { key: "i", description: "Inbox", action: () => router.push("/president/inbox") },
            { key: "n", description: "New Request", action: () => router.push("/president/request") },
            { key: "s", description: "Schedule", action: () => router.push("/president/schedule") },
            { key: "a", description: "Analytics", action: () => router.push("/president/analytics") },
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
