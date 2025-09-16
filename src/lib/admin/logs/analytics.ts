import type { LogEntry } from "./types";

export function countBySeverity(rows: LogEntry[]) {
  const m = { info:0, warning:0, error:0 } as Record<"info"|"warning"|"error", number>;
  rows.forEach(r => (m[r.severity] = (m[r.severity] ?? 0) + 1));
  return m;
}

export function countByAction(rows: LogEntry[]) {
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.action, (map.get(r.action) ?? 0) + 1));
  // return top 5 actions
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

export function trendLast7Days(rows: LogEntry[]) {
  // returns [{day:"YYYY-MM-DD", count:number}]
  const today = new Date();
  const days: { day: string; count: number }[] = [];
  for (let i=6;i>=0;i--) {
    const d = new Date(today);
    d.setDate(today.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const count = rows.filter(r => r.timestampISO.slice(0,10) === key).length;
    days.push({ day: key, count });
  }
  return days;
}
