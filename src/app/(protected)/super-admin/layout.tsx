// src/app/(protected)/super-admin/layout.tsx
"use client";

import "@/app/globals.css";
import { useState } from "react";
import SuperAdminNav from "@/components/super-admin/nav/SuperAdminNav";
import HelpButton from "@/components/common/HelpButton";
import { LogoutConfirmDialog } from "@/components/common/LogoutConfirmDialog";
import { Shield, Search, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/super-admin" className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">Travelink</div>
                  <div className="text-xs text-gray-500 font-medium">Super Admin Portal</div>
                </div>
              </Link>

              {/* Search */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users, departments..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                    suppressHydrationWarning
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Transport Admin →
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                  title="Logout"
                  suppressHydrationWarning
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Dialog */}
        <LogoutConfirmDialog
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          isLoading={loggingOut}
        />

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-4">
            {/* Sidebar - Made narrower and sticky */}
            <aside className="w-48 flex-shrink-0 sticky top-20 self-start">
              <SuperAdminNav />
            </aside>

            {/* Main Content - More space for table */}
            <main className="flex-1 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">{children}</div>
              </div>
            </main>
          </div>
        </div>

        {/* Help Button */}
        <HelpButton role="admin" />
      </div>
    </>
  );
}

