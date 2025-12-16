// src/app/(protected)/admin/layout.tsx
"use client";

import "@/app/globals.css";
import "@/app/styles/admin/admin.css";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Breadcrumbs from "@/components/admin/nav/Breadcrumbs";
import ProfileMenu from "@/components/admin/nav/ProfileMenu";
import NotificationBell from "@/components/admin/nav/NotificationBell";
import PageTitle from "@/components/common/PageTitle";
import { LogoutConfirmDialog } from "@/components/common/LogoutConfirmDialog";
import KeyboardShortcuts from "@/components/common/KeyboardShortcuts";
import { Search, LogOut } from "lucide-react";
import ProfileContainer from "@/components/admin/profile/containers/ProfileContainer";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import HelpButton from "@/components/common/HelpButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

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
            <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{backgroundColor: '#5c000c'}}>
              TL
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide">Travelink</div>
              <div className="text-[10px] text-white font-medium opacity-80">Admin Portal</div>
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
            <ProfileMenu />
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-[#7a0019] shadow transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Logout"
              title="Logout"
              suppressHydrationWarning
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <LogoutConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          isLoading={loggingOut}
        />

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

      {/* Help Button */}
      <HelpButton role="admin" />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        shortcuts={[
          { key: "d", description: "Dashboard", action: () => router.push("/admin") },
          { key: "i", description: "Inbox", action: () => router.push("/admin/inbox") },
          { key: "s", description: "Schedule", action: () => router.push("/admin/schedule") },
          { key: "v", description: "Vehicles", action: () => router.push("/admin/vehicles") },
          { key: "r", description: "Requests (Inbox)", action: () => router.push("/admin/inbox") },
          { key: "u", description: "Users", action: () => router.push("/admin/users") },
          { key: "a", description: "Activity Log", action: () => router.push("/admin/activity") },
        ]}
      />
    </div>
    </>
  );
}
