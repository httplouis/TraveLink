"use client";

import { RequestsSummary } from "@/lib/admin/types";
import { Clock, CheckCircle2, Flag, XCircle } from "lucide-react";

type Props = {
  summary: RequestsSummary;
};

export default function RequestsSummaryUI({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card
        label="Pending"
        value={summary.pending}
        icon={<Clock className="h-5 w-5 text-amber-600" />}
        barColor="bg-amber-500"
        pillColor="bg-amber-100 text-amber-700"
      />
      <Card
        label="Approved"
        value={summary.approved}
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        barColor="bg-emerald-500"
        pillColor="bg-emerald-100 text-emerald-700"
      />
      <Card
        label="Completed"
        value={summary.completed}
        icon={<Flag className="h-5 w-5 text-blue-600" />}
        barColor="bg-blue-500"
        pillColor="bg-blue-100 text-blue-700"
      />
      <Card
        label="Rejected"
        value={summary.rejected}
        icon={<XCircle className="h-5 w-5 text-rose-600" />}
        barColor="bg-rose-500"
        pillColor="bg-rose-100 text-rose-700"
      />
    </div>
  );
}

function Card({
  label,
  value,
  icon,
  barColor,
  pillColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  barColor: string;
  pillColor: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pillColor}`}>
          {label}
        </span>
        {icon}
      </div>

      <div className="mt-3 text-3xl font-semibold text-neutral-800">{value}</div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${Math.min(100, value * 20)}%` }} // mock width
        />
      </div>
    </div>
  );
}
