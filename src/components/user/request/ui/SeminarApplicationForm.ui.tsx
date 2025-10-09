"use client";

import * as React from "react";

export default function SeminarApplicationForm({
  data,
  onChange,
  errors,
}: {
  data: any;
  onChange: (patch: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Seminar Application</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Application date" error={errors["seminar.applicationDate"]}>
          <input
            type="date"
            className="input"
            value={data?.applicationDate || ""}
            onChange={(e) => onChange({ applicationDate: e.target.value })}
          />
        </Field>

        <Field label="Title" error={errors["seminar.title"]}>
          <input
            className="input"
            value={data?.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>

        <Field label="Date from" error={errors["seminar.dateFrom"]}>
          <input
            type="date"
            className="input"
            value={data?.dateFrom || ""}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
        </Field>

        <Field label="Date to" error={errors["seminar.dateTo"]}>
          <input
            type="date"
            className="input"
            value={data?.dateTo || ""}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2 mt-2">
        <Field label="Type of Training (tags)">
          <input
            className="input"
            placeholder="Comma-separated e.g., Workshop, Webinar"
            value={(data?.typeOfTraining || []).join(", ")}
            onChange={(e) =>
              onChange({
                typeOfTraining: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>

        <Field label="Training category">
          <select
            className="input"
            value={data?.trainingCategory || ""}
            onChange={(e) => onChange({ trainingCategory: e.target.value })}
          >
            <option value="">Select…</option>
            <option value="local">Local</option>
            <option value="regional">Regional</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mt-2">
        <Field label="Sponsor/Provider">
          <input
            className="input"
            value={data?.sponsor || ""}
            onChange={(e) => onChange({ sponsor: e.target.value })}
          />
        </Field>
        <Field label="Venue">
          <input
            className="input"
            value={data?.venue || ""}
            onChange={(e) => onChange({ venue: e.target.value })}
          />
        </Field>
        <Field label="Modality">
          <input
            className="input"
            value={data?.modality || ""}
            onChange={(e) => onChange({ modality: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Registration Fee (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.fees?.registrationFee ?? ""}
            onChange={(e) =>
              onChange({
                fees: {
                  ...(data?.fees || {}),
                  registrationFee: asNum(e.target.value),
                },
              })
            }
          />
        </Field>

        <Field label="Total Amount (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.fees?.totalAmount ?? ""}
            onChange={(e) =>
              onChange({
                fees: { ...(data?.fees || {}), totalAmount: asNum(e.target.value) },
              })
            }
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Registration (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.breakdown?.registration ?? ""}
            onChange={(e) =>
              onChange({
                breakdown: {
                  ...(data?.breakdown || {}),
                  registration: asNum(e.target.value),
                },
              })
            }
          />
        </Field>

        <Field label="Accommodation (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.breakdown?.accommodation ?? ""}
            onChange={(e) =>
              onChange({
                breakdown: {
                  ...(data?.breakdown || {}),
                  accommodation: asNum(e.target.value),
                },
              })
            }
          />
        </Field>

        <Field label="Per diem / Meals / Driver’s allowance (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.breakdown?.perDiemMealsDriversAllowance ?? ""}
            onChange={(e) =>
              onChange({
                breakdown: {
                  ...(data?.breakdown || {}),
                  perDiemMealsDriversAllowance: asNum(e.target.value),
                },
              })
            }
          />
        </Field>

        <Field label="Transport / Fare / Gas / Parking / Toll (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.breakdown?.transportFareGasParkingToll ?? ""}
            onChange={(e) =>
              onChange({
                breakdown: {
                  ...(data?.breakdown || {}),
                  transportFareGasParkingToll: asNum(e.target.value),
                },
              })
            }
          />
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <input
            className="input col-span-2"
            placeholder="Other (label)"
            value={data?.breakdown?.otherLabel || ""}
            onChange={(e) =>
              onChange({
                breakdown: { ...(data?.breakdown || {}), otherLabel: e.target.value },
              })
            }
          />
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={data?.breakdown?.otherAmount ?? ""}
            onChange={(e) =>
              onChange({
                breakdown: {
                  ...(data?.breakdown || {}),
                  otherAmount: asNum(e.target.value),
                },
              })
            }
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Make-up Class Schedule">
          <textarea
            className="input min-h-[80px]"
            value={data?.makeUpClassSchedule || ""}
            onChange={(e) => onChange({ makeUpClassSchedule: e.target.value })}
          />
        </Field>

        <Field label="Applicant’s Undertaking">
          <input
            type="checkbox"
            className="mr-2"
            checked={!!data?.applicantUndertaking}
            onChange={(e) => onChange({ applicantUndertaking: e.target.checked })}
          />
          Agree
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Fund release line (₱)">
          <input
            className="input"
            inputMode="decimal"
            value={data?.fundReleaseLine ?? ""}
            onChange={(e) =>
              onChange({ fundReleaseLine: asNum(e.target.value) })
            }
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: React.PropsWithChildren<{ label: string; error?: string }>) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-neutral-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
