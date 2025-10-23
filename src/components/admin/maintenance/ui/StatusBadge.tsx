"use client";
import type { MaintStatus } from "@/lib/admin/maintenance";

const MAP: Record<MaintStatus, string> = {
  Submitted: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  Acknowledged: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  "In-Progress": "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  Completed: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200",
};

export default function StatusBadge({ status }: { status: MaintStatus }) {
  return (
    <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${MAP[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
