"use client";

import { useEffect, useMemo } from "react";
import { groupByDay } from "@/lib/admin/schedule/calendar/aggregate";
import { monthMatrix, toISODate } from "@/lib/admin/schedule/calendar/date";
import { useScheduleCalendar, initCalendarDataOnce } from "@/lib/admin/schedule/calendar/store";
import DayCell from "./DayCell.view";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid() {
  const { schedules, capacityPerDay, filters } = useScheduleCalendar();

  useEffect(() => {
    initCalendarDataOnce();
  }, []);

  const map = useMemo(() => groupByDay(schedules, capacityPerDay), [schedules, capacityPerDay]);
  const weeks = useMemo(() => monthMatrix(filters.monthAnchor), [filters.monthAnchor]);

  return (
    <div className="mt-2">
      <div className="grid grid-cols-7 gap-3 rounded-2xl bg-neutral-50 px-3 py-2 text-center text-xs font-medium text-neutral-600">
        {weekdays.map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-3">
        {weeks.flat().map((d, i) => {
          const iso = toISODate(d);
          const stat = map[iso] ?? { dateISO: iso, used: 0, capacity: capacityPerDay };
          return (
            <DayCell
              key={iso + "_" + i}
              date={d}
              monthAnchor={filters.monthAnchor}
              used={stat.used}
              capacity={stat.capacity}
            />
          );
        })}
      </div>
    </div>
  );
}
