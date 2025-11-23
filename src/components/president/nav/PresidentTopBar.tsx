"use client";

import Link from "next/link";
import Image from "next/image";
import PresidentNotificationDropdown from "./PresidentNotificationDropdown";

export default function PresidentTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 bg-[#7a0019] text-white">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Logo + App Name */}
        <div className="flex items-center gap-3">
          <Link href="/president" className="inline-flex items-center gap-3 group">
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
              <span className="opacity-90 text-sm font-medium">President Portal</span>
            </div>
          </Link>
        </div>

        {/* Actions - Only Notifications */}
        <div className="flex items-center gap-1">
          <PresidentNotificationDropdown />
        </div>
      </div>
    </header>
  );
}

