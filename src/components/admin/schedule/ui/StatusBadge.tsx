// src/components/admin/schedule/ui/StatusBadge.tsx
"use client";
import React from "react";
import type { ScheduleStatus } from "@/lib/admin/schedule/types";

export default function StatusBadge({ status }: { status: ScheduleStatus }) {
  const fmt: Record<ScheduleStatus, string> = {
    PLANNED: "bg-amber-50 text-amber-700 border-amber-200",
    ONGOING: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${fmt[status]}`}>
      {status}
    </span>
  );
}
