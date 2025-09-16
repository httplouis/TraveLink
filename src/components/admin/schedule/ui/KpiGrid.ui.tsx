"use client";
import * as React from "react";

export default function KpiGrid({
  kpis,
}: {
  kpis: {
    thisWeek: number;
    today: number;
    ongoingNow: number;
    completionRate: number;
    last7Done: number;
    last7Total: number;
    upcoming7: number;
    driverUtilPct: number;
    usedDrivers: number;
    totalDrivers: number;
  };
}) {
  const Card = ({
    title,
    value,
    sub,
  }: {
    title: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="text-xs font-medium text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card title="This Week (total)" value={kpis.thisWeek} />
      <Card title="Today" value={kpis.today} sub={`${kpis.ongoingNow} ongoing now`} />
      <Card
        title="Completion Rate (7d)"
        value={`${kpis.completionRate}%`}
        sub={`${kpis.last7Done}/${kpis.last7Total} done`}
      />
      <Card title="Upcoming (7d)" value={kpis.upcoming7} />
      <Card
        title="Driver Utilization (7d)"
        value={`${kpis.driverUtilPct}%`}
        sub={`${kpis.usedDrivers}/${kpis.totalDrivers} drivers`}
      />
    </div>
  );
}
