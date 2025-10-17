// src/components/user/request/ui/SeminarApplicationForm.ui.tsx
"use client";

import * as React from "react";
import {
  TextInput,
  DateInput,
  TextArea,
  CurrencyInput,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

const MODALITY_OPTIONS = ["Onsite", "Online", "Hybrid"] as const;
const TRAINING_TYPES = ["Compliance", "Professional Development"] as const;

type Errors = Record<string, string>;

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeDays(from?: string, to?: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.valueOf()) || Number.isNaN(b.valueOf())) return null;
  // inclusive day count (ignores time components)
  const ms =
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const diff = Math.floor(ms / 86400000) + 1;
  return diff >= 1 ? diff : null;
}

export default function SeminarApplicationForm({
  data,
  onChange,
  errors,
}: {
  data: any;
  onChange: (patch: any) => void;
  errors: Errors;
}) {
  const selectedType =
    (data?.typeOfTraining?.[0] as (typeof TRAINING_TYPES)[number]) ?? "";

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Seminar Application</h3>
        <span className="text-xs text-neutral-500">Required fields marked with *</span>
      </div>

      {/* Basics */}
      <div className="grid gap-4 md:grid-cols-2">
        <DateInput
          id="sem-applicationDate"
          label="Application date"
          required
          value={data?.applicationDate || ""}
          onChange={(e) =>
            onChange({ applicationDate: (e.target as HTMLInputElement).value })
          }
          error={errors["seminar.applicationDate"]}
        />

        <TextInput
          id="sem-title"
          label="Seminar / Training / Workshop / Conference (full title)"
          required
          placeholder="e.g., National Research Conference 2025"
          value={data?.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          error={errors["seminar.title"]}
        />

        <DateInput
          id="sem-dateFrom"
          label="Date from"
          required
          value={data?.dateFrom || ""}
          onChange={(e) => {
            const dateFrom = (e.target as HTMLInputElement).value;
            onChange({ dateFrom, days: computeDays(dateFrom, data?.dateTo ?? "") });
          }}
          error={errors["seminar.dateFrom"]}
        />

        <div className="grid gap-2 md:grid-cols-[1fr_140px]">
          <DateInput
            id="sem-dateTo"
            label="Date to"
            required
            value={data?.dateTo || ""}
            onChange={(e) => {
              const dateTo = (e.target as HTMLInputElement).value;
              onChange({ dateTo, days: computeDays(data?.dateFrom ?? "", dateTo) });
            }}
            error={errors["seminar.dateTo"]}
          />
          {/* read-only days */}
          <div className="grid gap-1">
            <span className="text-[13px] font-medium text-neutral-700">No. of Day/s</span>
            <input
              id="sem-days"
              value={data?.days ?? ""}
              readOnly
              className="h-10 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-700"
            />
          </div>
        </div>
      </div>

      {/* Type + category */}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {/* Type of Training */}
        <fieldset className="rounded-xl border border-neutral-200 p-3">
          <legend className="px-1 text-[13px] font-medium text-neutral-700">
            Type of Training
          </legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {TRAINING_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="trainingType"
                  value={t}
                  checked={selectedType === t}
                  onChange={() => onChange({ typeOfTraining: [t] })}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
          {errors["seminar.typeOfTraining"] && (
            <div className="mt-1 text-xs text-red-600">
              {errors["seminar.typeOfTraining"]}
            </div>
          )}
        </fieldset>

        {/* Training category */}
        <label className="grid w-full gap-1">
          <span className="text-[13px] font-medium text-neutral-700">Training category</span>
          <select
            className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
            value={data?.trainingCategory || ""}
            onChange={(e) => onChange({ trainingCategory: e.target.value })}
          >
            <option value="">Select…</option>
            <option value="local">Local</option>
            <option value="regional">Regional</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </label>
      </div>

      {/* Provider / Venue / Modality */}
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <TextInput
          label="Sponsor / Provider"
          placeholder="Organization / Agency"
          value={data?.sponsor || ""}
          onChange={(e) => onChange({ sponsor: e.target.value })}
        />

        <LocationField
          label="Venue"
          value={data?.venue || ""}
          geo={data?.venueGeo || null}
          onChange={({ address, geo }) =>
            onChange({ venue: address, venueGeo: geo ?? null })
          }
          inputId="sem-venue"
          placeholder="Type address or pick on map"
        />

        <label className="grid gap-1">
          <span className="text-[13px] font-medium text-neutral-700">Modality</span>
          <select
            className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
            value={data?.modality || ""}
            onChange={(e) => onChange({ modality: e.target.value })}
          >
            <option value="">Select…</option>
            {MODALITY_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors["seminar.modality"] && (
            <span className="text-xs text-red-600">{errors["seminar.modality"]}</span>
          )}
        </label>
      </div>

      {/* Fees summary */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label="Registration cost"
          placeholder="0.00"
          value={data?.registrationCost ?? ""}
          onChange={(e) =>
            onChange({
              registrationCost: asNum(e.target.value),
            })
          }
        />
        <CurrencyInput
          label="Total amount of expenses"
          placeholder="0.00"
          value={data?.totalAmount ?? ""}
          onChange={(e) => onChange({ totalAmount: asNum(e.target.value) })}
        />
      </div>

      {/* Breakdown list */}
      <BreakdownEditor
        items={Array.isArray(data?.breakdown) ? data.breakdown : []}
        onChange={(items) => onChange({ breakdown: items })}
      />

      {/* Applicants (multi) */}
      <ApplicantsEditor
        list={Array.isArray(data?.applicants) ? data.applicants : []}
        onChange={(list) => onChange({ applicants: list })}
      />

      {/* Others */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextArea
          label="Make-up Class Schedule (for faculty)"
          placeholder="If faculty, indicate proposed make-up classes"
          value={data?.makeUpClassSchedule || ""}
          onChange={(e) => onChange({ makeUpClassSchedule: e.target.value })}
        />

        <label className="grid gap-1">
          <span className="text-[13px] font-medium text-neutral-700">
            Applicant’s Undertaking
          </span>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!data?.applicantUndertaking}
              onChange={(e) => onChange({ applicantUndertaking: e.target.checked })}
            />
            <span className="text-sm text-neutral-700">I agree to the undertaking terms.</span>
          </label>
        </label>
      </div>

      <div className="mt-4">
        <CurrencyInput
          label="Fund release line"
          placeholder="0.00"
          value={data?.fundReleaseLine ?? ""}
          onChange={(e) => onChange({ fundReleaseLine: asNum(e.target.value) })}
        />
      </div>
    </section>
  );
}

function BreakdownEditor({
  items,
  onChange,
}: {
  items: { label: string; amount: number | null }[];
  onChange: (items: { label: string; amount: number | null }[]) => void;
}) {
  function setItem(i: number, patch: Partial<{ label: string; amount: number | null }>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() {
    onChange([...(items || []), { label: "", amount: null }]);
  }
  function remove(i: number) {
    const next = [...items];
    next.splice(i, 1);
    onChange(next);
  }
  return (
    <div className="mt-4 rounded-xl border border-neutral-200 p-3">
      <div className="mb-2 text-sm font-semibold">Breakdown of Expenses</div>
      <div className="grid gap-3">
        {items?.length ? null : <div className="text-xs text-neutral-500">No items yet.</div>}

        {items?.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_160px_32px] items-end gap-2">
            <TextInput
              label={i === 0 ? "Label" : ""}
              placeholder="e.g., Accommodation / Transport / Materials"
              value={it.label}
              onChange={(e) => setItem(i, { label: e.target.value })}
            />
            <CurrencyInput
              label={i === 0 ? "Amount" : ""}
              placeholder="0.00"
              value={it.amount ?? ""}
              onChange={(e) => setItem(i, { amount: asNum(e.target.value) })}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mb-2 h-10 rounded-lg border border-neutral-300 text-sm"
              aria-label="Remove row"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}

        <div>
          <button type="button" onClick={add} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
            + Add item
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicantsEditor({
  list,
  onChange,
}: {
  list: Array<{ name: string; department: string; availableFdp?: number | null; signature?: string | null }>;
  onChange: (list: Array<{ name: string; department: string; availableFdp?: number | null; signature?: string | null }>) => void;
}) {
  function setRow(i: number, patch: Partial<{ name: string; department: string; availableFdp?: number | null; signature?: string | null }>) {
    const next = [...list];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() {
    onChange([...(list || []), { name: "", department: "", availableFdp: null, signature: null }]);
  }
  function remove(i: number) {
    const next = [...list];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-3">
      <div className="mb-2 text-sm font-semibold">Applicants</div>
      <div className="grid gap-3">
        {list?.length ? null : <div className="text-xs text-neutral-500">No applicants yet.</div>}
        {list?.map((row, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[1.1fr_1fr_160px]">
            <TextInput
              label={i === 0 ? "Name" : ""}
              placeholder="Full name"
              value={row.name}
              onChange={(e) => setRow(i, { name: e.target.value })}
            />
            {/* Department with searchable select */}
            <div className="grid gap-1">
              <DepartmentSelect
                id={`app-dept-${i}`}
                label={i === 0 ? "Department / Office" : ""}
                value={row.department}
                placeholder="e.g., CCMS"
                onChange={(dept) => setRow(i, { department: dept })}
              />
            </div>
            <TextInput
              label={i === 0 ? "Available FDP" : ""}
              placeholder="e.g., 12"
              value={row.availableFdp ?? ""}
              onChange={(e) => setRow(i, { availableFdp: asNum(e.target.value) })}
            />

            <div className="md:col-span-3 flex items-center gap-2">
              <SignatureInline
                value={row.signature || null}
                onChange={(sig) => setRow(i, { signature: sig })}
              />
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                onClick={() => remove(i)}
                title="Remove applicant"
              >
                Remove
              </button>
            </div>

            <hr className="md:col-span-3 mt-1 border-neutral-200" />
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={add}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            + Add applicant
          </button>
        </div>
      </div>
    </div>
  );
}

function SignatureInline({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium">Signature:</div>
      {value ? (
        <img
          src={value}
          alt="Signature"
          className="h-10 rounded border border-neutral-300 bg-white"
        />
      ) : (
        <span className="text-xs text-neutral-500">None</span>
      )}
      <button
        type="button"
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        onClick={() => setOpen(true)}
      >
        Capture
      </button>
      {value && (
        <button
          type="button"
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          onClick={() => onChange(null)}
        >
          Clear
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-2 text-sm font-semibold">Sign here</div>
            <SignaturePad
              height={220}
              value={value}
              onDraw={() => setDirty(true)}
              onSave={(dataUrl) => {
                onChange(dataUrl);
                setDirty(false);
                setOpen(false);
              }}
              onClear={() => {
                onChange(null);
                setDirty(false);
              }}
              onUpload={async (file) => {
                const buf = await file.arrayBuffer();
                const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                onChange(`data:${file.type};base64,${b64}`);
                setDirty(false);
                setOpen(false);
              }}
              saveDisabled={!dirty}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
