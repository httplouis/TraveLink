// src/components/admin/nav/NotificationBell.tsx
"use client";

import * as React from "react";
import { Popover } from "@headlessui/react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/admin/notifications/hooks/useNotifications";
import NotificationItem from "@/components/admin/notifications/ui/NotificationItem.ui";

type Props = {
  /** Optional manual badge override. If omitted, we use unreadCount from the hook. */
  count?: number;
  /** Button styling preset */
  variant?: "light" | "onMaroon";
  className?: string;
};

const BRAND = "#7A0010";

export default function NotificationBell({
  count,
  variant = "light",
  className = "",
}: Props) {
  const { tab, setTab, items, unreadCount, markAll, markOne, pushDemo } =
    useNotifications();

  // prefer hook count; fall back to prop if provided
  const badge = typeof count === "number" ? count : unreadCount;
  const isMaroon = variant === "onMaroon";

  const btnBase =
    "relative inline-flex h-10 items-center justify-center rounded-xl px-3 transition focus:outline-none focus:ring-2";
  const btnTheme = isMaroon
    ? "border border-white/20 bg-white/10 text-white hover:bg-white/15 focus:ring-white/40"
    : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-300";

  return (
    <Popover className={`relative ${className}`}>
      <Popover.Button aria-label="Open notifications" className={`${btnBase} ${btnTheme}`}>
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none text-white"
            style={{ background: BRAND }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Popover.Button>

      {/* Dropdown panel */}
      <Popover.Panel className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border bg-white text-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "unread"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Unread {unreadCount ? `(${unreadCount})` : ""}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAll}
              className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
            >
              Mark all read
            </button>
            {/* demo seed — pwede mong tanggalin sa prod */}
            <button
              onClick={pushDemo}
              className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
              title="Push demo notification"
            >
              + Demo
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[70vh] overflow-auto p-2">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">
              No notifications.
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationItem data={n} onRead={markOne} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2 text-center text-sm">
          <a
            href="/admin/notifications"
            className="rounded-lg px-3 py-1.5 text-[color:var(--brand,#7A0010)] hover:bg-neutral-50"
            style={{ ["--brand" as any]: BRAND }}
          >
            See all notifications
          </a>
        </div>
      </Popover.Panel>
    </Popover>
  );
}
