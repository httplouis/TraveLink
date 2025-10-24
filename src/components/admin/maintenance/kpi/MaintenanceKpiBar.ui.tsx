"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import { CheckCircle2, Clock3, AlertTriangle, ListChecks } from "lucide-react";

type KPICounts = {
  all: number;
  submitted: number;
  inProgress: number;
  completed: number;
  dueSoon: number;
  overdue: number;
};

type Props = Partial<KPICounts> & { rows?: Maintenance[] };

function computeFromRows(rows: Maintenance[]): KPICounts {
  const s = (st: Maintenance["status"]) => rows.filter(r => r.status === st).length;
  const d = (t: "ok" | "soon" | "overdue") => rows.filter(r => r.nextDueTint === t).length;
  return {
    all: rows.length,
    submitted: s("Submitted"),
    inProgress: s("In-Progress"),
    completed: s("Completed"),
    dueSoon: d("soon"),
    overdue: d("overdue"),
  };
}

function Card({
  label,
  value,
  icon,
  ring,
  bg,
  text,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  ring: string;
  bg: string;
  text: string;
}) {
  return (
    <div className={`rounded-2xl ring-1 ${ring} ${bg} ${text} p-4 md:p-5 shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-3xl md:text-4xl font-semibold tabular-nums">{value}</div>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="mt-1 text-xs opacity-70">{label}</div>
    </div>
  );
}

export default function MaintenanceKpiBar(props: Props) {
  const data: KPICounts = props.rows
    ? computeFromRows(props.rows)
    : {
        all: props.all ?? 0,
        submitted: props.submitted ?? 0,
        inProgress: props.inProgress ?? 0,
        completed: props.completed ?? 0,
        dueSoon: props.dueSoon ?? 0,
        overdue: props.overdue ?? 0,
      };

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="rounded-2xl border border-neutral-200 shadow-sm bg-white/70">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-neutral-200">
        <div className="text-sm font-medium text-neutral-700">Maintenance summary</div>
        <button
          onClick={() => setCollapsed((s) => !s)}
          className="text-xs rounded-md border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
        >
          {collapsed ? "Expand" : "Compact"}
        </button>
      </div>

      {!collapsed ? (
        <div className="p-4 md:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card label="All" value={data.all} icon={<ListChecks className="h-5 w-5" />} ring="ring-neutral-200" bg="bg-white" text="text-neutral-900" />
          <Card label="Submitted" value={data.submitted} icon={<Clock3 className="h-5 w-5" />} ring="ring-sky-200" bg="bg-sky-50" text="text-sky-900" />
          <Card label="In-Progress" value={data.inProgress} icon={<Clock3 className="h-5 w-5" />} ring="ring-violet-200" bg="bg-violet-50" text="text-violet-900" />
          <Card label="Completed" value={data.completed} icon={<CheckCircle2 className="h-5 w-5" />} ring="ring-emerald-200" bg="bg-emerald-50" text="text-emerald-900" />
          <Card label="Due Soon" value={data.dueSoon} icon={<AlertTriangle className="h-5 w-5" />} ring="ring-amber-200" bg="bg-amber-50" text="text-amber-900" />
          <Card label="Overdue" value={data.overdue} icon={<AlertTriangle className="h-5 w-5" />} ring="ring-rose-200" bg="bg-rose-50" text="text-rose-900" />
        </div>
      ) : (
        <div className="p-4 md:p-5 grid grid-cols-3 sm:grid-cols-6 gap-2 text-sm">
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">All: <strong className="tabular-nums">{data.all}</strong></div>
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">Submitted: <strong className="tabular-nums">{data.submitted}</strong></div>
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">In-Progress: <strong className="tabular-nums">{data.inProgress}</strong></div>
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">Completed: <strong className="tabular-nums">{data.completed}</strong></div>
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">Soon: <strong className="tabular-nums">{data.dueSoon}</strong></div>
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">Overdue: <strong className="tabular-nums">{data.overdue}</strong></div>
        </div>
      )}
    </div>
  );
}
