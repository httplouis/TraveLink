// src/lib/admin/schedule/stats.ts
import type { Schedule } from "./types";
import { ScheduleRepo } from "./store";

export type Kpi = { key: string; label: string; value: string; sub?: string };

const yyyy_mm_dd = (d: Date) => d.toISOString().slice(0, 10);

export function computeKpis(rows: Schedule[], now = new Date()): Kpi[] {
  const todayStr = yyyy_mm_dd(now);
  const msDay = 86400000;

  const startOfToday = new Date(todayStr + "T00:00:00");
  const endOfToday = new Date(startOfToday.getTime() + msDay - 1);

  const inRange = (d: string, from: Date, to: Date) =>
    new Date(d + "T12:00:00").getTime() >= from.getTime() &&
    new Date(d + "T12:00:00").getTime() <= to.getTime();

  const day = now.getDay();
  const startOfWeek = new Date(startOfToday.getTime() - day * msDay);
  const endOfWeek = new Date(startOfWeek.getTime() + 6 * msDay);

  const next7Start = startOfToday;
  const next7End = new Date(startOfToday.getTime() + 6 * msDay);

  const drivers = ScheduleRepo.constants.drivers;

  const totalWeek = rows.filter(r => inRange(r.date, startOfWeek, endOfWeek)).length;
  const today = rows.filter(r => r.date === todayStr).length;

  const ongoingNow = rows.filter(r => {
    if (r.date !== todayStr) return false;
    const s = new Date(`${r.date}T${r.startTime}:00`);
    const e = new Date(`${r.date}T${r.endTime}:00`);
    return now >= s && now <= e && r.status !== "CANCELLED";
  }).length;

  const last7Start = new Date(startOfToday.getTime() - 6 * msDay);
  const last7 = rows.filter(r => inRange(r.date, last7Start, endOfToday));
  const completed7 = last7.filter(r => r.status === "COMPLETED").length;
  const completionRate7 = last7.length ? Math.round((completed7 / last7.length) * 100) : 0;

  const upcoming7 = rows.filter(r => inRange(r.date, next7Start, next7End)).length;

  const scheduledDriverIds = new Set(
    rows.filter(r => inRange(r.date, next7Start, next7End)).map(r => r.driverId)
  );
  const driverUtil = drivers.length ? Math.round((scheduledDriverIds.size / drivers.length) * 100) : 0;

  return [
    { key: "wk_total", label: "This Week (total)", value: String(totalWeek) },
    { key: "today", label: "Today", value: String(today), sub: `${ongoingNow} ongoing now` },
    { key: "completion", label: "Completion Rate (7d)", value: `${completionRate7}%`, sub: `${completed7}/${last7.length || 0} done` },
    { key: "upcoming", label: "Upcoming (7d)", value: String(upcoming7) },
    { key: "util", label: "Driver Utilization (7d)", value: `${driverUtil}%`, sub: `${scheduledDriverIds.size}/${drivers.length} drivers` },
  ];
}
