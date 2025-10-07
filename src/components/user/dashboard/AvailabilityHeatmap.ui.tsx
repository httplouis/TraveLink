// src/components/user/dashboard/AvailabilityHeatmap.ui.tsx
"use client";
import { Trip } from "@/lib/user/schedule/types";
import { getDayStatus } from "@/lib/user/schedule/utils";

export default function AvailabilityHeatmap({ trips }: { trips: Trip[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const color = (s: "available" | "partial" | "full") =>
    s === "full" ? "bg-rose-200" : s === "partial" ? "bg-amber-200" : "bg-neutral-200";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 text-sm font-medium text-gray-900">Capacity (next 30 days)</div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((d) => {
          const status = getDayStatus(trips, d);
          return (
            <div key={d.toDateString()} className="flex aspect-square items-center justify-center rounded"
                 title={`${d.toDateString()} • ${status}`}>
              <div className={`h-4 w-4 rounded ${color(status)}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-600">
        <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded bg-neutral-200 inline-block" /> Available</span>
        <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded bg-amber-200 inline-block" /> Partial</span>
        <span className="inline-flex items-center gap-1"><i className="h-3 w-3 rounded bg-rose-200 inline-block" /> Full</span>
      </div>
    </div>
  );
}
