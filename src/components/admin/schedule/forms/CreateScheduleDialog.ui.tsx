// src/components/admin/schedule/forms/CreateScheduleDialog.ui.tsx
"use client";
import * as React from "react";
import MapPicker, { PickedPlace } from "@/components/common/map/MapPicker.ui";


export type CreateForm = {
  requestId: string | null;
  title: string;
  origin: string;
  destination: string;
  date: string;       // yyyy-mm-dd
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  driverId: string;
  vehicleId: string;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  notes: string;
  originPlace?: PickedPlace | null;
  destinationPlace?: PickedPlace | null;
};

export type DriverOption = { id: string; name: string; busy?: boolean };
export type VehicleOption = { id: string; label: string; plateNo: string; busy?: boolean };

type Props = {
  open: boolean;
  tripIdPreview?: string;
  form?: CreateForm; // ← tolerant
  drivers?: DriverOption[];
  vehicles?: VehicleOption[];
  driverConflicts?: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  vehicleConflicts?: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  disableSave?: boolean;

  onChange?: (patch: Partial<CreateForm>) => void;
  onClose: () => void;
  onSave?: () => void;
};

export default function CreateScheduleDialogUI(props: Props) {
  const {
    open,
    tripIdPreview = "",
    onClose,
    onSave = () => {},
    onChange = () => {},
  } = props;

  // Safe defaults if anything is missing
  const form: CreateForm = {
    requestId: props.form?.requestId ?? null,
    title: props.form?.title ?? "",
    origin: props.form?.origin ?? "",
    destination: props.form?.destination ?? "",
    date: props.form?.date ?? new Date().toISOString().slice(0, 10),
    startTime: props.form?.startTime ?? "08:00",
    endTime: props.form?.endTime ?? "09:00",
    driverId: props.form?.driverId ?? "",
    vehicleId: props.form?.vehicleId ?? "",
    status: props.form?.status ?? "PLANNED",
    notes: props.form?.notes ?? "",
    originPlace: props.form?.originPlace ?? null,
    destinationPlace: props.form?.destinationPlace ?? null,
  };

  const drivers = props.drivers ?? [];
  const vehicles = props.vehicles ?? [];
  const driverConflicts = props.driverConflicts ?? [];
  const vehicleConflicts = props.vehicleConflicts ?? [];
  const disableSave = props.disableSave ?? false;

  const [openOriginMap, setOpenOriginMap] = React.useState(false);
  const [openDestMap, setOpenDestMap] = React.useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold">
            {form.requestId ? "Edit schedule" : "Create schedule"}
          </h3>
          <div className="text-xs text-neutral-500">
            Trip ID (auto):{" "}
            <code className="rounded bg-neutral-50 px-1.5 py-0.5">{tripIdPreview || "—"}</code>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          {/* Title */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Title</label>
            <input
              className="h-11 w-full rounded-lg border px-3"
              placeholder="e.g., Campus shuttle"
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>

          {/* Origin */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Origin</label>
            <div className="flex">
              <input
                className="h-11 w-full rounded-l-lg border border-r-0 px-3"
                placeholder="Pick-up point"
                value={form.origin}
                onChange={(e) => onChange({ origin: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setOpenOriginMap(true)}
                className="h-11 rounded-r-lg border border-l-0 px-3 text-sm text-[#7A0010] hover:bg-neutral-50"
                title="Pick on map"
              >
                Pick on map
              </button>
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Destination</label>
            <div className="flex">
              <input
                className="h-11 w-full rounded-l-lg border border-r-0 px-3"
                placeholder="Drop-off point"
                value={form.destination}
                onChange={(e) => onChange({ destination: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setOpenDestMap(true)}
                className="h-11 rounded-r-lg border border-l-0 px-3 text-sm text-[#7A0010] hover:bg-neutral-50"
                title="Pick on map"
              >
                Pick on map
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Date</label>
            <input
              type="date"
              className="h-11 w-full rounded-lg border px-3"
              value={form.date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          </div>

          {/* Time */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Start</label>
              <input
                type="time"
                className="h-11 w-full rounded-lg border px-3"
                value={form.startTime}
                onChange={(e) => onChange({ startTime: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-600">End</label>
              <input
                type="time"
                className="h-11 w-full rounded-lg border px-3"
                value={form.endTime}
                onChange={(e) => onChange({ endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Driver */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Driver</label>
            <select
              className="h-11 w-full rounded-lg border px-3"
              value={form.driverId}
              onChange={(e) => onChange({ driverId: e.target.value })}
            >
              {!drivers.length && <option value="">No drivers configured</option>}
              {drivers.map((d) => (
                <option key={d.id} value={d.id} disabled={d.busy}>
                  {d.name} {d.busy ? " • busy" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Vehicle</label>
            <select
              className="h-11 w-full rounded-lg border px-3"
              value={form.vehicleId}
              onChange={(e) => onChange({ vehicleId: e.target.value })}
            >
              {!vehicles.length && <option value="">No vehicles configured</option>}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.busy}>
                  {v.label} ({v.plateNo}) {v.busy ? " • busy" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Status</label>
            <select
              className="h-11 w-full rounded-lg border px-3"
              value={form.status}
              onChange={(e) => onChange({ status: e.target.value as CreateForm["status"] })}
            >
              <option value="PLANNED">PLANNED</option>
              <option value="ONGOING">ONGOING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Notes (optional)</label>
            <textarea
              className="min-h-[90px] w-full rounded-lg border px-3 py-2"
              placeholder="Anything the driver needs to know…"
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>

          {/* Warnings */}
          {(driverConflicts.length > 0 || vehicleConflicts.length > 0) && (
            <div className="col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <div className="mb-1 font-medium">Conflicts</div>
              {driverConflicts.length > 0 && (
                <div className="mb-1">
                  <span className="font-medium">Driver</span> is busy:
                  {driverConflicts.map((c) => (
                    <div key={c.id}>• {c.title} — {c.date} {c.startTime}-{c.endTime}</div>
                  ))}
                </div>
              )}
              {vehicleConflicts.length > 0 && (
                <div>
                  <span className="font-medium">Vehicle</span> is busy:
                  {vehicleConflicts.map((c) => (
                    <div key={c.id}>• {c.title} — {c.date} {c.startTime}-{c.endTime}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="h-10 rounded-lg border px-4">Cancel</button>
          <button
            onClick={onSave}
            disabled={disableSave}
            className="h-10 rounded-lg bg-[#7A0010] px-4 text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {/* Map pickers */}
        <MapPicker
          open={openOriginMap}
          initial={form.originPlace ?? null}
          onClose={() => setOpenOriginMap(false)}
          onPick={(p) => { onChange({ origin: p.address, originPlace: p }); setOpenOriginMap(false); }}
        />
        <MapPicker
          open={openDestMap}
          initial={form.destinationPlace ?? null}
          onClose={() => setOpenDestMap(false)}
          onPick={(p) => { onChange({ destination: p.address, destinationPlace: p }); setOpenDestMap(false); }}
        />
      </div>
    </div>
  );
}
