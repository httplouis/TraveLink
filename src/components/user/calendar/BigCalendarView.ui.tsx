"use client";

import clsx from "clsx";
import { useMemo } from "react";
import type { CalendarViewMode } from "./BigCalendarContainer";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

type Props = {
  cursor: Date;
  days: (Date | null)[];
  mode: CalendarViewMode;
  setMode: (m: CalendarViewMode) => void;
  getStatus: (d: Date | null) => "available" | "partial" | "full";
  onPrev: () => void;
  onNext: () => void;
  onSetMonth: (m: number) => void;
  onSetYear: (y: number) => void;
  onToday: () => void;
  onSelectDay: (d: Date) => void;
  className?: string;
};

export default function BigCalendarView({
  cursor,
  days,
  mode,
  setMode,
  getStatus,
  onPrev,
  onNext,
  onSetMonth,
  onSetYear,
  onToday,
  onSelectDay,
  className,
}: Props) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const todayKey = new Date().toDateString();
  const years = useMemo(
    () => Array.from({ length: 11 }, (_, i) => y - 5 + i),
    [y]
  );

  // sizing
  const gap = mode === "week" ? "gap-3" : "gap-3";
  const cell =
    mode === "week"
      ? "h-16 md:h-20 text-sm"
      : "min-h-16 md:min-h-18 text-sm";

  return (
    <div className={clsx("select-none", className)}>
      {/* Sticky, centered header */}
      <div className="sticky top-0 z-10 -mx-5 mb-4 bg-white/85 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
          <NavButton ariaLabel="Previous" onClick={onPrev}>
            <ChevronLeft />
          </NavButton>

          <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-1.5 ring-1 ring-neutral-200/60 shadow-sm">
            <PrettySelect
              value={m}
              onChange={(e) => onSetMonth(Number(e.currentTarget.value))}
              options={MONTHS.map((mm, i) => ({ label: mm, value: i }))}
            />
            <Dot />
            <PrettySelect
              value={y}
              onChange={(e) => onSetYear(Number(e.currentTarget.value))}
              options={years.map((yy) => ({ label: String(yy), value: yy }))}
            />
          </div>

          <NavButton ariaLabel="Next" onClick={onNext}>
            <ChevronRight />
          </NavButton>

          <button
            onClick={onToday}
            className="rounded-xl px-3 py-1.5 text-xs font-medium text-[#7A0010] ring-1 ring-[#7A0010]/30 hover:bg-[#7A0010]/5 transition"
          >
            Today
          </button>

          {/* View toggle */}
          <div className="ml-2 inline-flex overflow-hidden rounded-xl ring-1 ring-neutral-300">
            <ToggleBtn active={mode === "month"} onClick={() => setMode("month")}>
              Month
            </ToggleBtn>
            <ToggleBtn active={mode === "week"} onClick={() => setMode("week")}>
              Week
            </ToggleBtn>
          </div>

          {/* Legend (kept subtle) */}
          <div className="ml-2 flex items-center gap-2 text-xs">
            <Badge className="bg-neutral-200 text-neutral-800">Available</Badge>
            <Badge className="bg-amber-200 text-amber-900">Partial</Badge>
            <Badge className="bg-rose-200 text-rose-900">Full</Badge>
          </div>
        </div>
      </div>

      {/* Week header (Mon start) */}
      <div className={clsx("grid grid-cols-7", gap)}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[12px] font-medium text-neutral-600"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className={clsx("mt-1 grid grid-cols-7", gap)}>
        {days.map((d, i) => {
          const isValid = d instanceof Date && !isNaN(+d);
          const status = getStatus(d ?? null);
          const isToday = isValid && d!.toDateString() === todayKey;

          const bg = !isValid
            ? "bg-transparent"
            : status === "full"
            ? "bg-rose-50"
            : status === "partial"
            ? "bg-amber-50"
            : "bg-neutral-50";

          return (
            <button
              key={i}
              disabled={!isValid}
              onClick={() => isValid && onSelectDay(d!)}
              className={clsx(
                "flex items-center justify-center rounded-2xl transition",
                "hover:shadow-sm hover:bg-white",
                bg,
                !isValid && "cursor-default",
                cell,
                isToday && "ring-2 ring-[#7A0010]"
              )}
            >
              {isValid ? d!.getDate() : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* —————— UI bits —————— */

function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5",
        className
      )}
    >
      {children}
    </span>
  );
}

function Dot() {
  return <span className="mx-1 h-1 w-1 rounded-full bg-neutral-300" />;
}

function PrettySelect({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: number }[];
}) {
  return (
    <select
      className="rounded-xl bg-transparent px-2 py-1.5 text-sm outline-none hover:bg-white"
      value={value}
      onChange={onChange}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-white text-[#7A0010]"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      )}
    >
      {children}
    </button>
  );
}

function NavButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-neutral-300/70 hover:bg-neutral-50 transition"
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
