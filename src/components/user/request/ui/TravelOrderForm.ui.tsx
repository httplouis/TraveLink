// components/user/request/ui/TravelOrderForm.ui.tsx
"use client";

import * as React from "react";
import type { VehicleMode } from "@/lib/user/request/types";
import {
  TextInput,
  DateInput,
  TextArea,
  CurrencyInput,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

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
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Order</h3>
        <span className="text-xs text-neutral-500">
          Required fields marked with *
        </span>
      </div>

      {/* Top grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <DateInput
          id="to-date"
          label="Date"
          required
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          error={errors["travelOrder.date"]}
          helper="Select the date this request is created."
        />

        <TextInput
          id="to-requester"
          label="Requesting person"
          required
          placeholder="Juan Dela Cruz"
          value={data.requestingPerson}
          onChange={(e) => onChange({ requestingPerson: e.target.value })}
          error={errors["travelOrder.requestingPerson"]}
        />

        <TextInput
          id="to-department"
          label="Department"
          required
          placeholder="e.g., CITE, SHS, Accounting"
          value={data.department}
          onChange={(e) => onChange({ department: e.target.value })}
          error={errors["travelOrder.department"]}
        />

        {/* Destination with map picker */}
        <div className="grid gap-1">
          <LocationField
            label="Destination"
            inputId="to-destination"
            value={data.destination || ""}
            geo={data.destinationGeo || null}
            onChange={({ address, geo }) =>
              onChange({
                destination: address,
                destinationGeo: geo ?? null,
              })
            }
            placeholder="City / Venue / School / Company"
          />
          {errors["travelOrder.destination"] && (
            <span className="text-xs text-red-600">
              {errors["travelOrder.destination"]}
            </span>
          )}
        </div>

        <DateInput
          id="to-departure"
          label="Departure date"
          required
          value={data.departureDate}
          onChange={(e) => onChange({ departureDate: e.target.value })}
          error={errors["travelOrder.departureDate"]}
        />

        <DateInput
          id="to-return"
          label="Return date"
          required
          value={data.returnDate}
          onChange={(e) => onChange({ returnDate: e.target.value })}
          error={errors["travelOrder.returnDate"]}
        />
      </div>

      <div className="mt-4">
        <TextArea
          id="to-purpose"
          label="Purpose of travel"
          required
          placeholder="Briefly explain what the trip is for"
          value={data.purposeOfTravel}
          onChange={(e) => onChange({ purposeOfTravel: e.target.value })}
          error={errors["travelOrder.purposeOfTravel"]}
        />
      </div>

      {/* Costs */}
      <div className="mt-6 rounded-xl border border-neutral-200 p-4">
        <div className="mb-3 text-sm font-semibold">Travel Cost (estimate)</div>
        <div className="grid gap-4 md:grid-cols-2">
          <CurrencyInput
            label="Food"
            placeholder="0.00"
            value={c.food ?? ""}
            onChange={(e) => onChangeCosts({ food: asNum(e.target.value) })}
          />
          <CurrencyInput
            label="Driver’s allowance"
            placeholder="0.00"
            value={c.driversAllowance ?? ""}
            onChange={(e) =>
              onChangeCosts({ driversAllowance: asNum(e.target.value) })
            }
          />
          <CurrencyInput
            label="Rent vehicles"
            placeholder="0.00"
            value={c.rentVehicles ?? ""}
            onChange={(e) =>
              onChangeCosts({ rentVehicles: asNum(e.target.value) })
            }
          />
          <CurrencyInput
            label="Hired drivers"
            placeholder="0.00"
            value={c.hiredDrivers ?? ""}
            onChange={(e) =>
              onChangeCosts({ hiredDrivers: asNum(e.target.value) })
            }
          />
          <CurrencyInput
            label="Accommodation"
            placeholder="0.00"
            value={c.accommodation ?? ""}
            onChange={(e) =>
              onChangeCosts({ accommodation: asNum(e.target.value) })
            }
          />

          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <TextInput
              label="Other (label)"
              placeholder="e.g., Materials, Printing"
              value={c.otherLabel ?? ""}
              onChange={(e) => onChangeCosts({ otherLabel: e.target.value })}
            />
            <CurrencyInput
              label="Amount"
              placeholder="0.00"
              value={c.otherAmount ?? ""}
              onChange={(e) =>
                onChangeCosts({ otherAmount: asNum(e.target.value) })
              }
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        {needsJustif && (
          <div className="mt-4">
            <TextArea
              id="to-justification"
              label="Justification"
              required
              placeholder="State reasons for renting or hiring a driver"
              value={c.justification ?? ""}
              onChange={(e) => onChangeCosts({ justification: e.target.value })}
              error={errors["travelOrder.costs.justification"]}
            />
          </div>
        )}
      </div>

      {/* Endorsement */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <TextInput
          label="Endorsed by (Dept Head)"
          placeholder="Name of Department Head"
          value={data.endorsedByHeadName ?? ""}
          onChange={(e) => onChange({ endorsedByHeadName: e.target.value })}
        />
        <DateInput
          label="Endorsement date"
          value={data.endorsedByHeadDate ?? ""}
          onChange={(e) => onChange({ endorsedByHeadDate: e.target.value })}
        />
      </div>
    </section>
  );
}
