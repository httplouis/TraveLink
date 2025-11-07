// src/app/(protected)/admin/layout.tsx
"use client";

import "@/app/globals.css";
import "@/app/styles/admin/admin.css";

import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Breadcrumbs from "@/components/admin/nav/Breadcrumbs";
import ProfileMenu from "@/components/admin/nav/ProfileMenu";
import NotificationBell from "@/components/admin/nav/NotificationBell";
import PageTitle from "@/components/common/PageTitle";
import { Search } from "lucide-react";
import ProfileContainer from "@/components/admin/profile/containers/ProfileContainer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle title="TraviLink | Admin" />
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
        {/* ===== Premium Top Bar ===== */}
        <div
          className="
            sticky top-4 z-30 relative flex h-16 items-center
            rounded-2xl border border-white/10 
            bg-gradient-to-r from-[#7a1f2a] via-[#5a1520] to-[#4a0d15]
            text-white
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            backdrop-blur-xl
            px-4 sm:px-6
            overflow-hidden
          "
          suppressHydrationWarning
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />
          
          {/* Left brand chip */}
          <div className="absolute left-6 hidden items-center gap-3 md:flex z-10">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center font-bold text-sm shadow-lg">
              TL
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide">TraviLink</div>
              <div className="text-[10px] text-white/60 font-medium">Admin Portal</div>
            </div>
          </div>

          {/* Centered search */}
          <div className="mx-auto w-full max-w-[720px] z-10">
            <div className="relative group">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 transition-colors duration-200" strokeWidth={2.5} />
              <input
                placeholder="Search schedules, vehicles, drivers…  (Ctrl/⌘+K)"
                className="
                  h-12 w-full rounded-xl 
                  border border-white/20 
                  bg-white/95 backdrop-blur-sm
                  pl-11 pr-4
                  text-sm text-neutral-900 placeholder-neutral-400 
                  outline-none
                  transition-all duration-200
                  hover:bg-white hover:border-white/40
                  focus:bg-white focus:border-white focus:ring-2 focus:ring-white/50 focus:shadow-lg
                "
                suppressHydrationWarning
                autoComplete="off"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="absolute right-6 flex items-center gap-3 z-10" suppressHydrationWarning>
            <NotificationBell />
            <div className="h-8 w-[1px] bg-white/20" />
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
    </>
  );
}
