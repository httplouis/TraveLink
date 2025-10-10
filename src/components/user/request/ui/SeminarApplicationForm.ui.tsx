// components/user/request/ui/SeminarApplicationForm.ui.tsx
"use client";

import * as React from "react";
import {
  TextInput,
  DateInput,
  TextArea,
  CurrencyInput,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";

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
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Seminar Application</h3>
        <span className="text-xs text-neutral-500">
          Required fields marked with *
        </span>
      </div>

      {/* Required basics */}
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
          label="Title"
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
          onChange={(e) =>
            onChange({ dateFrom: (e.target as HTMLInputElement).value })
          }
          error={errors["seminar.dateFrom"]}
        />

        <DateInput
          id="sem-dateTo"
          label="Date to"
          required
          value={data?.dateTo || ""}
          onChange={(e) =>
            onChange({ dateTo: (e.target as HTMLInputElement).value })
          }
          error={errors["seminar.dateTo"]}
        />
      </div>

      {/* Tags + category */}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <TextInput
          label="Type of Training (tags)"
          placeholder="Comma-separated, e.g., Workshop, Webinar"
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

        <label className="grid w-full gap-1">
          <span className="text-[13px] font-medium text-neutral-700">
            Training category
          </span>
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
          label="Sponsor/Provider"
          placeholder="Organization / Agency"
          value={data?.sponsor || ""}
          onChange={(e) => onChange({ sponsor: e.target.value })}
        />

        {/* VENUE — LocationField with embedded “Pick on map” button */}
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

        <TextInput
          label="Modality"
          placeholder="Onsite / Online / Hybrid"
          value={data?.modality || ""}
          onChange={(e) => onChange({ modality: e.target.value })}
        />
      </div>

      {/* Fees summary */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label="Registration Fee"
          placeholder="0.00"
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
        <CurrencyInput
          label="Total Amount"
          placeholder="0.00"
          value={data?.fees?.totalAmount ?? ""}
          onChange={(e) =>
            onChange({
              fees: {
                ...(data?.fees || {}),
                totalAmount: asNum(e.target.value),
              },
            })
          }
        />
      </div>

      {/* Breakdown */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CurrencyInput
          label="Registration"
          placeholder="0.00"
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
        <CurrencyInput
          label="Accommodation"
          placeholder="0.00"
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
        <CurrencyInput
          label="Per diem / Meals / Driver’s allowance"
          placeholder="0.00"
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
        <CurrencyInput
          label="Transport / Fare / Gas / Parking / Toll"
          placeholder="0.00"
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

        <div className="md:col-span-2 grid gap-4 md:grid-cols-[1fr_180px]">
          <TextInput
            label="Other (label)"
            placeholder="e.g., Materials, Printing"
            value={data?.breakdown?.otherLabel || ""}
            onChange={(e) =>
              onChange({
                breakdown: { ...(data?.breakdown || {}), otherLabel: e.target.value },
              })
            }
          />
          <CurrencyInput
            label="Amount"
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

      {/* Others */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextArea
          label="Make-up Class Schedule"
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
            <span className="text-sm text-neutral-700">Agree</span>
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

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
