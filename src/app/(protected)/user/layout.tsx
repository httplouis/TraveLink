"use client";

import TopBar from "@/components/user/nav/TopBar";
import UserLeftNav from "@/components/user/nav/UserLeftNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {/* FIXED MAROON TOP BAR */}
      <TopBar />

      {/* APP SHELL — left nav pinned; center scrolls */}
      <div
        className="
          pt-14
          h-[calc(100dvh-56px)]
          grid grid-cols-[260px_minmax(0,1fr)]
          gap-6
          overflow-hidden
        "
      >
        {/* LEFT NAV (pinned) */}
        <aside className="h-full bg-white/90 border-r border-neutral-200">
          <div className="h-full p-3">
            <UserLeftNav />
          </div>
        </aside>

        {/* CENTER (scrolls, full width) */}
        <main className="min-w-0 h-full overflow-y-auto px-4 md:px-6">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
