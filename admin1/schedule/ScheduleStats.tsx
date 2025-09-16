"use client";

type Stat = { label: string; value: number; sub?: string };
export default function ScheduleStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm">
          <div className="text-2xl font-semibold">{s.value}</div>
          <div className="text-xs text-neutral-600 mt-1">{s.label}</div>
          {s.sub && <div className="text-[11px] text-neutral-500 mt-0.5">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
