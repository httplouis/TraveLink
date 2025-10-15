// src/components/admin/schedule/forms/CreateScheduleDialog.view.tsx
"use client";
import * as React from "react";
import {
  X, MapPin, Calendar as CalendarIcon, Clock,
  BusFront, UserRound, StickyNote, Hash
} from "lucide-react";

export type CreateForm = {
  requestId: string | null;
  title: string;
  origin: string;
  destination: string;
  date: string;      // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  driverId: string;
  vehicleId: string;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  notes: string;
};

export type DriverOption = { id: string; name: string; busy?: boolean };
export type VehicleOption = { id: string; label: string; plateNo: string; busy?: boolean };

type Props = {
  open: boolean;
  tripIdPreview?: string;
  form: CreateForm;
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  driverConflicts: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  vehicleConflicts: Array<{ id: string; title: string; date: string; startTime: string; endTime: string }>;
  disableSave?: boolean;

  onChange: (patch: Partial<CreateForm>) => void;
  onPickOrigin?: () => void;
  onPickDestination?: () => void;
  onClose: () => void;
  onSave?: () => void;
};

export default function CreateScheduleDialogView({
  open,
  tripIdPreview = "",
  form,
  drivers,
  vehicles,
  driverConflicts,
  vehicleConflicts,
  disableSave = false,
  onChange,
  onPickOrigin,
  onPickDestination,
  onClose,
  onSave = () => {},
}: Props) {
  if (!open) return null;

  const titleText = form.requestId ? "Edit schedule" : "Create schedule";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="text-lg font-semibold">{titleText}</div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1">
              <Hash size={12} />
              <span className="font-medium">Trip ID (auto)</span>
            </span>
            <code className="rounded bg-neutral-50 px-1.5 py-0.5">{tripIdPreview || "—"}</code>
          </div>
          <button
            onClick={onClose}
            className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px w-full bg-neutral-200" />

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g., Library Books Transfer"
            />
          </Field>

          {/* Origin / Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Origin" hintBtn={{ label: "Pick on map", onClick: onPickOrigin }}>
              <Input
                leftIcon={<MapPin size={16} />}
                value={form.origin}
                onChange={(e) => onChange({ origin: e.target.value })}
                placeholder="Pickup point"
              />
            </Field>
            <Field label="Destination" hintBtn={{ label: "Pick on map", onClick: onPickDestination }}>
              <Input
                leftIcon={<MapPin size={16} />}
                value={form.destination}
                onChange={(e) => onChange({ destination: e.target.value })}
                placeholder="Drop-off point"
              />
            </Field>
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Date">
              <Input
                type="date"
                leftIcon={<CalendarIcon size={16} />}
                value={form.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </Field>
            <Field label="Start">
              <Input
                type="time"
                leftIcon={<Clock size={16} />}
                value={form.startTime}
                onChange={(e) => onChange({ startTime: e.target.value })}
              />
            </Field>
            <Field label="End">
              <Input
                type="time"
                leftIcon={<Clock size={16} />}
                value={form.endTime}
                onChange={(e) => onChange({ endTime: e.target.value })}
              />
            </Field>
          </div>

          {/* Driver / Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Driver">
              <Select
                leftIcon={<UserRound size={16} />}
                value={form.driverId}
                onChange={(v) => onChange({ driverId: v })}
                options={drivers.map(d => ({ id: d.id, label: `${d.name}${d.busy ? " • busy" : ""}`, disabled: d.busy }))}
                placeholder="Choose driver"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Items marked <span className="rounded bg-amber-100 px-1">busy</span> are unavailable for the selected time.
              </p>
            </Field>
            <Field label="Vehicle">
              <Select
                leftIcon={<BusFront size={16} />}
                value={form.vehicleId}
                onChange={(v) => onChange({ vehicleId: v })}
                options={vehicles.map(v => ({ id: v.id, label: `${v.label} (${v.plateNo})${v.busy ? " • busy" : ""}`, disabled: v.busy }))}
                placeholder="Choose vehicle"
              />
            </Field>
          </div>

          {/* Status / Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(v) => onChange({ status: v as CreateForm["status"] })}
                options={[
                  { id: "PLANNED", label: "Planned" },
                  { id: "ONGOING", label: "Ongoing" },
                  { id: "COMPLETED", label: "Completed" },
                  { id: "CANCELLED", label: "Cancelled" },
                ]}
              />
            </Field>
            <Field label="Notes (optional)">
              <TextArea
                leftIcon={<StickyNote size={16} />}
                value={form.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Anything the driver needs to know…"
              />
            </Field>
          </div>

          {/* Conflicts */}
          {(driverConflicts.length > 0 || vehicleConflicts.length > 0) && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
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

        <div className="h-px w-full bg-neutral-200" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 rounded-full bg-neutral-100 px-4 text-sm hover:bg-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={disableSave}
            className="h-10 rounded-full bg-[#7A0010] px-5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Small UI atoms -------------------- */

function Field({
  label, children, hintBtn,
}: {
  label: string;
  children: React.ReactNode;
  hintBtn?: { label: string; onClick?: () => void };
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium text-neutral-600">{label}</div>
        {hintBtn?.onClick && (
          <button
            type="button"
            onClick={hintBtn.onClick}
            className="text-[12px] font-medium text-[#7A0010] hover:opacity-90"
          >
            {hintBtn.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Input({
  leftIcon, className, ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { leftIcon?: React.ReactNode }) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-xl border px-3 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-[#7A0010]/25 border-neutral-300 ${className ?? ""}`}
    >
      {leftIcon && <span className="text-neutral-500">{leftIcon}</span>}
      <input {...rest} className="w-full bg-transparent outline-none text-sm" />
    </div>
  );
}

function TextArea({
  leftIcon, className, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { leftIcon?: React.ReactNode }) {
  return (
    <div
      className={`flex min-h-[90px] items-start gap-2 rounded-xl border px-3 py-2 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-[#7A0010]/25 border-neutral-300 ${className ?? ""}`}
    >
      {leftIcon && <span className="mt-1 text-neutral-500">{leftIcon}</span>}
      <textarea {...rest} className="w-full bg-transparent outline-none text-sm resize-y" />
    </div>
  );
}

function Select({
  leftIcon, value, onChange, options, placeholder,
}: {
  leftIcon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border px-3 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-[#7A0010]/25 border-neutral-300">
      {leftIcon && <span className="text-neutral-500">{leftIcon}</span>}
      <select
        className="w-full bg-transparent outline-none text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.id} value={o.id} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
