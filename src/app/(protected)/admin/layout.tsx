// src/app/(protected)/admin/layout.tsx
"use client";

import "@/app/globals.css";
import "@/app/styles/admin/admin.css";

import Link from "next/link";
import Image from "next/image";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Breadcrumbs from "@/components/admin/nav/Breadcrumbs";
import AdminProfileDropdown from "@/components/admin/nav/AdminProfileDropdown";
import NotificationBell from "@/components/admin/nav/NotificationBell";
import PageTitle from "@/components/common/PageTitle";
import { Search } from "lucide-react";
import ProfileContainer from "@/components/admin/profile/containers/ProfileContainer";
import ChatbotWidget from "@/components/ai/ChatbotWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <PageTitle title="Travelink | Admin" />
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
            rounded-2xl
            text-white
            px-4 sm:px-6
          "
          style={{
            backgroundColor: '#7a0010'
          }}
          suppressHydrationWarning
        >
          
          {/* Left brand chip */}
          <div className="absolute left-6 hidden items-center gap-3 md:flex z-10">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-lg bg-white p-1.5 shadow-md transition-transform group-hover:scale-105">
                <Image
                  src="/travelink.png"
                  alt="Travelink Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="text-xl font-bold tracking-tight">Travelink</div>
            </Link>
          </div>

          {/* Centered search */}
          <div className="mx-auto w-full max-w-[720px] z-10">
            <div className="relative group">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 transition-colors duration-200" strokeWidth={2.5} />
              <input
                placeholder="Search schedules, vehicles, drivers…  (Ctrl/⌘+K)"
                className="
                  h-12 w-full rounded-xl 
                  bg-white
                  pl-11 pr-4
                  text-sm text-neutral-900 placeholder-neutral-400 
                  outline-none
                  transition-all duration-200
                "
                suppressHydrationWarning
                autoComplete="off"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="absolute right-6 flex items-center gap-3 z-10" suppressHydrationWarning>
            <NotificationBell variant="onMaroon" />
            <AdminProfileDropdown />
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

      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
    </>
  );
}
