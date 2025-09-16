"use client";
import React, { useState } from "react";
import type { Driver, DriverStatus, VehicleType } from "@/lib/travilink";
import Badge from "@/components/ui/Badge";
import CTA from "@/components/ui/Button";

const statusLabel = (s: DriverStatus) =>
  s === "available" ? "Available" : s === "on_trip" ? "On Trip" : s === "off_duty" ? "Off Duty" : s === "sick" ? "Sick" : "On Leave";

const statusColor = (s: DriverStatus) =>
  s === "available" ? "green" : s === "on_trip" ? "blue" : s === "off_duty" ? "gray" : s === "sick" ? "amber" : "red";

const accent = (s: DriverStatus) =>
  s === "available" ? "border-l-4 border-emerald-500/70" :
  s === "on_trip"   ? "border-l-4 border-sky-500/70"     :
  s === "off_duty"  ? "border-l-4 border-neutral-400/70" :
  s === "sick"      ? "border-l-4 border-amber-500/70"   :
                      "border-l-4 border-rose-500/70";

export default function DriverCard({
  d,
  onStatus,
}: {
  d: Driver;
  onStatus: (id: string, status: DriverStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const statusOpts: { key: DriverStatus; label: string }[] = [
    { key: "available", label: "Available" },
    { key: "on_trip", label: "On Trip" },
    { key: "off_duty", label: "Off Duty" },
    { key: "sick", label: "Sick" },
    { key: "leave", label: "On Leave" },
  ];
  const initials = d.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border border-neutral-200 p-3 bg-gradient-to-br from-white to-neutral-50 shadow-sm ${accent(d.status)} pl-2 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full text-white grid place-items-center text-sm font-bold shrink-0 ring-2 ring-white shadow" style={{ background: d.color ?? "#7A0010" }}>
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">{d.name}</div>
            <Badge color={statusColor(d.status)}>{statusLabel(d.status)}</Badge>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            License: <span className="font-medium text-neutral-700">{d.license}</span> · Can drive{" "}
            <span className="font-medium text-neutral-700">{d.vehicleTypes.join(", ")}</span>
          </div>
          {d.phone && <div className="text-xs text-neutral-500">Phone: {d.phone}</div>}
        </div>
      </div>

      <div className="relative">
        <CTA tone="ghost" className="px-3 py-1.5" onClick={() => setOpen(o => !o)}>
          Update
        </CTA>
        {open && (
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-neutral-200 bg-white shadow-lg p-1">
            {statusOpts.map(opt => (
              <button
                key={opt.key}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-neutral-50 ${d.status === opt.key ? "bg-neutral-50" : ""}`}
                onClick={() => { onStatus(d.id, opt.key); setOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
