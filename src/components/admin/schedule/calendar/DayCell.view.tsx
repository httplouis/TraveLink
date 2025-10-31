"use client";

import { statusOf } from "@/lib/admin/schedule/calendar/aggregate";
import { isSameMonth, toISODate } from "@/lib/admin/schedule/calendar/date";
import { useScheduleCalendar } from "@/lib/admin/schedule/calendar/store";

type Props = {
  date: Date;
  monthAnchor: string;
  used: number;
  capacity: number;
};

export default function DayCell({ date, monthAnchor, used, capacity }: Props) {
  const left = Math.max(capacity - used, 0);
  const status = statusOf(used, capacity);
  const { filters } = useScheduleCalendar();

  const dim = !isSameMonth(date, monthAnchor);
  const isToday = toISODate(date) === toISODate(new Date());

  const pill =
    status === "full"
      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
      : status === "partial"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

  const show =
    filters.status === "all" ||
    (filters.status === "available" && status === "available") ||
    (filters.status === "partial" && status === "partial") ||
    (filters.status === "full" && status === "full");

  return (
    <div
      className={[
        "rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition",
        "hover:shadow-md",
        dim ? "bg-neutral-50 text-neutral-400" : "text-neutral-800",
        isToday ? "ring-2 ring-blue-400" : "",
        show ? "" : "opacity-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{date.getDate()}</div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${pill}`}>
          {status === "full" ? "Full" : status === "partial" ? `${left} left` : "Available"}
        </span>
      </div>

      <div className="mt-4 text-[11px] text-neutral-500">
        {used}/{capacity}
      </div>
    </div>
  );
}
