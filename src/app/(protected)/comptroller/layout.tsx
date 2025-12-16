// src/app/(protected)/comptroller/layout.tsx
"use client";

import React from "react";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import ComptrollerLeftNav from "@/components/comptroller/nav/ComptrollerLeftNav";
import ComptrollerTopBar from "@/components/comptroller/nav/ComptrollerTopBar";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname, useRouter } from "next/navigation";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

export default function ComptrollerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 shadow-lg">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ComptrollerLeftNav />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <ComptrollerTopBar />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />

        {/* Help Button */}
        <HelpButton role="comptroller" />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          shortcuts={[
            { key: "d", description: "Dashboard", action: () => router.push("/comptroller/dashboard") },
            { key: "i", description: "Inbox", action: () => router.push("/comptroller/inbox") },
            { key: "h", description: "History", action: () => router.push("/comptroller/history") },
            { key: "r", description: "Reports", action: () => router.push("/comptroller/reports") },
            { key: "b", description: "Budget", action: () => router.push("/comptroller/budget") },
          ]}
        />

        {/* Feedback Lock Modal */}
        {feedbackLock.locked && feedbackLock.requestId && pathname && !pathname.startsWith("/user/feedback") && !pathname.startsWith("/comptroller/feedback") && (
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
