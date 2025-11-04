"use client";

import Link from "next/link";
import { Bell, CircleUserRound, LogOut } from "lucide-react";
import { useState } from "react";

export default function ExecTopBar() {
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
        <div className="flex items-center gap-3">
          <Link href="/exec/dashboard" className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[#7a0019] text-sm font-semibold">
              TL
            </span>
            <span className="font-medium">TraviLink</span>
          </Link>
          <span className="opacity-70">|</span>
          <span className="opacity-90">Executive</span>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/exec/notifications" className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
          <Link href="/exec/profile" className="rounded-full p-2 hover:bg-white/10" aria-label="Profile">
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
