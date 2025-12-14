// src/app/(protected)/comptroller/layout.tsx
"use client";

import React from "react";
import { LogOut } from "lucide-react";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";
import { LogoutConfirmDialog } from "@/components/common/LogoutConfirmDialog";
import ComptrollerLeftNav from "@/components/comptroller/nav/ComptrollerLeftNav";
import ComptrollerTopBar from "@/components/comptroller/nav/ComptrollerTopBar";
import FeedbackLockModal from "@/components/common/FeedbackLockModal";
import { checkFeedbackLock } from "@/lib/feedback/lock";
import { usePathname } from "next/navigation";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import { useRouter } from "next/navigation";

export default function ComptrollerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 shadow-lg">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ComptrollerLeftNav />
          </div>

          {/* Logout Button */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Logout Confirmation Dialog */}
        <LogoutConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          isLoading={loggingOut}
        />

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
