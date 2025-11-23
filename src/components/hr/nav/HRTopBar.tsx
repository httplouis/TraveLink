"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import HRNotificationDropdown from "./HRNotificationDropdown";

export default function HRTopBar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("[HRTopBar] Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0019] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/hr" className="inline-flex items-center gap-3 group">
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
              <span className="h-6 w-px bg-white/30" />
              <span className="opacity-90 text-sm font-medium">HR Portal</span>
            </div>
          </Link>
        </div>

        {/* Actions - Notifications, Logout */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <HRNotificationDropdown />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
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
