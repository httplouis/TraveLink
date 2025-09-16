"use client";

import { Driver, ScheduleEvent, Vehicle, autoAssignForEvent, findConflicts } from "@/lib/schedule";
import { CheckCircle2, X, XCircle, Route as RouteIcon, Car, User, Wand2 } from "lucide-react";
import { useMemo } from "react";

const MAROON = "#7A0010";

export default function ScheduleEventDrawer({
  row,
  events,
  vehicles,
  drivers,
  onClose,
  onStatus,
  onAssign,
  onDelete,
}: {
  row: ScheduleEvent | null;
  events: ScheduleEvent[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onStatus: (id: string, s: ScheduleEvent["status"]) => void;
  onAssign: (id: string, updates: Partial<ScheduleEvent>) => void;
  onDelete: (id: string) => void;
}) {
  const conflicts = useMemo(() => row ? findConflicts(events, row) : { vehicle: [], driver: [] }, [row, events]);

  if (!row) return null;

  const v = row.vehicleId ? vehicles.find(v => v.id === row.vehicleId) : undefined;
  const d = row.driverId ? drivers.find(d => d.id === row.driverId) : undefined;

  const auto = () => {
    const res = autoAssignForEvent(row, vehicles, drivers, events);
    onAssign(row.id, res);
  };

  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Schedule details</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 grid gap-3 text-sm">
          <Row label="Title" value={row.title} />
          <Row label="Trip" value={row.tripId ?? "—"} />
          <Row label="Campus" value={row.campus} />
          <Row label="Time" value={`${new Date(row.start).toLocaleString()} — ${new Date(row.end).toLocaleString()}`} />
          <Row label="Passengers" value={row.passengers ? String(row.passengers) : "—"} />
          <Row label="Status" value={row.status} />

          <div className="grid gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <div className="text-xs text-neutral-600">Assignments</div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">{v ? `${v.name} (${v.id})` : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">{d ? `${d.name} (${d.id})` : "—"}</span>
            </div>

            {(conflicts.vehicle.length > 0 || conflicts.driver.length > 0) && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">
                {conflicts.vehicle.length > 0 && (<div>Vehicle conflict with {conflicts.vehicle.length} event(s).</div>)}
                {conflicts.driver.length > 0 && (<div>Driver conflict with {conflicts.driver.length} event(s).</div>)}
              </div>
            )}

            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-white mt-1"
              style={{ background: MAROON }}
              onClick={auto}
              title="Auto-assign available driver & vehicle"
            >
              <Wand2 className="w-4 h-4" /> Auto-assign
            </button>
          </div>

          {row.notes && (
            <div className="grid gap-1">
              <div className="text-xs text-neutral-600">Notes</div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 whitespace-pre-line">{row.notes}</div>
            </div>
          )}
        </div>

        <div className="mt-auto border-t p-3 flex items-center justify-between gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100"
            onClick={() => onDelete(row.id)}
          >
            <XCircle className="w-4 h-4" /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-neutral-700 border-neutral-300 bg-white hover:bg-neutral-50"
              onClick={() => onStatus(row.id, "Cancelled")}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100"
              onClick={() => onStatus(row.id, "En Route")}
            >
              <RouteIcon className="w-4 h-4" /> En Route
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-white"
              style={{ background: MAROON }}
              onClick={() => onStatus(row.id, "Approved")}
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
          </div>
        </div>
      </aside>
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
