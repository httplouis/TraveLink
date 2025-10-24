"use client";
import * as React from "react";
import type {
  Maintenance,
  MaintAttachment,
  MaintType,
  MaintStatus,
} from "@/lib/admin/maintenance/types";
import {
  MAINT_TYPES as TYPES,
  MAINT_STATUSES as STATUSES,
} from "@/lib/admin/maintenance/types";
import { fileToAttachment } from "@/lib/admin/maintenance/maintenance.attachments";
import AttachmentsGrid from "../ui/AttachmentsGrid.ui";

type Props = {
  initial?: Maintenance;
  onSubmit: (data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">) => void;
  onCancel: () => void;
};

export default function MaintForm({ initial, onSubmit, onCancel }: Props) {
  const nowDate = new Date().toISOString().slice(0, 10);

  const [form, setForm] = React.useState<Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">>({
    vehicle: initial?.vehicle || "",
    type: initial?.type || "PMS",
    status: initial?.status || "Submitted",
    date: initial?.date || nowDate,
    vendor: initial?.vendor || "",
    costPhp: initial?.costPhp ?? 0,
    odometerAtService: initial?.odometerAtService ?? undefined,
    tireRotationApplied: initial?.tireRotationApplied ?? false,
    attachments: initial?.attachments || [],
    description: initial?.description || "",
    createdBy: initial?.createdBy || "Transport Office",
    assignedDriverId: initial?.assignedDriverId,
    // next due — support auto/manual
    nextDueAuto: initial?.nextDueAuto ?? true,
    nextDueDateISO: initial?.nextDueDateISO,
    nextDueOdometer: initial?.nextDueOdometer,
    nextDueTint: initial?.nextDueTint,
  });

  // add/remove attachments
  async function onFiles(fs: FileList | null) {
    if (!fs?.length) return;
    const arr: MaintAttachment[] = [];
    for (const f of Array.from(fs)) arr.push(await fileToAttachment(f));
    setForm((prev) => ({ ...prev, attachments: [...(prev.attachments || []), ...arr] }));
  }
  function removeAttachment(id: string) {
    setForm((prev) => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== id) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...form });
  }

  // pretty preview for next due box
  const nextPreview = (() => {
    const date = form.nextDueDateISO ? new Date(form.nextDueDateISO).toLocaleDateString() : "—";
    const odo = form.nextDueOdometer != null ? `${form.nextDueOdometer.toLocaleString()} km` : "—";
    const tint = form.nextDueTint ?? "ok";
    return { date, odo, tint };
  })();

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Vehicle" value={form.vehicle} onChange={(v) => setForm({ ...form, vehicle: v })} required />
        <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as MaintType })} options={TYPES} />
        <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v as MaintStatus })} options={STATUSES} />
        <Input
          label="Date"
          type="date"
          value={form.date ? form.date.slice(0, 10) : ""}
          onChange={(v) => setForm({ ...form, date: v })}
          required
        />
        <Input label="Vendor" value={form.vendor || ""} onChange={(v) => setForm({ ...form, vendor: v })} />
        <Input label="Cost (PHP)" type="number" value={String(form.costPhp ?? 0)} onChange={(v) => setForm({ ...form, costPhp: Number(v || 0) })} />
        <Input label="Odometer @ Service (km)" type="number" value={String(form.odometerAtService ?? "")} onChange={(v) => setForm({ ...form, odometerAtService: v ? Number(v) : undefined })} />
        <div className="flex items-center gap-2 pt-7">
          <input
            id="tireRot"
            type="checkbox"
            checked={!!form.tireRotationApplied}
            onChange={(e) => setForm({ ...form, tireRotationApplied: e.target.checked })}
          />
          <label htmlFor="tireRot" className="text-sm text-neutral-700">Tire rotation applied</label>
        </div>
      </div>

      <label className="block">
        <div className="text-sm text-neutral-600 mb-1">Description</div>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full min-h-[120px] rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a]"
        />
      </label>

      {/* Attachments */}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-neutral-600 mb-1">Attachments</div>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => onFiles(e.target.files)}
            className="block w-full text-sm"
          />
          <div className="mt-1 text-xs italic text-neutral-400">{!form.attachments?.length && "None"}</div>
        </label>
        <div>
          <AttachmentsGrid items={form.attachments} />
        </div>
      </div>

      {/* Next Due Auto/Manual */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-neutral-700">Next Due</div>
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.nextDueAuto}
                onChange={(e) => setForm({ ...form, nextDueAuto: e.target.checked })}
              />
              Auto
            </label>
          </div>

          {/* Manual controls only when Auto is OFF */}
          {!form.nextDueAuto && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Input
                label="Date"
                type="date"
                value={form.nextDueDateISO ? form.nextDueDateISO.slice(0, 10) : ""}
                onChange={(v) => setForm({ ...form, nextDueDateISO: v || undefined })}
              />
              <Input
                label="Odometer (km)"
                type="number"
                value={form.nextDueOdometer != null ? String(form.nextDueOdometer) : ""}
                onChange={(v) => setForm({ ...form, nextDueOdometer: v ? Number(v) : undefined })}
              />
            </div>
          )}

          <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm">
            <div>Next Date: <strong>{nextPreview.date}</strong></div>
            <div>Odo: <strong>{nextPreview.odo}</strong></div>
            <div>Tint: <strong className="capitalize">{nextPreview.tint}</strong></div>
          </div>
        </div>

        <div className="flex items-end justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#7a1f2a] text-white px-4 py-2 text-sm hover:brightness-95"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}

/* small local UI helpers */
function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm text-neutral-600 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block relative">
      <div className="text-sm text-neutral-600 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-neutral-300 pr-8 pl-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
