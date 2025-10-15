"use client";

import { useMemo, useState } from "react";
import BigCalendarView from "./BigCalendarView.ui";
import type { Trip, DayStatus } from "@/lib/user/schedule/types";
import { getDayStatus } from "@/lib/user/schedule/utils";

export type CalendarViewMode = "month" | "week";

export type BigCalendarContainerProps = {
  trips: Trip[];
  onSelectDay?: (date: Date) => void;
  initial?: Date;
  mode?: CalendarViewMode;                // optional controlled
  onModeChange?: (m: CalendarViewMode) => void; // optional controlled
};

export default function BigCalendarContainer({
  trips,
  onSelectDay,
  initial = new Date(),
  mode: controlledMode,
  onModeChange,
}: BigCalendarContainerProps) {
  const [cursor, setCursor] = useState<Date>(new Date(initial));
  const [uncontrolledMode, setUncontrolledMode] = useState<CalendarViewMode>("month");

  const mode = controlledMode ?? uncontrolledMode;
  const setMode = (m: CalendarViewMode) => {
    if (onModeChange) onModeChange(m);
    else setUncontrolledMode(m);
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const startOfWeekMon = (d: Date) => {
    const tmp = new Date(d);
    const js = tmp.getDay(); // 0..6 Sun..Sat
    const monIndex = (js + 6) % 7;
    tmp.setDate(tmp.getDate() - monIndex);
    tmp.setHours(0, 0, 0, 0);
    return tmp;
  };

  const days: (Date | null)[] = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeekMon(cursor);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    const out: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor, mode, year, month]);

  const goPrev = () => {
    if (mode === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() - 7);
      setCursor(d);
    } else setCursor(new Date(year, month - 1, 1));
  };
  const goNext = () => {
    if (mode === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() + 7);
      setCursor(d);
    } else setCursor(new Date(year, month + 1, 1));
  };
  const setMonth = (m: number) => setCursor(new Date(year, m, 1));
  const setYear = (y: number) => setCursor(new Date(y, month, 1));
  const jumpToday = () => {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  return (
    <BigCalendarView
      cursor={cursor}
      days={days}
      mode={mode}
      setMode={setMode}
      getStatus={(d: Date | null): DayStatus => (d ? getDayStatus(trips, d) : "available")}
      onPrev={goPrev}
      onNext={goNext}
      onSetMonth={setMonth}
      onSetYear={setYear}
      onToday={jumpToday}
      onSelectDay={(d: Date) => onSelectDay?.(d)}
    />
  );
}
