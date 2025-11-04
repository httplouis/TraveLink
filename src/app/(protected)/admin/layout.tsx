// src/app/(protected)/admin/layout.tsx
"use client";

import "@/app/globals.css";
import "@/app/styles/admin/admin.css";

import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Breadcrumbs from "@/components/admin/nav/Breadcrumbs";
import ProfileMenu from "@/components/admin/nav/ProfileMenu";
import NotificationBell from "@/components/admin/nav/NotificationBell";
import { Search } from "lucide-react";
import ProfileContainer from "@/components/admin/profile/containers/ProfileContainer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-[#F7F7F8] text-neutral-900">
      {/* ===== Floating Sidebar (follows CSS vars set by AdminLeftNav) ===== */}
      <aside
        className="
          fixed left-4 top-4 bottom-4 z-40 overflow-hidden rounded-2xl border
          shadow-[0_12px_40px_rgba(17,24,39,.08)]
          transition-[width] duration-300
        "
        style={{
          width: "var(--tl-nav-w, 280px)",
          background: "var(--tl-nav-bg, #ffffff)",
          borderColor: "var(--tl-nav-border, #e5e7eb)",
          color: "var(--tl-nav-fg, #111827)",
        }}
        aria-label="Admin navigation"
      >
        <AdminLeftNav />
      </aside>

      {/* ===== Content Column (padding animates with sidebar) ===== */}
      <div
        className="pt-4 pr-4 pb-6"
        style={{
          paddingLeft: "calc(var(--tl-nav-w, 280px) + 28px)",
          transition: "padding 280ms cubic-bezier(.22,.61,.36,1)",
          willChange: "padding",
        }}
      >
        {/* ===== Top bar (maroon) ===== */}
        <div
          className="
            sticky top-4 z-30 relative flex h-16 items-center
            rounded-xl border border-transparent bg-[#7a1f2a] text-white
            shadow-[0_8px_24px_rgba(17,24,39,.10)] px-4 sm:px-6
          "
          suppressHydrationWarning
        >
          {/* Left brand chip */}
          <div className="absolute left-4 hidden items-center gap-2 md:flex">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 font-semibold">TL</div>
            <span className="text-sm font-semibold tracking-wide">TraviLink</span>
          </div>

          {/* Centered search */}
          <div className="mx-auto w-full max-w-[720px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-85" />
              <input
                placeholder="Search schedules, vehicles, drivers…  (Ctrl/⌘+K)"
                className="
                  h-11 w-full rounded-lg border border-white/20 bg-white/95 pl-10 pr-3
                  text-neutral-900 placeholder-neutral-500 outline-none
                  focus:border-white focus:ring-2 focus:ring-white/35
                "
                suppressHydrationWarning
                autoComplete="off"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="absolute right-4 flex items-center gap-2 sm:right-6" suppressHydrationWarning>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>

        {/* ===== Main content frame ===== */}
        <main className="mt-4">
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(17,24,39,.06)]">
            <div className="border-b border-neutral-200 px-5 py-4">
              <Breadcrumbs />
            </div>
            <div className="px-5 py-5">{children}</div>
          </div>
        </main>
      </div>

      {/* Mount the profile slide-over once at the root */}
      <ProfileContainer />
    </div>
  );
}
