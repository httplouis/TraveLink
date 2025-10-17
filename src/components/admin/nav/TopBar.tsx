"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ProfileMenu from "./ProfileMenu";

const BRAND = "#7A0010";
const BRAND_DARK = "#60000C";

export default function TopBar() {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-40">
      <div
        className="h-14 w-full border-b border-white/10 text-white"
        style={{
          background: `linear-gradient(180deg, ${BRAND} 0%, ${BRAND} 60%, ${BRAND_DARK} 100%)`,
        }}
      >
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_minmax(720px,700px)_1fr] items-center gap-3 px-3 sm:px-4">
          {/* LEFT: brand */}
          <div className="justify-self-start">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/30 text-xs font-bold">
                TL
              </div>
              <span className="hidden sm:block text-[15px] font-semibold tracking-tight">
                TraviLink Admin
              </span>
            </Link>
          </div>

          {/* CENTER: search */}
          <div className="justify-self-center w-full" suppressHydrationWarning>
            <div className="relative mx-auto w-full">
              <input
                ref={searchRef}
                defaultValue={q} // ✅ defaultValue instead of value
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search schedules, vehicles, drivers…  (Ctrl/⌘+K)"
                className="h-10 w-full rounded-lg bg-white/95 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-500 ring-1 ring-black/10 outline-none transition focus:ring-2 focus:ring-white/70"
              />
              <svg
                className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M13 14a6 6 0 1 1 1-1l3 3-1 1-3-3Zm-5 0a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* RIGHT: utils */}
          <div className="justify-self-end" suppressHydrationWarning>
            <div className="flex items-center gap-3">
              <button
                title="Notifications"
                className="relative h-9 rounded-md px-2 text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2ZM19 17h-14l2-2v-4a5 5 0 1 1 10 0v4l2 2Z" />
                </svg>
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-[var(--admin-brand,#7A0010)]">
                  3
                </span>
              </button>

              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
