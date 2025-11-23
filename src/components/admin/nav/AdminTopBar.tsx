"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, CircleUserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTopBar() {
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
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0010] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="inline-flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg bg-white p-1.5 shadow-md">
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
              <span className="opacity-90 text-sm font-medium">Admin</span>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/admin/notifications"
            className="relative rounded-full p-2 hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-[3px] text-[10px] leading-4 text-[#7a0010]">
              2
            </span>
          </Link>
          <Link
            href="/admin/profile"
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
