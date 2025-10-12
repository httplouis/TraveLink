"use client";

import * as React from "react";
import { FleetRepo, type Vehicle } from "@/lib/user/fleet/store";

function StatusBadge({ s }: { s: Vehicle["status"] }) {
  const map = {
    available: "bg-green-100 text-green-700",
    assigned: "bg-amber-100 text-amber-700",
    maintenance: "bg-rose-100 text-rose-700",
    offline: "bg-neutral-100 text-neutral-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[s]}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

export default function VehiclesList() {
  const [rows] = React.useState<Vehicle[]>(() => FleetRepo.listVehicles());
  const [q, setQ] = React.useState("");
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);

  const filtered = React.useMemo(() => {
    let base = rows;
    if (onlyAvailable) base = base.filter(v => v.status === "available");
    if (q.trim()) {
      const s = q.toLowerCase();
      base = base.filter(v =>
        [v.code, v.plate, v.type].join(" ").toLowerCase().includes(s)
      );
    }
    return base;
  }, [rows, q, onlyAvailable]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <input
          className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          placeholder="Search by code, plate, type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only available
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div key={v.id} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-neutral-500">{v.type} • {v.plate}</div>
                <div className="text-base font-semibold">{v.code}</div>
              </div>
              <StatusBadge s={v.status} />
            </div>
            <div className="mt-2 text-xs text-neutral-500">Seats: {v.seats}</div>
          </div>
        ))}
        {!filtered.length && (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-neutral-500">
            No vehicles match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
