// components/user/request/ui/SchoolServiceSection.ui.tsx
"use client";

import * as React from "react";
import { TextInput, DateInput } from "@/components/user/request/ui/controls";

export default function SchoolServiceSection({
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
        <h3 className="text-lg font-semibold">School Service Request</h3>
        <span className="text-xs text-neutral-500">Required fields marked with *</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          id="ss-driver"
          label="Driver"
          required
          placeholder="Assigned driver’s full name"
          value={data?.driver ?? ""}
          onChange={(e) => onChange({ driver: e.target.value })}
          error={errors["schoolService.driver"]}
        />

        <TextInput
          id="ss-vehicle"
          label="Vehicle"
          required
          placeholder="e.g., L300 Van • ABC-1234"
          value={data?.vehicle ?? ""}
          onChange={(e) => onChange({ vehicle: e.target.value })}
          error={errors["schoolService.vehicle"]}
        />

        {/* Dispatcher sign-off */}
        <label className="col-span-full flex items-start gap-3 rounded-xl border border-neutral-200 p-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={!!data?.vehicleDispatcherSigned}
            onChange={(e) => onChange({ vehicleDispatcherSigned: e.target.checked })}
          />
          <div className="grid">
            <span className="text-sm font-medium text-neutral-800">
              Vehicle Dispatcher signature (Trizzia Maree Z. Casino)
            </span>
            <span className="text-xs text-neutral-500">
              Check this once the dispatcher has reviewed and signed.
            </span>
          </div>
        </label>

        <DateInput
          id="ss-dispatcher-date"
          label="Dispatcher date"
          required
          value={data?.vehicleDispatcherDate ?? ""}
          onChange={(e) => onChange({ vehicleDispatcherDate: e.target.value })}
          error={errors["schoolService.vehicleDispatcherDate"]}
          helper="Date when the dispatcher signed."
        />
      </div>
    </section>
  );
}
