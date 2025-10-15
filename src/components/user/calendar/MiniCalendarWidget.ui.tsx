"use client";

import { useMemo } from "react";
import type { Trip } from "@/lib/user/schedule/types";

type Props = {
  trips: Trip[];
  onOpenSchedule?: () => void;
  maxItems?: number;
  title?: string;
};

export default function MiniCalendarWidget({
  trips,
  onOpenSchedule,
  maxItems = 6,
  title = "Next requests",
}: Props) {
  const items = useMemo(() => {
    const now = new Date();
    return [...trips]
      .filter((t) => new Date(t.start) >= now)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))
      .slice(0, maxItems);
  }, [trips, maxItems]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <button onClick={onOpenSchedule} className="text-xs font-medium text-[#7A0010] hover:underline">
          View full calendar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming trips.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="rounded-xl bg-gray-50 p-3">
              <div className="truncate text-sm font-medium text-gray-900">
                {t.destination}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(t.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {new Date(t.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                {" – "}
                {new Date(t.end).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="truncate text-xs text-gray-500">
                {t.vehicle} · {t.department} · {t.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
