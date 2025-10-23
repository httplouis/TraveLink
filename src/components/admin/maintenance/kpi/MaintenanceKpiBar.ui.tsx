"use client";
import type { MaintRecord, MaintStatus } from "@/lib/admin/maintenance";

const ORDER: MaintStatus[] = [
  "Submitted","Acknowledged","In-Progress","Completed","Rejected"
];

const COLORS: Record<MaintStatus, string> = {
  Submitted: "bg-slate-50",
  Acknowledged: "bg-blue-50",
  "In-Progress": "bg-amber-50",
  Completed: "bg-emerald-50",
  Rejected: "bg-rose-50",
};

export default function MaintenanceKpiBar({ rows }: { rows: MaintRecord[] }) {
  const counts = ORDER.map((s) => rows.filter((r) => r.status === s).length);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {ORDER.map((s, i) => (
        <div
          key={s}
          className={`rounded-xl p-4 ${COLORS[s]} ring-1 ring-black/5 shadow-sm`}
        >
          <div className="text-xs text-neutral-600">{s}</div>
          <div className="text-2xl font-semibold mt-1 text-neutral-900">{counts[i]}</div>
        </div>
      ))}
    </div>
  );
}
