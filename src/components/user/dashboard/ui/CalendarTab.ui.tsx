"use client";

import { addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function CalendarTab() {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="bg-white p-4 rounded-md border">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <button
            key={day.toISOString()}
            className="aspect-square rounded-md border text-sm hover:bg-neutral-100"
          >
            {day.getDate()}
          </button>
        ))}
      </div>
      <div className="flex justify-end mt-3 text-xs text-neutral-500 gap-3">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded" />Available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-200 rounded" />Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded" />Full</span>
      </div>
    </div>
  );
}
