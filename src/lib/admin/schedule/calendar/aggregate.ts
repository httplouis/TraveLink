import { AdminSchedule, DayStat } from "./types";
import { toISODate } from "./date";

export function groupByDay(schedules: AdminSchedule[], capacityPerDay: number): Record<string, DayStat> {
  const map: Record<string, DayStat> = {};
  for (const s of schedules) {
    const d = new Date(s.start);
    const iso = toISODate(d);
    if (!map[iso]) map[iso] = { dateISO: iso, used: 0, capacity: capacityPerDay };
    map[iso].used += 1;
  }
  return map;
}

export function statusOf(used: number, cap: number): "available" | "partial" | "full" {
  if (used <= 0) return "available";
  if (used >= cap) return "full";
  return "partial";
}
