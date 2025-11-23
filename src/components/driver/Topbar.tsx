"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell } from "lucide-react";

export default function Topbar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--brand)] text-white border-b border-white/10">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        {/* Brand — now clickable to /driver with small gray "| Driver" */}
        <Link href="/driver" className="flex items-center gap-3 group">
          <div className="relative h-9 w-9 rounded-lg bg-white p-1.5 shadow-md">
            <Image
              src="/travelink.png"
              alt="Travelink Logo"
              width={28}
              height={28}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">Travelink</span>
            <span className="h-6 w-px bg-white/30" />
            <span className="text-white/90 text-sm font-medium">
              Driver
            </span>
          </div>
        </Link>

        {/* Right side: search + bell */}
        <div className="flex items-center gap-3">
          <div className="relative w-[220px] sm:w-[280px] md:w-[340px]">
            <input
              placeholder="Search schedules, vehicles, drivers…"
              className="w-full rounded-full bg-white pl-9 pr-3 py-2 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-500)] outline-none border border-white/30 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-500)]" />
          </div>
          <button
            aria-label="Notifications"
            className="inline-grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/20"
          >
            <Bell className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
