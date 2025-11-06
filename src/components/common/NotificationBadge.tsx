// src/components/common/NotificationBadge.tsx
"use client";

import React from "react";
import { Bell } from "lucide-react";

type Props = {
  count: number;
  onClick?: () => void;
};

/**
 * Notification badge with count indicator
 * Shows red badge when there are pending items
 */
export default function NotificationBadge({ count, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={`${count} notifications`}
    >
      <Bell className="h-5 w-5 text-gray-700" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
