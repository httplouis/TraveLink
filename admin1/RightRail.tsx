"use client";
import React, { useMemo } from "react";
import type { Vehicle, VehicleStatus } from "@/lib/travilink";
import Badge from "@/components/ui/Badge";
import { VehicleIcon } from "@/components/ui/Icons";

const LOGO_PLACEMENT: "side" | "up" = "side";

export default function RightRail({ vehicles }: { vehicles: Vehicle[] }) {
  const sorted = useMemo(
    () =>
      [...vehicles].sort((a, b) => {
        const order = { available: 0, maintenance: 1, offline: 2 } as const;
        return order[a.status] - order[b.status];
      }),
    [vehicles]
  );

  const badgeColor = (s: VehicleStatus) =>
    s === "available" ? "green" : s === "maintenance" ? "amber" : "red";

  const statusLabel = (s: VehicleStatus) =>
    s === "available" ? "Available" : s === "maintenance" ? "Maintenance" : "Offline";

  return (
    <aside className="hidden lg:block lg:col-span-2 2xl:col-span-3 h-full">
      <div className="rounded-lg overflow-hidden h-full flex flex-col border border-neutral-200 bg-white">
        {/* Profile header with watermark */}
        <div className="relative p-4 bg-gradient-to-b from-[#7A0010] to-[#4E0009] text-white overflow-hidden">
          <img
            src="/euwhite.png"
            alt="MSEUF Logo"
            aria-hidden="true"
            className={[
              "pointer-events-none select-none absolute opacity-30 contrast-125",
              LOGO_PLACEMENT === "side"
                ? "right-[-10px] top-1/2 -translate-y-1/2 w-[180px] md:w-[220px] lg:w-[240px]"
                : "right-0 top-[-20px] w-[360px] md:w-[420px] opacity-25",
            ].join(" ")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center font-bold ring-2 ring-white/20">A</div>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wide text-white/70">PROFILE · ADMIN</div>
              <div className="text-xl font-extrabold leading-tight">F22-33538</div>
              <div className="text-sm text-white/90">Department: CCMS</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color="gray">Faculty</Badge>
              <Badge color="gray">Lucena Campus</Badge>
            </div>
          </div>
        </div>

        {/* Stats + quick note */}
        <div className="p-3 space-y-2 bg-white">
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Active", value: 5 }, { label: "Online", value: 3 }, { label: "Approvals", value: 4 }].map((i) => (
              <div key={i.label} className="rounded-lg border border-neutral-200 bg-white text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-[#7A0010]/15">
                <div className="text-[11px] text-neutral-500 pt-2">{i.label}</div>
                <div className="text-lg font-bold pb-2">{i.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              placeholder="Quick action / note..."
              className="flex-1 h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
            />
            <button className="px-4 py-2 rounded-full bg-[#7A0010] text-white text-sm">More</button>
          </div>

          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-600">
            Tip: Use the header search to find schedules, vehicles, or drivers quickly.
          </div>
        </div>

        {/* Live Vehicles */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Vehicles</h3>
            <span className="text-xs text-neutral-500">{vehicles.length}</span>
          </div>

          <div className="mt-2 space-y-2 max-h-[340px] overflow-auto pr-1">
            {sorted.length === 0 ? (
              <div className="text-xs text-neutral-500 py-4 text-center border border-dashed border-neutral-200 rounded-md">
                No vehicles added yet.
              </div>
            ) : (
              sorted.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 px-3 py-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    v.status !== "available" ? "opacity-90" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-xl grid place-items-center bg-[#7A0010]/5 ring-1 ring-[#7A0010]/10 shrink-0">
                      <VehicleIcon type={v.type} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{v.name}</div>
                      <div className="text-[11px] text-neutral-500">{v.type}</div>
                    </div>
                  </div>
                  <Badge color={badgeColor(v.status)}>{statusLabel(v.status)}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1" />
      </div>
    </aside>
  );
}
