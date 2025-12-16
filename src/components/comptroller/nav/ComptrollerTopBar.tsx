"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import ComptrollerNotificationDropdown from "./ComptrollerNotificationDropdown";
import { LogoutConfirmDialog } from "@/components/common/LogoutConfirmDialog";

export default function ComptrollerTopBar() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/comptroller" className="inline-flex items-center gap-3 group">
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
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight">Travelink</span>
                <span className="h-6 w-px bg-gray-300" />
                <span className="opacity-90 text-sm font-medium">Comptroller</span>
              </div>
            </Link>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <ComptrollerNotificationDropdown />
            
            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        isLoading={loggingOut}
      />
    </>
  );
}
