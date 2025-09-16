"use client";
import React, { useState } from "react";
import type { Notif, NotifType } from "@/lib/travilink";
import { IconFile, IconInfo, IconUser, IconWrench } from "@/components/ui/Icons";

export default function NotificationHub({
  open,
  items,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onClearOne,
  onClearAll,
}: {
  open: boolean;
  items: Notif[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearOne: (id: string) => void;
  onClearAll: () => void;
}) {
  const [filter, setFilter] = useState<"all" | NotifType>("all");
  if (!open) return null;

  const filterTabs: { key: "all" | NotifType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "request", label: "Requests" },
    { key: "maintenance", label: "Maintenance" },
    { key: "driver", label: "Drivers" },
    { key: "system", label: "System" },
  ];

  const filtered = filter === "all" ? items : items.filter((n) => n.type === filter);

  const typeStyle = (t: NotifType) =>
    t === "request"
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
      : t === "maintenance"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : t === "driver"
      ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
      : "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200";

  const IconFor = (t: NotifType) =>
    t === "request" ? <IconFile /> : t === "maintenance" ? <IconWrench /> : t === "driver" ? <IconUser /> : <IconInfo />;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 top-[52px] right-2 sm:right-4 w-[92vw] max-w-sm rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden"
        role="dialog"
        aria-label="Notifications"
      >
        <div className="px-3 py-2 bg-gradient-to-b from-[#7A0010] to-[#4E0009] text-white flex items-center justify-between">
          <div className="font-semibold text-sm">Notifications</div>
          <div className="flex items-center gap-2">
            <button className="text-xs underline decoration-white/40 hover:decoration-white" onClick={onMarkAllRead}>
              Mark all read
            </button>
            <button className="text-xs underline decoration-white/40 hover:decoration-white" onClick={onClearAll}>
              Clear
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-neutral-200 bg-white/60 backdrop-blur">
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                className={`px-2.5 py-1 rounded-full text-xs ring-1 transition-colors ${
                  filter === t.key
                    ? "bg-[#7A0010] text-white ring-[#7A0010]"
                    : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
                }`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto p-2 space-y-2 bg-gradient-to-b from-white to-neutral-50">
          {filtered.length === 0 && <div className="text-sm text-neutral-500 px-2 py-8 text-center">No notifications.</div>}
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border p-3 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                n.unread ? "border-[#7A0010]/25 ring-1 ring-[#7A0010]/10" : "border-neutral-200"
              }`}
              onMouseEnter={() => n.unread && onMarkRead(n.id)}
            >
              <div className={`h-7 w-7 rounded-full grid place-items-center ${typeStyle(n.type)}`}>{IconFor(n.type)}</div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{n.title}</div>
                {n.body && <div className="text-xs text-neutral-600 truncate">{n.body}</div>}
                <div className="text-[11px] text-neutral-400 mt-0.5">{n.time}</div>
              </div>

              <div className="flex items-center gap-1">
                {n.unread && <span className="inline-block h-2 w-2 rounded-full bg-[#7A0010]" />}
                <button
                  aria-label="Dismiss"
                  className="h-7 w-7 grid place-items-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[#7A0010] focus:outline-none focus:ring-2 focus:ring-[#7A0010]/40"
                  onClick={() => onClearOne(n.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
