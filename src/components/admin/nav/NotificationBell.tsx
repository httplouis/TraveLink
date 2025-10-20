// src/components/admin/nav/NotificationBell.tsx
"use client";

import * as React from "react";
import { Bell } from "lucide-react";

type Props = {
  count?: number;
  variant?: "light" | "onMaroon";
  className?: string;
};

export default function NotificationBell({ count = 0, variant = "light", className = "" }: Props) {
  const isMaroon = variant === "onMaroon";
  const show = (count ?? 0) > 0;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className={[
          "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          isMaroon
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
        ].join(" ")}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
      </button>
      {show && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold leading-none text-white">
          {count}
        </span>
      )}
    </div>
  );
}
