"use client";

import * as React from "react";
import MaintenanceLogsDrawer, { type MaintenanceLog } from "@/components/driver/MaintenanceLogsDrawer";

export type FleetVehicle = {
  id: string;
  name: string;             // "Bus 12"
  plate: string;            // "ABC-1234"
  type: string;             // "Bus" | "Van" | "Truck"
  status: "available" | "offline" | "assigned";
  lastMaintenance?: string; // ISO "YYYY-MM-DD"
  nextDue?: string;         // ISO "YYYY-MM-DD"
  logs?: MaintenanceLog[];  // optional; enables View Logs
};

type Props = {
  title?: string;
  vehicles: FleetVehicle[];
};

// ✅ Named export (no default)
export function FleetSnapshot({ title = "Fleet Snapshot", vehicles }: Props) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<FleetVehicle | null>(null);

  function openLogs(v: FleetVehicle) {
    setActive(v);
    setOpen(true);
  }
  function closeLogs() {
    setOpen(false);
    setActive(null);
  }

  return (
    <section className="rounded-xl ring-1 ring-neutral-200/70 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-3">
        <h2 className="font-medium">{title}</h2>
        <div className="text-xs text-neutral-500">{vehicles.length} vehicle(s)</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <Th>Name / Model</Th>
              <Th>Plate</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Last Maint.</Th>
              <Th>Next Due</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/70">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-neutral-50/70">
                <Td><div className="font-medium">{v.name}</div></Td>
                <Td><span className="font-mono">{v.plate}</span></Td>
                <Td>{v.type}</Td>
                <Td>
                  <span className={`rounded px-2 py-0.5 text-xs ${tone(v.status)}`}>
                    {labelStatus(v.status)}
                  </span>
                </Td>
                <Td>{fmtDate(v.lastMaintenance)}</Td>
                <Td>{fmtDate(v.nextDue)}</Td>
                <Td className="text-right pr-4">
                  <button
                    className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
                    onClick={() => openLogs(v)}
                    disabled={!v.logs || v.logs.length === 0}
                    title={(!v.logs || v.logs.length === 0) ? "No logs available" : "View detailed maintenance logs"}
                  >
                    View Logs
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MaintenanceLogsDrawer
        open={open}
        onClose={closeLogs}
        vehicle={active ? { id: active.id, name: active.name, plate: active.plate, type: active.type } : null}
        logs={active?.logs ?? []}
      />
    </section>
  );
}

function Th({ children, className="" }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className="" }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-2 align-middle ${className}`}>{children}</td>;
}

function labelStatus(s: FleetVehicle["status"]) {
  if (s === "available") return "Available";
  if (s === "assigned") return "Assigned";
  return "Unavailable";
}
function tone(s: FleetVehicle["status"]) {
  if (s === "available") return "bg-green-100 text-green-700";
  if (s === "assigned") return "bg-blue-100 text-blue-700";
  return "bg-neutral-100 text-neutral-700";
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}
