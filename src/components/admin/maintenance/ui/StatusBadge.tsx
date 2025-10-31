"use client";
import * as React from "react";
import type { MaintStatus } from "@/lib/admin/maintenance/maintenance.types";

const COLORS: Record<MaintStatus, string> = {
  Submitted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Acknowledged: "bg-sky-50 text-sky-700 ring-sky-200",
  "In-Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function StatusBadge({
  value,
  onClick,
  className,
}: {
  value: MaintStatus;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        COLORS[value],
        onClick ? "hover:opacity-90 transition" : "pointer-events-none",
        className ?? "",
      ].join(" ")}
      title="Click to change status"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current/60" />
      {value}
    </button>
  );
}
