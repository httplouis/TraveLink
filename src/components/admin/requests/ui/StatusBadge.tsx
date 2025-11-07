"use client";
import type { RequestRow } from "@/lib/admin/types";

export default function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const c: Record<RequestRow["status"], string> = {
    Pending: "border border-orange-400 bg-orange-100 text-orange-800",
    Approved: "border border-emerald-300 bg-emerald-100 text-emerald-800",
    Completed: "border border-sky-300 bg-sky-100 text-sky-800",
    Rejected: "border border-rose-300 bg-rose-100 text-rose-800",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${c[status]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>;
}
