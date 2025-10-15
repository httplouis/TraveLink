"use client";

import Link from "next/link";
import { Bell, CircleUserRound } from "lucide-react";

export default function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0019] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/user" className="inline-flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-[#7a0019] text-sm font-semibold">
              TL
            </span>
            <span className="font-medium">TraviLink</span>
          </Link>
          <span className="opacity-70">|</span>
          <span className="opacity-90">User</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/user/notifications"
            className="relative rounded-full p-2 hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-[3px] text-[10px] leading-4 text-[#7a0019]">
              2
            </span>
          </Link>
          <Link
            href="/user/profile"
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Profile"
          >
            <CircleUserRound className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
