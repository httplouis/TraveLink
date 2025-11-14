"use client";

import Link from "next/link";
import { CircleUserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

export default function TopBar() {
  const router = useRouter();
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
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0019] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/user" className="inline-flex items-center gap-2.5 group">
            <div className="relative">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#7a0019] text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
                TL
              </span>
              {/* Logo placeholder - ready for image */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">TraviLink</span>
              <span className="text-xs opacity-80 font-normal">Travel Management System</span>
            </div>
          </Link>
          <span className="h-6 w-px bg-white/30" />
          <span className="opacity-90 text-sm font-medium">User Portal</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          <Link
            href="/user/profile"
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Profile"
          >
            <CircleUserRound className="h-6 w-6" />
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
