"use client";
import type { RequestRow } from "@/lib/admin/types";

export default function StatusBadge({ status }: { status: RequestRow["status"] }) {
  const c: Record<RequestRow["status"], string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Completed: "bg-blue-100 text-blue-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c[status]}`}>{status}</span>;
}
