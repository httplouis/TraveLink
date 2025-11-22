"use client";

import * as React from "react";
import {
  type Reason,
  type VehicleMode,
  REASON_OPTIONS,
} from "@/lib/user/request/types";
import { CheckCircle2, Lock } from "lucide-react";

const REQUEST_TYPES: { label: string; value: Reason }[] = [
  { label: "Travel Order", value: "official" }, // Default to "official" for travel orders
  { label: "Seminar Application", value: "seminar" },
];

const VEHICLES: { label: string; value: VehicleMode }[] = [
  { label: "Institutional vehicle", value: "institutional" },
  { label: "Owned vehicle", value: "owned" },
  { label: "Rent (external)", value: "rent" },
];

type Props = {
  value: { reason: Reason; vehicleMode: VehicleMode; requesterRole: "faculty" | "head" };
  lockedVehicle: VehicleMode | null;
  onReason: (r: Reason) => void;
  onVehicle: (v: VehicleMode) => void;
  onRequester?: (r: "faculty" | "head") => void; // Optional since it's auto-detected
  autoDetectedRole?: "faculty" | "head" | null; // Auto-detected role from current user
};

export default function ChoicesBar({
  value,
  lockedVehicle,
  onReason,
  onVehicle,
  onRequester,
  autoDetectedRole,
}: Props) {
  // Map reason to request type for display
  const requestTypeValue: Reason = value.reason === "seminar" ? "seminar" : "official";
  
  return (
    <section className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-lg">
      <div className="mb-4 border-b border-gray-200 pb-3">
        <h3 className="text-lg font-bold text-gray-900">Request Configuration</h3>
        <p className="mt-1 text-xs text-gray-600">Select your request type and vehicle preference</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ChoiceGroup<Reason>
          label="Request Type"
          value={requestTypeValue}
          options={REQUEST_TYPES}
          columns={1}
          onChange={(newType) => {
            // When switching to seminar, set reason to "seminar"
            // When switching to travel order, set to "official" (default)
            onReason(newType);
          }}
        />

        <ChoiceGroup<VehicleMode>
          label="Vehicle"
          value={value.vehicleMode}
          options={VEHICLES.map((o) => ({
            ...o,
            disabled: lockedVehicle ? o.value !== lockedVehicle : false,
            title: lockedVehicle && o.value !== lockedVehicle ? "Locked by request type" : "",
          }))}
          columns={1}
          onChange={onVehicle}
        />
      </div>
      
      {/* Show auto-detected role (read-only) */}
      {autoDetectedRole && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Requester role:</span> {autoDetectedRole === "head" ? "Head" : "Faculty"} (auto-detected from your account)
          </p>
        </div>
      )}

      {lockedVehicle && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
          <Lock className="h-4 w-4 text-amber-600" />
          <p className="text-xs text-amber-800">
            Vehicle locked to <span className="font-semibold">{lockedVehicle}</span> based on reason of trip.
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------- Generic segmented radio group ---------- */

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 1,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ label: string; value: T; disabled?: boolean; title?: string }>;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const groupName = React.useId();

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-semibold text-gray-800">{label}</legend>

      <div
        className={[
          "grid gap-2.5",
          columns === 1 ? "grid-cols-1" : "",
          columns === 2 ? "grid-cols-2" : "",
          columns === 3 ? "grid-cols-3" : "",
        ].join(" ")}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          const disabled = opt.disabled;

          return (
            <label
              key={String(opt.value)}
              className={`
                group relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all
                ${selected
                  ? "border-[#7A0010] bg-gradient-to-br from-[#7A0010]/5 to-[#7A0010]/10 shadow-md ring-2 ring-[#7A0010]/20"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
                }
                ${disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
                }
              `}
              title={opt.title}
            >
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                checked={selected}
                disabled={disabled}
                onChange={() => !disabled && onChange(opt.value)}
                aria-checked={selected}
              />
              
              {/* Custom Radio Indicator */}
              <div
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
                  ${selected
                    ? "border-[#7A0010] bg-[#7A0010]"
                    : "border-gray-300 bg-white group-hover:border-gray-400"
                  }
                  ${disabled ? "opacity-50" : ""}
                `}
              >
                {selected && (
                  <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
                )}
              </div>

              {/* Label Text */}
              <span
                className={`
                  flex-1 truncate
                  ${selected ? "text-[#7A0010]" : "text-gray-700"}
                  ${disabled ? "opacity-50" : ""}
                `}
              >
                {opt.label}
              </span>

              {/* Selected Indicator Badge */}
              {selected && (
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7A0010] opacity-60" />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
