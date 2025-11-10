// src/app/(protected)/comptroller/layout.tsx
"use client";

import { DollarSign, LogOut } from "lucide-react";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import ComptrollerLeftNav from "@/components/comptroller/nav/ComptrollerLeftNav";
import ComptrollerTopBar from "@/components/comptroller/nav/ComptrollerTopBar";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import { useRouter } from "next/navigation";

export default function ComptrollerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 shadow-lg">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-3 px-6 py-5 border-b border-gray-200">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#7A0010] to-[#5A0010] flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">TraviLink</h1>
              <p className="text-xs text-gray-600">Comptroller</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ComptrollerLeftNav />
          </div>

          {/* Logout Button */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
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
