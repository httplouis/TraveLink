"use client";

import Legend from "./Legend.ui";
import { addMonths, fmtMonthTitle } from "@/lib/admin/schedule/calendar/date";
import { useScheduleCalendar } from "@/lib/admin/schedule/calendar/store";

export default function MonthHeader() {
  const { filters, setMonth } = useScheduleCalendar();

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          className="h-9 w-9 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 active:scale-[0.98]"
          onClick={() => setMonth(addMonths(filters.monthAnchor, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="px-2 text-base font-semibold text-neutral-800">
          {fmtMonthTitle(filters.monthAnchor)}
        </div>
        <button
          className="h-9 w-9 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 active:scale-[0.98]"
          onClick={() => setMonth(addMonths(filters.monthAnchor, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <Legend />
    </div>
  );
}
