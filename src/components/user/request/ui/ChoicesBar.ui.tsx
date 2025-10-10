// components/user/request/ui/ChoicesBar.ui.tsx
"use client";

import * as React from "react";
import type { Reason, VehicleMode, RequesterRole } from "@/lib/user/request/types";

const REASONS: { label: string; value: Reason }[] = [
  { label: "Seminar / Meeting", value: "seminar" },
  { label: "Educational Trip", value: "educational" },
  { label: "Competition", value: "competition" },
  { label: "Visit", value: "visit" },
];

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

export default function ChoicesBar({
  value,
  lockedVehicle,
  onReason,
  onVehicle,
  onRequester,
}: {
  value: { reason: Reason; vehicleMode: VehicleMode; requesterRole: RequesterRole };
  lockedVehicle: VehicleMode | null;
  onReason: (r: Reason) => void;
  onVehicle: (v: VehicleMode) => void;
  onRequester: (r: RequesterRole) => void;
}) {
  const vehicleOptions = React.useMemo(
    () =>
      VEHICLES.map((o) => ({
        ...o,
        disabled: lockedVehicle ? o.value !== lockedVehicle : false,
      })),
    [lockedVehicle]
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <PrettyRadioGroup
          label="Reason of trip"
          value={value.reason}
          options={REASONS}
          onChange={onReason}
        />

        <PrettyRadioGroup
          label="Vehicle"
          value={value.vehicleMode}
          options={vehicleOptions}
          onChange={onVehicle}
          helper={
            lockedVehicle
              ? `Vehicle is locked to “${labelForValue(vehicleOptions, lockedVehicle)}” based on your reason.`
              : undefined
          }
        />

        <PrettyRadioGroup
          label="Requester"
          value={value.requesterRole}
          options={ROLES}
          onChange={onRequester}
        />
      </div>
    </section>
  );
}

function labelForValue<T extends string>(
  opts: { label: string; value: T }[],
  v: T
) {
  return opts.find((o) => o.value === v)?.label ?? v;
}

/**
 * Button-like radio group with full keyboard & screen reader support.
 * - Arrow keys move selection
 * - Space/Enter select
 * - Clear selected styling
 */
function PrettyRadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: T;
  options: { label: string; value: T; disabled?: boolean }[];
  onChange: (v: T) => void;
  helper?: string;
}) {
  const groupId = React.useId();

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const enabled = options.filter((o) => !o.disabled);
    const idx = enabled.findIndex((o) => o.value === value);
    if (idx < 0) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = enabled[(idx + 1) % enabled.length];
      onChange(next.value);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = enabled[(idx - 1 + enabled.length) % enabled.length];
      onChange(prev.value);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {helper && <span className="text-xs text-neutral-500">{helper}</span>}
      </div>

      <div
        role="radiogroup"
        aria-labelledby={groupId}
        className="flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        <span id={groupId} className="sr-only">
          {label}
        </span>

        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!!opt.disabled}
              onClick={() => !opt.disabled && onChange(opt.value)}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
                opt.disabled
                  ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
                  : selected
                  ? "border-[#7A0010] bg-[#7A0010]/5 text-[#7A0010]"
                  : "border-neutral-300 text-neutral-800 hover:bg-neutral-50",
              ].join(" ")}
            >
              {/* visual dot */}
              <span
                className={[
                  "grid h-4 w-4 place-items-center rounded-full border",
                  selected ? "border-[#7A0010]" : "border-neutral-400",
                ].join(" ")}
                aria-hidden="true"
              >
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    selected ? "bg-[#7A0010]" : "bg-transparent",
                  ].join(" ")}
                />
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
