// src/components/user/request/ui/SeminarApplicationForm.ui.tsx
"use client";

import * as React from "react";
import {
  TextInput,
  DateInput,
  TextArea,
  CurrencyInput,
  SelectInput,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import ParticipantInvitationEditor from "./ParticipantInvitationEditor";

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

  // Auto-calculate days whenever dates change
  React.useEffect(() => {
    if (data?.dateFrom && data?.dateTo) {
      const calculatedDays = computeDays(data.dateFrom, data.dateTo);
      if (calculatedDays !== data.days) {
        onChange({ days: calculatedDays });
      }
    } else if (data?.days && (!data?.dateFrom || !data?.dateTo)) {
      // Clear days if dates are incomplete
      onChange({ days: null });
    }
  }, [data?.dateFrom, data?.dateTo]);

  const calculatedDays = data?.dateFrom && data?.dateTo 
    ? computeDays(data.dateFrom, data.dateTo) 
    : null;

  return (
    <section className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-7 shadow-xl">
      <div className="mb-7 flex items-center justify-between border-b-2 border-gray-200 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Seminar Application</h3>
          <p className="mt-2 text-sm text-gray-600">Complete all required fields to submit your seminar application</p>
        </div>
        <div className="rounded-lg border border-[#7A0010]/20 bg-gradient-to-br from-[#7A0010]/5 to-[#7A0010]/10 px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-[#7A0010]">Required fields marked with *</span>
        </div>
      </div>

      {/* Basics */}
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
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
          label="Seminar / Training / Workshop / Conference"
          required
          helper="Full title of the event"
          placeholder="e.g., National Research Conference 2025"
          value={data?.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
          error={errors["seminar.title"]}
        />

        <DateInput
          id="sem-dateFrom"
          label="Departure date"
          required
          value={data?.dateFrom || ""}
          onChange={(e) => {
            const dateFrom = (e.target as HTMLInputElement).value;
            onChange({ dateFrom });
          }}
          error={errors["seminar.dateFrom"]}
        />

        <DateInput
          id="sem-dateTo"
          label="Date to"
          required
          value={data?.dateTo || ""}
          onChange={(e) => {
            const dateTo = (e.target as HTMLInputElement).value;
            onChange({ dateTo });
          }}
          error={errors["seminar.dateTo"]}
        />
      </div>

      {/* Days Display - Subtle inline display */}
      {calculatedDays && (
        <div className="mt-1 flex justify-end">
          <div className="w-full md:w-[calc(50%-0.625rem)]">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">No. of Day/s:</span>
              <span className="font-semibold text-gray-800">{calculatedDays} {calculatedDays === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Type + category */}
      <div className="mt-8 grid gap-5 md:grid-cols-2 md:items-start">
        {/* Type of Training */}
        <div className="grid gap-1.5">
          <label className="text-[13px] font-semibold text-gray-800">
            Type of Training <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRAINING_TYPES.map((t) => (
              <label 
                key={t} 
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-all ${
                  selectedType === t
                    ? 'border-[#7A0010] bg-gradient-to-br from-[#7A0010]/10 to-[#7A0010]/5 shadow-md ring-2 ring-[#7A0010]/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  name="trainingType"
                  value={t}
                  checked={selectedType === t}
                  onChange={() => onChange({ typeOfTraining: [t] })}
                  className="h-4 w-4 text-[#7A0010] focus:ring-2 focus:ring-[#7A0010]"
                />
                <span className={`text-sm font-semibold ${
                  selectedType === t ? 'text-[#7A0010]' : 'text-gray-700'
                }`}>
                  {t}
                </span>
              </label>
            ))}
          </div>
          {errors["seminar.typeOfTraining"] && (
            <div className="mt-0.5 flex items-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50 px-2.5 py-1.5">
              <span className="text-xs font-medium text-red-700">{errors["seminar.typeOfTraining"]}</span>
            </div>
          )}
        </div>

        {/* Training category */}
        <SelectInput
          id="sem-trainingCategory"
          label="Training category"
          value={data?.trainingCategory || ""}
          onChange={(e) => onChange({ trainingCategory: e.target.value })}
          options={[
            { label: "Local", value: "local" },
            { label: "Regional", value: "regional" },
            { label: "National", value: "national" },
            { label: "International", value: "international" },
          ]}
          placeholder="Select category…"
        />
      </div>

      {/* Provider / Venue / Modality */}
      <div className="mt-8 grid gap-5 md:grid-cols-3 md:items-start">
        <TextInput
          label="Sponsor / Provider"
          placeholder="Organization / Agency (Do not use acronym)"
          value={data?.sponsor || ""}
          onChange={(e) => onChange({ sponsor: e.target.value })}
          helper="Full organization name, no acronyms"
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

        <SelectInput
          id="sem-modality"
          label="Modality"
          required={!!errors["seminar.modality"]}
          value={data?.modality || ""}
          onChange={(e) => onChange({ modality: e.target.value })}
          error={errors["seminar.modality"]}
          options={MODALITY_OPTIONS.map((m) => ({ label: m, value: m }))}
        />
      </div>

      {/* Financial Information */}
      <div className="mt-8 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
        <h4 className="mb-5 text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-3">Financial Information</h4>
        <div className="grid gap-5 md:grid-cols-2">
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
      </div>

      {/* Breakdown list */}
      <div className="mt-8">
        <BreakdownEditor
          items={Array.isArray(data?.breakdown) ? data.breakdown : []}
          onChange={(items) => onChange({ breakdown: items })}
        />
      </div>

      {/* Participants - Email-based invitations */}
      <div>
        <ParticipantInvitationEditor
          invitations={Array.isArray(data?.participantInvitations) ? data.participantInvitations : []}
          onChange={(invitations) => onChange({ participantInvitations: invitations })}
          requestId={data?.requestId}
          disabled={data?.isSubmitted}
          onStatusChange={(allConfirmed: boolean) => {
            // Store confirmation status for validation
            // Only update if value actually changed to avoid infinite loops
            if (data?.allParticipantsConfirmed !== allConfirmed) {
              onChange({ allParticipantsConfirmed: allConfirmed });
            }
          }}
        />
        {errors["seminar.participants"] && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
            <p className="text-xs font-medium text-red-800">{errors["seminar.participants"]}</p>
          </div>
        )}
      </div>

      {/* Make-up Class Schedule & Undertaking */}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <TextArea
          label="Make-up Class Schedule (for faculty)"
          placeholder="If faculty, indicate proposed make-up classes for verification"
          value={data?.makeUpClassSchedule || ""}
          onChange={(e) => onChange({ makeUpClassSchedule: e.target.value })}
          helper="Required for faculty members attending seminars"
        />

        <div className="grid gap-1.5">
          <label className="text-[13px] font-semibold text-gray-800">
            Applicant's Undertaking
          </label>
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-2 border-gray-300 text-[#7A0010] focus:ring-2 focus:ring-[#7A0010] transition-all"
                checked={!!data?.applicantUndertaking}
                onChange={(e) => onChange({ applicantUndertaking: e.target.checked })}
              />
              <p className="text-xs leading-relaxed text-gray-600">
                I agree to liquidate advanced amounts within 5 working days, submit required documents, and serve as a resource speaker in an echo seminar.
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Fund release line */}
      <div className="mt-8">
        <CurrencyInput
          label="Fund release line"
          placeholder="0.00"
          value={data?.fundReleaseLine ?? ""}
          onChange={(e) => onChange({ fundReleaseLine: asNum(e.target.value) })}
          helper="Budget line item for fund release"
        />
      </div>

      {/* Requesting Person's Signature - Enhanced */}
      <div 
        id="sem-signature"
        data-error={errors["seminar.requesterSignature"] ? "true" : undefined}
        className={`mt-8 rounded-xl border-2 p-6 shadow-lg transition-all ${
          errors["seminar.requesterSignature"] 
            ? "border-red-300 bg-gradient-to-br from-red-50 to-red-100/50" 
            : "border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white"
        }`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <span className="text-sm font-bold text-gray-900">
              Requesting person's signature <span className="text-red-500">*</span>
            </span>
            <p className="mt-1 text-xs text-gray-500">
              Sign with mouse / touch - or upload your pre-saved signature image file
            </p>
          </div>
          {errors["seminar.requesterSignature"] && (
            <span className="rounded-lg border-2 border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
              {errors["seminar.requesterSignature"]}
            </span>
          )}
        </div>
        <SignaturePad
          height={160}
          value={data?.requesterSignature || null}
          onSave={(dataUrl) => onChange({ requesterSignature: dataUrl })}
          onClear={() => onChange({ requesterSignature: "" })}
          hideSaveButton
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

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between border-b-2 border-gray-200 pb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900 tracking-tight">Breakdown of Expenses</h4>
          <p className="mt-1 text-xs text-gray-600">List all expense items and amounts</p>
        </div>
        {total > 0 && (
          <div className="rounded-lg bg-blue-50 px-3 py-1">
            <span className="text-xs font-semibold text-blue-700">
              Total: ₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
      <div className="grid gap-3">
        {items?.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No expense items added yet</p>
            <p className="mt-1 text-xs text-gray-400">Click "Add item" below to add expenses</p>
          </div>
        ) : (
          items?.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_180px_40px] items-end gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
              <TextInput
                label={i === 0 ? "Expense Item" : ""}
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
                className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-red-200 bg-red-50 text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                aria-label="Remove row"
                title="Remove"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>
          ))
        )}

        <div className="pt-2">
          <button 
            type="button" 
            onClick={add} 
            className="flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <span className="text-lg">+</span>
            Add Expense Item
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
