"use client";

import * as React from "react";
import {
  type Reason,
  type VehicleMode,
  type RequesterRole,
  REASON_OPTIONS,
} from "@/lib/user/request/types";

const VEHICLES: { label: string; value: VehicleMode }[] = [
  { label: "Institutional vehicle", value: "institutional" },
  { label: "Owned vehicle", value: "owned" },
  { label: "Rent (external)", value: "rent" },
];

const ROLES: { label: string; value: RequesterRole }[] = [
  { label: "Faculty", value: "faculty" },
  { label: "Head", value: "head" },
  { label: "Org", value: "org" },
];

type Props = {
  value: { reason: Reason; vehicleMode: VehicleMode; requesterRole: RequesterRole };
  lockedVehicle: VehicleMode | null;
  onReason: (r: Reason) => void;
  onVehicle: (v: VehicleMode) => void;
  onRequester: (r: RequesterRole) => void;
};

export default function ChoicesBar({
  value,
  lockedVehicle,
  onReason,
  onVehicle,
  onRequester,
}: Props) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="grid gap-6 md:grid-cols-3">
        <ChoiceGroup<Reason>
          label="Reason of trip"
          value={value.reason}
          options={REASON_OPTIONS}
          columns={1}
          onChange={onReason}
        />

        <ChoiceGroup<VehicleMode>
          label="Vehicle"
          value={value.vehicleMode}
          options={VEHICLES.map((o) => ({
            ...o,
            disabled: lockedVehicle ? o.value !== lockedVehicle : false,
            title: lockedVehicle && o.value !== lockedVehicle ? "Locked by reason of trip" : "",
          }))}
          columns={1}
          onChange={onVehicle}
        />

        <ChoiceGroup<RequesterRole>
          label="Requester"
          value={value.requesterRole}
          options={ROLES}
          columns={1}
          onChange={onRequester}
        />
      </div>

      {lockedVehicle && (
        <p className="mt-2 text-xs text-neutral-500">
          Vehicle locked to <b className="text-[#7A0010]">{lockedVehicle}</b> based on reason.
        </p>
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
      <legend className="mb-2 text-sm font-medium text-neutral-700">{label}</legend>

      <div
        className={[
          "grid gap-2",
          columns === 1 ? "grid-cols-1" : "",
          columns === 2 ? "grid-cols-2" : "",
          columns === 3 ? "grid-cols-3" : "",
        ].join(" ")}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          const base =
            "inline-flex items-center justify-start gap-2 rounded-xl border px-3 py-2 text-sm transition";
          const state = selected
            ? "border-[#7A0010] bg-[#7A0010]/5 text-[#7A0010] ring-1 ring-[#7A0010]/20"
            : "border-neutral-300 hover:bg-neutral-50";
          const disabledCls = opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

          return (
            <label key={String(opt.value)} className={`${base} ${state} ${disabledCls}`} title={opt.title}>
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                checked={selected}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                aria-checked={selected}
              />
              <span
                aria-hidden
                className={[
                  "grid h-4 w-4 place-items-center rounded-full border",
                  selected ? "border-[#7A0010]" : "border-neutral-400",
                ].join(" ")}
              >
                <span className={["h-2.5 w-2.5 rounded-full", selected ? "bg-[#7A0010]" : "bg-transparent"].join(" ")} />
              </span>
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
