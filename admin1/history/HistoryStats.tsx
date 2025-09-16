// src/components/admin/history/HistoryStats.tsx
"use client";

type Stat = { label: string; value: number };
export default function HistoryStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-semibold">{s.value}</div>
          <div className="text-xs text-neutral-600 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
