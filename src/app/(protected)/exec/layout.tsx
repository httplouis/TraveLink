// src/app/(protected)/exec/layout.tsx
"use client";

import React from "react";
import ExecTopBar from "@/components/exec/nav/ExecTopBar";
import ExecLeftNav from "@/components/exec/nav/ExecLeftNav";
import PageTitle from "@/components/common/PageTitle";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import "leaflet/dist/leaflet.css";

export default function ExecLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";

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
    </div>
    </ToastProvider>
  );
}
