"use client";

import React from "react";
import TopBar from "@/components/user/nav/TopBar";
import UserLeftNav from "@/components/user/nav/UserLeftNav";
import { RequestProvider } from "@/store/user/requestStore";
import "leaflet/dist/leaflet.css";


// ✅ Default import for the provider (wraps the app)
import ToastProvider from "@/components/common/ui/ToastProvider.ui"; 

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";

  return (
    <RequestProvider>
      <ToastProvider>
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
            <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90">
              <div className="p-3">
                <UserLeftNav />
              </div>
            </aside>

            <main className="overflow-y-auto px-4 md:px-6">
              <div className="mx-auto max-w-6xl py-6">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </RequestProvider>
  );
}
