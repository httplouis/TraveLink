// src/components/admin/schedule/ui/AdminMonthCalendar.ui.tsx
"use client";

import * as React from "react";

type CalendarRequest = {
  id: string;
  request_number: string;
  title: string;
  status: string;
  requester_name: string;
  department: string;
  vehicle: { name: string; type: string; plate_number: string };
  driver: { name: string };
};

type CalendarData = Record<string, {
  total: number;
  available: number;
  requests: CalendarRequest[];
}>;

type AvailabilityMap = Record<string, number>;

export default function AdminMonthCalendar({
  month,
  year,
  availability,
  calendarData,
  onPrev,
  onNext,
  onSelectDate,
  selectedISO,
}: {
  month: number; // 0..11
  year: number;
  availability: AvailabilityMap;
  calendarData: CalendarData;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (iso: string) => void;
  selectedISO: string | null;
}) {
  // Build grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weeks: Array<(string | null)[]> = [];
  const mm = String(month + 1).padStart(2, "0");

  let current = 1 - firstDay;
  while (current <= daysInMonth) {
    const row: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (current < 1 || current > daysInMonth) row.push(null);
      else {
        const dd = String(current).padStart(2, "0");
        row.push(`${year}-${mm}-${dd}`);
      }
      current++;
    }
    weeks.push(row);
  }

  const monthName = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-md shadow-black/5 p-5">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SoftIconBtn ariaLabel="Previous month" onClick={onPrev}>‹</SoftIconBtn>
          <SoftIconBtn ariaLabel="Next month" onClick={onNext}>›</SoftIconBtn>
          <div className="ml-2 text-sm font-semibold text-neutral-900">{monthName}</div>
        </div>
        <Legend />
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-2 text-[11px] text-neutral-500 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 gap-2">
        {weeks.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((iso, j) =>
              iso ? (
                <DayCell
                  key={iso}
                  iso={iso}
                  used={availability[iso] ?? 0}
                  selected={selectedISO === iso}
                  onClick={() => onSelectDate(iso)}
                  data={calendarData[iso]}
                />
              ) : (
                <div key={`blank-${i}-${j}`} />
              )
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------------- atoms ---------------- */

function SoftIconBtn({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="h-9 w-9 rounded-xl border border-neutral-200 bg-white text-sm
                 shadow-sm shadow-black/5 hover:bg-neutral-100
                 focus:outline-none focus:ring-2 focus:ring-indigo-200
                 active:translate-y-[1px] transition"
    >
      {children}
    </button>
  );
}

function DayCell({
  iso,
  used,
  selected,
  onClick,
  data,
}: {
  iso: string;
  used: number;
  selected: boolean;
  onClick: () => void;
  data?: { total: number; available: number; requests: CalendarRequest[] };
}) {
  const status = used >= 5 ? "full" : used > 0 ? "partial" : "available";
  const available = data?.available ?? (5 - used);

  // badge styles
  const pill =
    status === "full"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : status === "partial"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  // tile gradient + ring
  const base =
    "group h-28 rounded-2xl bg-[linear-gradient(180deg,#ffffff,#fafafa)] " +
    "border border-neutral-200/70 text-left p-2 shadow-sm shadow-black/5 " +
    "hover:shadow-md hover:bg-white transition focus:outline-none " +
    "focus:ring-2 focus:ring-indigo-200";
  const sel = selected ? " ring-2 ring-indigo-400 " : " ring-0 ";

  const day = Number(iso.slice(-2));

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Date ${iso} with ${used} of 5 slots`}
      className={base + sel}
    >
      <div className="flex items-start justify-between text-xs">
        <div className="font-semibold text-neutral-900">{day}</div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${pill}`}>
            {status === "available" ? "Available" : status === "partial" ? `${available} left` : "Full"}
          </span>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-neutral-500">{used}/5 slots</div>
      {data && data.requests.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {data.requests.slice(0, 2).map((req) => (
            <div key={req.id} className="text-[9px] text-neutral-600 truncate">
              {req.requester_name} • {req.department}
            </div>
          ))}
          {data.requests.length > 2 && (
            <div className="text-[9px] text-neutral-400">+{data.requests.length - 2} more</div>
          )}
        </div>
      )}
    </button>
  );
}

function Legend() {
  return (
    <div className="hidden md:flex items-center gap-3 text-xs text-neutral-600">
      <LegendDot className="bg-emerald-500" label="Available" />
      <LegendDot className="bg-amber-500" label="Partial" />
      <LegendDot className="bg-rose-500" label="Full" />
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
      <span>{label}</span>
    </span>
  );
}

