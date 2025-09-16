"use client";

import { MaintVehicle, MaintenanceTicket, ServiceState } from "@/lib/maintenanceDomain";
import { X } from "lucide-react";
import { useMemo } from "react";

const BRAND = "#7A0010";

export default function MaintenanceDrawer({
  row,
  vehicles,
  onClose,
  onAdvance,
  onToggleOOS,
  onUpdate,
  onDelete,
}: {
  row: MaintenanceTicket | null;
  vehicles: MaintVehicle[];
  onClose: () => void;
  onAdvance: (id: string) => void;
  onToggleOOS: (vehicleId: string, state: ServiceState) => void;
  onUpdate: (id: string, patch: Partial<MaintenanceTicket>) => void;
  onDelete: (id: string) => void;
}) {
  const v = useMemo(() => (row ? vehicles.find(x => x.id === row.vehicleId) : undefined), [row, vehicles]);
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Ticket {row.id}</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 grid gap-3 text-sm">
          <Row label="Title" value={row.title} />
          <Row label="Vehicle" value={`${v?.name ?? "Unknown"} (${row.vehicleId}) • ${v?.plate ?? "—"} • ${v?.type ?? "—"}`} />
          <Row label="Campus" value={row.campus} />
          <Row label="Opened" value={`${new Date(row.createdAt).toLocaleString()}`} />
          <Row label="Severity" value={row.severity} />
          <Row label="Status" value={row.status} />
          <Row label="Reporter" value={row.reporter} />
          <Row label="Assignee" value={row.assignee ?? "—"} />
          <Row label="Vehicle service" value={v?.serviceState ?? "—"} />

          <div className="grid gap-1">
            <div className="text-xs text-neutral-600">Description</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 whitespace-pre-line min-h-[64px]">
              {row.description}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <L label="Due date">
              <input
                type="date"
                className="input"
                value={row.dueDate?.slice(0,10) ?? ""}
                onChange={(e) => onUpdate(row.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </L>
            <L label="Cost (₱)">
              <input
                type="number"
                min={0}
                className="input"
                value={row.cost ?? ""}
                onChange={(e) => onUpdate(row.id, { cost: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
              />
            </L>
          </div>

          <L label="Parts">
            <input
              className="input"
              value={row.parts ?? ""}
              onChange={(e) => onUpdate(row.id, { parts: e.target.value || undefined })}
              placeholder="e.g., Brake pads; Cabin filter"
            />
          </L>
        </div>

        <div className="mt-auto border-t p-3 flex items-center justify-between gap-2">
          <button
            className="px-3 py-2 rounded-md border hover:bg-neutral-50"
            onClick={() => onDelete(row.id)}
            title="Delete ticket"
          >
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-2 rounded-md border ${v?.serviceState === "Out of Service" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
              onClick={() => onToggleOOS(row.vehicleId, v?.serviceState === "Out of Service" ? "In Service" : "Out of Service")}
              title="Toggle vehicle service state"
            >
              {v?.serviceState === "Out of Service" ? "Mark In Service" : "Mark Out of Service"}
            </button>

            <button
              className="px-3 py-2 rounded-md text-white"
              style={{ background: BRAND }}
              onClick={() => onAdvance(row.id)}
              title="Advance status"
            >
              Advance →
            </button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .input { @apply w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none text-sm; }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <div className="text-xs text-neutral-600">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
