// src/components/admin/nav/TopBar.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProfileMenu from "./ProfileMenu";
import { Bell, Search as SearchIcon } from "lucide-react";

const BRAND = "#7A0010"; // maroon

export default function TopBar() {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* thin maroon line */}
      <div className="h-1 w-full" style={{ background: BRAND }} />

      {/* white bar */}
      <div className="h-14 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_minmax(720px,700px)_1fr] items-center gap-3 px-3 sm:px-4">
          {/* LEFT: brand */}
          <div className="justify-self-start">
            <Link href="/admin" className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ background: BRAND }}
              >
                TL
              </div>
              <span
                className="hidden text-[15px] font-semibold tracking-tight sm:block"
                style={{ color: BRAND }}
              >
                TraviLink Admin
              </span>
            </Link>
          </div>

          {/* CENTER: search */}
          <div className="w-full justify-self-center" suppressHydrationWarning>
            <div className="relative mx-auto w-full">
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search schedules, vehicles, drivers…"
                className="h-10 w-full rounded-xl bg-white pl-9 pr-24 text-sm text-neutral-900 placeholder-neutral-500 ring-1 ring-neutral-200 outline-none transition focus:ring-2"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
                autoComplete="off"
              />
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              {/* kbd hint */}
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden items-center gap-1 sm:flex">
                <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-600">
                  Ctrl
                </kbd>
                <span className="text-[10px] text-neutral-500">/</span>
                <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-600">
                  ⌘
                </kbd>
                <span className="text-[10px] text-neutral-500">+</span>
                <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-600">
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* RIGHT: utils */}
          <div className="justify-self-end" suppressHydrationWarning>
            <div className="flex items-center gap-3">
              <button
                title="Notifications"
                className="relative inline-flex h-10 items-center justify-center rounded-xl px-2.5 text-neutral-700 transition hover:bg-neutral-100"
                style={{ color: BRAND }}
              >
                <Bell className="h-5 w-5" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                  style={{ background: BRAND }}
                >
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
