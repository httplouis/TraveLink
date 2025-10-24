// src/components/admin/requests/forms/TravelOrderForm.ui.tsx
"use client";

import * as React from "react";
import { Calendar, MapPin } from "lucide-react";
import { useAdminRequestForm } from "@/components/admin/requests/hooks/useAdminRequestForm";

type Props = { onClose?: () => void };

export default function TravelOrderFormAdmin({ onClose }: Props) {
  const f = useAdminRequestForm();

  // Handle numeric cost fields locally (since the hook doesn't expose onNumber)
  const onCostChange =
    (k: keyof typeof f.values.costs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const num = raw === "" ? 0 : Number(raw);
      f.setValues((prev) => ({
        ...prev,
        costs: { ...prev.costs, [k]: isNaN(num) ? 0 : num },
      }));
    };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        f.onSubmit();
        onClose?.();
      }}
    >
      {/* Top chips (Reason / Vehicle / Requester) */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-neutral-500">
              Reason of trip
            </legend>
            <div className="grid gap-2">
              {[
                "Official business",
                "CES",
                "Seminar / Training",
                "Educational Trip",
                "Competition",
                "Visit",
              ].map((r) => (
                <label
                  key={r}
                  className={`inline-flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    f.values.reason === r
                      ? "border-[#7A0010] text-[#7A0010]"
                      : "border-neutral-200"
                  }`}
                >
                  <span>{r}</span>
                  <input
                    type="radio"
                    name="reason"
                    className="sr-only"
                    checked={f.values.reason === r}
                    onChange={() => f.set("reason", r)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-neutral-500">
              Vehicle
            </legend>
            <div className="grid gap-2">
              {[
                { label: "Institutional vehicle", v: "Institutional" },
                { label: "Owned vehicle", v: "Owned" },
                { label: "Rent (external)", v: "Rent" },
              ].map(({ label, v }) => (
                <label
                  key={v}
                  className={`inline-flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    f.values.vehicle === v
                      ? "border-[#7A0010] text-[#7A0010]"
                      : "border-neutral-200"
                  }`}
                >
                  <span>{label}</span>
                  <input
                    type="radio"
                    name="vehicle"
                    className="sr-only"
                    checked={f.values.vehicle === v}
                    onChange={() => f.set("vehicle", v as any)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-neutral-500">
              Requester
            </legend>
            <div className="grid gap-2">
              {["Faculty", "Head", "Org"].map((r) => (
                <label
                  key={r}
                  className={`inline-flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    f.values.requesterType === r
                      ? "border-[#7A0010] text-[#7A0010]"
                      : "border-neutral-200"
                  }`}
                >
                  <span>{r}</span>
                  <input
                    type="radio"
                    name="requesterType"
                    className="sr-only"
                    checked={f.values.requesterType === r}
                    onChange={() => f.set("requesterType", r as any)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Travel order core fields */}
      <section className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold">Travel Order</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Date <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 pr-9"
                value={f.values.date}
                onChange={f.onChange("date")}
              />
              <Calendar className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Department <span className="text-rose-600">*</span>
            </label>
            <input
              placeholder="e.g., CBA, CCMS, ICT Department"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3"
              value={f.values.department}
              onChange={f.onChange("department")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Destination</label>
            <div className="relative">
              <input
                placeholder="City / Venue / School / Company"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3 pr-9"
                value={f.values.destination}
                onChange={f.onChange("destination")}
              />
              <MapPin className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Departure date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                value={f.values.date}
                onChange={f.onChange("date")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Return date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                className="h-10 w-full rounded-lg border border-neutral-300 px-3"
                value={f.values.returnDate}
                onChange={f.onChange("returnDate")}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Purpose of travel <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Briefly explain what the trip is for"
              value={f.values.purpose}
              onChange={f.onChange("purpose")}
            />
          </div>
        </div>
      </section>

      {/* Costs (estimate) */}
      <section className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold">Travel Cost (estimate)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { key: "food", label: "Food" },
            { key: "driversAllowance", label: "Driver’s allowance" },
            { key: "rent", label: "Rent vehicles" },
            { key: "hiredDrivers", label: "Hired drivers" },
            { key: "accommodation", label: "Accommodation" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-10 w-full rounded-lg border border-neutral-300 pl-6 pr-3"
                  onChange={onCostChange(key as keyof typeof f.values.costs)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Endorsement */}
      <section className="rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-base font-semibold">Endorsed by (Dept Head)</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Name of Department Head"
            className="h-10 w-full rounded-lg border border-neutral-300 px-3"
            value={f.values.endorserName || ""}
            onChange={f.onChange("endorserName")}
          />
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-neutral-300 px-3"
            value={f.values.endorsementDate || ""}
            onChange={f.onChange("endorsementDate")}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => f.onSaveDraft()}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Save draft
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#7A0010] px-3 py-2 text-sm font-semibold text-white"
          >
            Submit
          </button>
          <span className="text-xs text-neutral-500">Review the highlighted fields.</span>
        </div>
      </section>
    </form>
  );
}
