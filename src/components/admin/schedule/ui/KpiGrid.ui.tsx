// src/components/admin/schedule/ui/KpiGrid.ui.tsx
"use client";
import * as React from "react";
import {
  CalendarDays,
  Clock,
  TrendingUp,
  CalendarCheck2,
  Users2,
} from "lucide-react";

export default function KpiGrid({
  kpis,
}: {
  kpis: {
    thisWeek: number;
    today: number;
    ongoingNow: number;
    completionRate: number; // 0-100
    last7Done: number;
    last7Total: number;
    upcoming7: number;
    driverUtilPct: number; // 0-100
    usedDrivers: number;
    totalDrivers: number;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="This Week (total)"
        value={kpis.thisWeek}
        icon={<CalendarDays className="h-4 w-4" />}
        accent="bg-blue-50 text-blue-700"
      />

      <KpiCard
        title="Today"
        value={kpis.today}
        sub={
          <span className="inline-flex items-center gap-1 text-xs">
            <Clock className="h-3.5 w-3.5 opacity-70" />
            {kpis.ongoingNow} ongoing now
          </span>
        }
        icon={<Clock className="h-4 w-4" />}
        accent="bg-amber-50 text-amber-700"
      />

      <KpiCard
        title="Completion Rate (7d)"
        value={`${clampPct(kpis.completionRate)}%`}
        sub={
          <Progress
            pct={clampPct(kpis.completionRate)}
            label={`${kpis.last7Done}/${kpis.last7Total} done`}
            color="emerald"
          />
        }
        icon={<TrendingUp className="h-4 w-4" />}
        accent="bg-emerald-50 text-emerald-700"
      />

      <KpiCard
        title="Upcoming (7d)"
        value={kpis.upcoming7}
        icon={<CalendarCheck2 className="h-4 w-4" />}
        accent="bg-violet-50 text-violet-700"
      />

      <KpiCard
        className="sm:col-span-2 lg:col-span-4"
        title="Driver Utilization (7d)"
        value={`${clampPct(kpis.driverUtilPct)}%`}
        sub={
          <Progress
            pct={clampPct(kpis.driverUtilPct)}
            label={`${kpis.usedDrivers}/${kpis.totalDrivers} drivers`}
            color="blue"
          />
        }
        icon={<Users2 className="h-4 w-4" />}
        accent="bg-blue-50 text-blue-700"
      />
    </div>
  );
}

/* ---------------- UI pieces ---------------- */

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent = "bg-neutral-100 text-neutral-700",
  className = "",
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string; // tailwind classes for the icon chip
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-neutral-500">{title}</div>
        {icon && (
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${accent}`}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>

      {sub ? <div className="mt-2">{sub}</div> : null}
    </div>
  );
}

function Progress({
  pct,
  label,
  color = "emerald",
}: {
  pct: number; // 0-100
  label?: string;
  color?: "emerald" | "blue" | "violet" | "amber" | "rose";
}) {
  const bar =
    {
      emerald: "bg-emerald-500",
      blue: "bg-blue-500",
      violet: "bg-violet-500",
      amber: "bg-amber-500",
      rose: "bg-rose-500",
    }[color] || "bg-emerald-500";

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full ${bar} transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
      {label ? (
        <div className="mt-1 text-xs text-neutral-500">{label}</div>
      ) : null}
    </div>
  );
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
