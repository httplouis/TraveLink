"use client";

import * as React from "react";
import type { VehicleMode } from "@/lib/user/request/types";

export default function TravelOrderForm({
  data,
  onChange,
  onChangeCosts,
  errors,
  vehicleMode,
}: {
  data: any;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  errors: Record<string, string>;
  vehicleMode: VehicleMode;
}) {
  const c = data?.costs || {};
  const needsJustif =
    vehicleMode === "rent" ||
    Number(c.rentVehicles || 0) > 0 ||
    Number(c.hiredDrivers || 0) > 0;

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Travel Order</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Destination" error={errors["travelOrder.destination"]}>
          <input
            className="input"
            value={data.destination || ""}
            onChange={(e) => onChange({ destination: e.target.value })}
          />
        </Field>

        <Field label="Departure date" error={errors["travelOrder.departureDate"]}>
          <input
            type="date"
            className="input"
            value={data.departureDate || ""}
            onChange={(e) => onChange({ departureDate: e.target.value })}
          />
        </Field>

        <Field label="Return date" error={errors["travelOrder.returnDate"]}>
          <input
            type="date"
            className="input"
            value={data.returnDate || ""}
            onChange={(e) => onChange({ returnDate: e.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Purpose of travel"
        error={errors["travelOrder.purposeOfTravel"]}
      >
        <textarea
          className="input min-h-[86px]"
          value={data.purposeOfTravel || ""}
          onChange={(e) => onChange({ purposeOfTravel: e.target.value })}
        />
      </Field>

      <div className="mt-4">
        <div className="text-sm font-semibold">Travel Cost (estimate)</div>

        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Money
            label="Food"
            value={c.food}
            onChange={(v) => onChangeCosts({ food: v })}
          />
          <Money
            label="Driver’s allowance"
            value={c.driversAllowance}
            onChange={(v) => onChangeCosts({ driversAllowance: v })}
          />
          <Money
            label="Rent vehicles"
            value={c.rentVehicles}
            onChange={(v) => onChangeCosts({ rentVehicles: v })}
          />
          <Money
            label="Hired drivers"
            value={c.hiredDrivers}
            onChange={(v) => onChangeCosts({ hiredDrivers: v })}
          />
          <Money
            label="Accommodation"
            value={c.accommodation}
            onChange={(v) => onChangeCosts({ accommodation: v })}
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              className="input col-span-2"
              placeholder="Other (label)"
              value={c.otherLabel || ""}
              onChange={(e) =>
                onChangeCosts({ otherLabel: e.target.value })
              }
            />
            <input
              className="input"
              inputMode="decimal"
              placeholder="0.00"
              value={c.otherAmount ?? ""}
              onChange={(e) =>
                onChangeCosts({ otherAmount: asNum(e.target.value) })
              }
            />
          </div>
        </div>

        {needsJustif && (
          <div className="mt-3">
            <Field
              label="Justification"
              error={errors["travelOrder.costs.justification"]}
            >
              <textarea
                className="input min-h-[80px]"
                placeholder="State reasons for renting / hired drivers"
                value={c.justification || ""}
                onChange={(e) =>
                  onChangeCosts({ justification: e.target.value })
                }
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Endorsed by (Dept Head)">
          <input
            className="input"
            value={data.endorsedByHeadName || ""}
            onChange={(e) =>
              onChange({ endorsedByHeadName: e.target.value })
            }
          />
        </Field>

        <Field label="Endorsement date">
          <input
            type="date"
            className="input"
            value={data.endorsedByHeadDate || ""}
            onChange={(e) =>
              onChange({ endorsedByHeadDate: e.target.value })
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

function Money({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-neutral-700">{label}</span>
      <input
        className="input"
        inputMode="decimal"
        placeholder="0.00"
        value={value ?? ""}
        onChange={(e) => onChange(asNum(e.target.value))}
      />
    </label>
  );
}

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
