// src/components/admin/notifications/ui/NotificationsPanel.ui.tsx
"use client";

import * as React from "react";
import { Popover } from "@headlessui/react";
import NotificationItem from "./NotificationItem.ui";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationsPanel() {
  const { tab, setTab, items, unreadCount, markAll, markOne, pushDemo } =
    useNotifications();

  return (
    <Popover className="relative">
      <Popover.Button
        aria-label="Open notifications"
        className="relative inline-flex h-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 px-3 text-white/90 backdrop-blur transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        {/* Bell glyph (SVG inline to avoid external import churn) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 20a2 2 0 1 1-4 0m9-2H5a2 2 0 0 0 2-2v-4a5 5 0 1 1 10 0v4a2 2 0 0 0 2 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-[#7a0019]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Popover.Button>

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
            {/* demo inject button (remove in prod) */}
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
            className="rounded-lg px-3 py-1.5 text-[#7a0019] hover:bg-neutral-50"
          >
            See all notifications
          </a>
        </div>
      </Popover.Panel>
    </Popover>
  );
}
