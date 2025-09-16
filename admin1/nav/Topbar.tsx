// src/components/nav/Topbar.tsx
"use client";

import { Bell, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Topbar() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/admin/requests?query=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4">
        {/* Brand */}
        <Link href="/admin" className="mr-1 grid h-7 w-7 place-items-center rounded-lg bg-rose-800 text-white text-sm font-bold">
          TL
        </Link>
        <span className="hidden sm:block font-semibold mr-2">TraviLink Admin</span>

        {/* Search */}
        <form onSubmit={onSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schedules, vehicles, drivers…"
            className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-24 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block rounded border bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-500">
            Ctrl / ⌘ + K
          </kbd>
        </form>

        {/* Quick buttons */}
        <Link
          href="/admin/requests?new=1"
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
          title="New Request"
        >
          <Plus className="h-4 w-4" /> New
        </Link>
        <Link
          href="/admin/schedule?new=1"
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800"
          title="Schedule Trip"
        >
          <Sparkles className="h-4 w-4" /> Schedule
        </Link>
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-600" />
        </button>
        <Link
          href="/admin/profile"
          className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm hover:bg-neutral-50"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
