"use client";

import * as React from "react";
import type {
  Maintenance,
  MaintType,
  MaintAttachment,
  NextDueTint,
  MaintStatus,
} from "@/lib/admin/maintenance/maintenance.types";
import { createMaintenance, updateMaintenance } from "@/lib/admin/maintenance/handlers";
import { fileToAttachment } from "@/lib/admin/maintenance/maintenance.attachments";

/* ---------- Little UI helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };
function Input({ label, ...rest }: InputProps) {
  return (
    <Field label={label}>
      <input
        {...rest}
        className={[
          "h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none",
          "focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a]",
          rest.className ?? "",
        ].join(" ")}
      />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  items: readonly string[];
};
function Select({ label, items, ...rest }: SelectProps) {
  return (
    <Field label={label}>
      <select
        {...rest}
        className={[
          "h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none bg-white",
          "focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a]",
          rest.className ?? "",
        ].join(" ")}
      >
        {items.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ---------- Constants ---------- */

const TYPES = [
  "PMS",
  "Repair",
  "LTORenewal",
  "InsuranceRenewal",
  "Vulcanize",
  "Other",
] as const;

const DUE: readonly ("ok" | "soon" | "overdue" | "none")[] = ["ok", "soon", "overdue", "none"];

/* ---------- Form state ---------- */

type FormState = Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">;

type Props = {
  initial?: Partial<Maintenance>;
  onSubmit?: (m: Maintenance) => void;
  onCancel?: () => void;
};

export default function MaintForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = React.useState<FormState>({
    vehicle: initial?.vehicle ?? "",
    type: (initial?.type as MaintType) ?? "PMS",
    // Status is edited via the colored badge shortcut; we still keep a value in state.
    status: (initial?.status as MaintStatus) ?? "Submitted",
    vendor: initial?.vendor ?? "",
    costPhp: initial?.costPhp ?? 0,
    date: initial?.date ?? new Date().toISOString(),
    odometerAtService: initial?.odometerAtService ?? undefined,
    description: initial?.description ?? "",
    attachments: initial?.attachments ?? [],
    nextDueAuto: initial?.nextDueAuto ?? true,
    nextDueDateISO: initial?.nextDueDateISO ?? undefined,
    nextDueOdometer: initial?.nextDueOdometer ?? undefined,
    nextDueTint: (initial?.nextDueTint as NextDueTint) ?? "ok",
    createdBy: initial?.createdBy ?? "Transport Office",
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const isUpdate = (initial as any)?.id;
    const payload = form as Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">;

    const result = (isUpdate
      ? await updateMaintenance((initial as any).id as string, payload as any)
      : await createMaintenance(payload as any)) as Maintenance | undefined;

    if (result) {
      onSubmit?.(result);
    }
  }

  function removeAttachment(id: string) {
    set("attachments", (form.attachments ?? []).filter((a) => a.id !== id));
  }

  async function attachFiles(evt: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(evt.target.files ?? []);
    if (!files.length) return;
    const atts = await Promise.all(files.map(fileToAttachment));
    set("attachments", [ ...(form.attachments ?? []), ...atts ]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Vehicle"
          value={form.vehicle ?? ""}
          onChange={(e) => set("vehicle", e.target.value)}
          placeholder="EG: PICKUP-07 • Ford Ranger"
        />

        <Select
          label="Type"
          value={form.type}
          items={TYPES as unknown as string[]}
          onChange={(e) => set("type", e.target.value as MaintType)}
        />

        {/* Status select intentionally removed (badge shortcut handles it) */}

        <Input
          label="Vendor"
          value={form.vendor ?? ""}
          onChange={(e) => set("vendor", e.target.value)}
          placeholder="EG: Malayan Insurance"
        />

        <Input
          label="Cost (PHP)"
          type="number"
          inputMode="decimal"
          value={String(form.costPhp ?? 0)}
          onChange={(e) => set("costPhp", Number(e.target.value) || 0)}
        />

        <Input
          label="Date"
          type="date"
          value={(form.date ?? "").slice(0, 10)}
          onChange={(e) => set("date", e.target.value)}
        />

        <Input
          label="Odometer @ Service (km)"
          type="number"
          inputMode="numeric"
          value={form.odometerAtService != null ? String(form.odometerAtService) : ""}
          onChange={(e) =>
            set("odometerAtService", e.target.value === "" ? undefined : Number(e.target.value) || 0)
          }
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Next Due Date (ISO)"
          type="date"
          value={(form.nextDueDateISO ?? "").slice(0, 10)}
          onChange={(e) => set("nextDueDateISO", e.target.value || undefined)}
        />

        <Input
          label="Next Due Odometer"
          type="number"
          inputMode="numeric"
          value={form.nextDueOdometer != null ? String(form.nextDueOdometer) : ""}
          onChange={(e) =>
            set("nextDueOdometer", e.target.value === "" ? undefined : Number(e.target.value) || 0)
          }
        />

        <Select
          label="Next Due Tint"
          value={form.nextDueTint ?? "ok"}
          items={DUE as unknown as string[]}
          onChange={(e) => set("nextDueTint", e.target.value as NextDueTint)}
        />
      </section>

      <section>
        <Field label="Created by">
          <input
            value={form.createdBy ?? ""}
            onChange={(e) => set("createdBy", e.target.value)}
            className="h-10 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a]"
          />
        </Field>
      </section>

      <section className="mt-3">
        <div className="text-xs text-neutral-600 mb-1">Description</div>
        <textarea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Notes, findings, what was replaced…"
          className="w-full min-h-[120px] rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a]"
        />
      </section>

      <section>
        <div className="text-xs text-neutral-600 mb-1">Attachments</div>
        <input type="file" multiple accept="image/*,application/pdf" onChange={attachFiles} />
        <div className="mt-2 space-y-1">
          {(form.attachments ?? []).map((a: MaintAttachment) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {a.kind === "img" ? "IMG" : "PDF"} • {a.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="text-neutral-600 hover:text-neutral-800 underline decoration-dotted"
                aria-label="Remove attachment"
              >
                remove
              </button>
            </div>
          ))}
          {(form.attachments ?? []).length === 0 && (
            <span className="text-neutral-400">No files</span>
          )}
        </div>
      </section>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 h-10 rounded-lg border bg-white hover:bg-neutral-50 border-neutral-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 h-10 rounded-lg text-white bg-[#7a0019] hover:bg-[#6b0016]"
        >
          Save
        </button>
      </div>
    </form>
  );
}
