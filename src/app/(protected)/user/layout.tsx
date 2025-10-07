"use client";

import TopBar from "@/components/user/nav/TopBar";
import UserLeftNav from "@/components/user/nav/UserLeftNav";
import React from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  // set this to your real TopBar height (56px if h-14, 64px if h-16)
  const topbarH = "56px";

  return (
    <div
      className="bg-[var(--background)] text-[var(--foreground)]"
      style={{ ["--topbar-h" as any]: topbarH }}
    >
      {/* fixed top bar; make sure TopBar uses the same height */}
      <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
        <TopBar />
      </div>

      {/* FULL APP AREA pinned to the viewport edges */}
      <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
        {/* left nav: own scroller */}
        <aside className="overflow-y-auto border-r border-neutral-200 bg-white/90">
          <div className="p-3">
            <UserLeftNav />
          </div>
        </aside>

        {/* main: the only vertical scroller */}
        <main className="overflow-y-auto px-4 md:px-6">
          <div className="mx-auto max-w-6xl py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
