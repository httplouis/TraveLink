// src/app/(protected)/comptroller/layout.tsx
"use client";

import ChatbotWidget from "@/components/ai/ChatbotWidget";
import ComptrollerLeftNav from "@/components/comptroller/nav/ComptrollerLeftNav";
import ComptrollerTopBar from "@/components/comptroller/nav/ComptrollerTopBar";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

export default function ComptrollerLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* AI Chatbot Widget */}
        <ChatbotWidget />
      </div>
    </ToastProvider>
  );
}
