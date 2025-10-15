"use client";
import * as React from "react";
import type { Vehicle } from "@/lib/admin/vehicles/types";

function KpiBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export function KpiStrip({ rows }: { rows: Vehicle[] }) {
  const total = rows.length;
  const active = rows.filter(v => v.status === "active").length;
  const maint = rows.filter(v => v.status === "maintenance").length;
  const inactive = rows.filter(v => v.status === "inactive").length;

  // optional derived
  const assigned = rows.filter(v => (v as any).assignedDriver).length;
  const serviceNeeded = rows.filter(v => {
    const due = (v as any).nextServiceISO as string | undefined;
    return due && new Date(due) <= new Date();
  }).length;

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <KpiBox label="Total vehicles" value={total} />
      <KpiBox label="Active" value={active} />
      <KpiBox label="Assigned" value={assigned} />
      <KpiBox label="Service needed" value={serviceNeeded} />
      <KpiBox label="Inactive / Out of order" value={inactive} />
    </div>
  );
}
