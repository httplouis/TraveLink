"use client";
import * as React from "react";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import type { Schedule } from "@/lib/admin/schedule/types";

function startOfWeek(d = new Date()) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0,0,0,0); x.setDate(x.getDate() - day); return x;
}
function endOfWeek(d = new Date()) {
  const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e;
}
function within(dateStr: string, a: Date, b: Date) {
  const d = new Date(dateStr + "T00:00:00"); return d >= a && d <= b;
}
function inNextDays(dateStr: string, days: number) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(today); end.setDate(end.getDate()+days);
  return within(dateStr, today, end);
}
function inPrevDays(dateStr: string, days: number) {
  const end = new Date(); end.setHours(23,59,59,999);
  const start = new Date(end); start.setDate(end.getDate()-days);
  return within(dateStr, start, end);
}

export function useScheduleKpis() {
  const [rows, setRows] = React.useState<Schedule[]>(() => ScheduleRepo.list());

  const refresh = React.useCallback(() => setRows(ScheduleRepo.list()), []);
  // Let callers trigger refresh after mutations
  const kpis = React.useMemo(() => {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();

    const thisWeek = rows.filter(r => within(r.date, weekStart, weekEnd)).length;

    const todayStr = new Date().toISOString().slice(0,10);
    const today = rows.filter(r => r.date === todayStr).length;
    const ongoingNow = 0; // simplified; status badge already shows ongoing

    const last7Total = rows.filter(r => inPrevDays(r.date, 7)).length;
    const last7Done = rows.filter(r => inPrevDays(r.date, 7) && r.status === "COMPLETED").length;
    const completionRate = last7Total ? Math.round((last7Done / last7Total) * 100) : 0;

    const upcoming7 = rows.filter(r => inNextDays(r.date, 7) && (r.status === "PLANNED" || r.status === "ONGOING")).length;

    const drivers = ScheduleRepo.constants.drivers;
    const usedDrivers = new Set(
      rows.filter(r => inPrevDays(r.date, 7) || inNextDays(r.date, 7))
          .map(r => r.driverId)
    ).size;
    const driverUtilPct = drivers.length ? Math.round((usedDrivers / drivers.length) * 100) : 0;

    return {
      thisWeek,
      today,
      ongoingNow,
      completionRate,
      last7Done,
      last7Total,
      upcoming7,
      driverUtilPct,
      usedDrivers,
      totalDrivers: drivers.length,
    };
  }, [rows]);

  return { kpis, refresh };
}
