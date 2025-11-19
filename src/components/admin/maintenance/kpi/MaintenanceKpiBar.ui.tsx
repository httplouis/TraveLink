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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {ORDER.map((s, i) => (
        <div
          key={s}
          className={`rounded-xl p-5 ${COLORS[s]} ring-1 ring-black/5 shadow-md hover:shadow-lg transition-shadow border-l-4 ${
            s === "Submitted" ? "border-slate-400" :
            s === "Acknowledged" ? "border-blue-400" :
            s === "In-Progress" ? "border-amber-400" :
            s === "Completed" ? "border-emerald-400" :
            "border-rose-400"
          }`}
        >
          <div className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{s}</div>
          <div className="text-3xl font-bold mt-2 text-neutral-900">{counts[i]}</div>
        </div>
      ))}
    </div>
  );
}
