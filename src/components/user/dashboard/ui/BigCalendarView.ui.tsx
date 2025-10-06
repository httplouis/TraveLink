"use client";

import { getDayStatus } from "@/lib/user/schedule/utils";
import type { Trip } from "@/lib/user/schedule/types";

export type BigCalendarViewProps = {
  year: number;
  month: number;
  trips: Trip[];
  onPrev: () => void;
  onNext: () => void;
  onPickMonth: (m: number, y: number) => void;
  onSelectDay: (d: Date) => void;
};

export default function BigCalendarView({
  year,
  month,
  trips,
  onPrev,
  onNext,
  onPickMonth,
  onSelectDay,
}: BigCalendarViewProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // offset for Monday start
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const days: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);

  return (
    <div className="p-4 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-center mb-4 gap-3">
        <button
          onClick={onPrev}
          className="px-2 py-1 text-neutral-600 hover:text-[#7a0019] transition"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          {/* Month dropdown */}
          <select
            value={month}
            onChange={(e) => onPickMonth(parseInt(e.target.value), year)}
            className="bg-transparent font-semibold text-lg text-neutral-800 focus:outline-none cursor-pointer"
          >
            {months.map((m, i) => (
              <option key={i} value={i} className="text-black">
                {m}
              </option>
            ))}
          </select>

          {/* Year dropdown */}
          <select
            value={year}
            onChange={(e) => onPickMonth(month, parseInt(e.target.value))}
            className="bg-transparent font-semibold text-lg text-neutral-800 focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y} className="text-black">
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onNext}
          className="px-2 py-1 text-neutral-600 hover:text-[#7a0019] transition"
        >
          →
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 text-center font-medium text-neutral-600 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weeks.map((week, i) =>
          week.map((day, j) => {
            if (!day) return <div key={`${i}-${j}`} />;
            const status = getDayStatus(trips, day);

            let bg = "bg-neutral-100";
            if (status === "partial") bg = "bg-yellow-200";
            if (status === "full") bg = "bg-red-200";

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDay(day)}
                className={`h-16 rounded-md text-sm ${bg} hover:brightness-95 transition`}
              >
                {day.getDate()}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-sm justify-center text-neutral-700">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 bg-neutral-100 rounded"></span> Available
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 bg-yellow-200 rounded"></span> Partial
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 bg-red-200 rounded"></span> Full
        </div>
      </div>
    </div>
  );
}
