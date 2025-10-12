// src/components/user/request/ui/TravelOrderForm.ui.tsx
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

// Searchable department input
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
// Department → head mapping helper
import { getDepartmentHead } from "@/lib/org/departments";
// Shared signature pad
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

function asNum(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  data: any;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  errors: Record<string, string>;
  vehicleMode: VehicleMode;
};

export default function TravelOrderForm({
  data,
  onChange,
  onChangeCosts,
  errors,
  vehicleMode,
}: Props) {
  const c = data?.costs || {};
  const needsJustif =
    vehicleMode === "rent" ||
    Number(c.rentVehicles || 0) > 0 ||
    Number(c.hiredDrivers || 0) > 0;

  // If user types a head name manually, don’t auto-overwrite next time
  const headEditedRef = React.useRef(false);

  // --- Signature state (UI helpers only; persisted to parent via onChange) ---
  const [sigDirty, setSigDirty] = React.useState(false);
  const [sigSaved, setSigSaved] = React.useState<boolean>(!!data?.signatureSaved);
  const [sigSavedAt, setSigSavedAt] = React.useState<string | null>(
    data?.signatureSaved ? new Date().toLocaleString() : null
  );

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Order</h3>
        <span className="text-xs text-neutral-500">Required fields marked with *</span>
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

        {/* Department / Office (searchable) */}
        <div className="grid gap-1">
          <DepartmentSelect
            id="to-department"
            label="Department *"
            value={data.department || ""}
            required
            placeholder="e.g., CBA, CCMS, ICT Department"
            onChange={(nextDept) => {
              const patch: any = { department: nextDept };

              // Auto-fill head if not manually edited yet or empty
              const currentHead = data?.endorsedByHeadName ?? "";
              if (!headEditedRef.current || !currentHead) {
                patch.endorsedByHeadName = getDepartmentHead(nextDept);
              }

              onChange(patch);
            }}
          />
          {errors["travelOrder.department"] && (
            <span className="text-xs text-red-600">{errors["travelOrder.department"]}</span>
          )}
        </div>

        {/* Destination with map picker */}
        <div className="grid gap-1">
          <LocationField
            label="Destination"
            inputId="to-destination"
            value={data?.destination || ""}
            geo={data?.destinationGeo || null}
            onChange={({ address, geo }) =>
              onChange({ destination: address, destinationGeo: geo ?? undefined })
            }
            placeholder="City / Venue / School / Company"
          />
          {errors["travelOrder.destination"] && (
            <span className="text-xs text-red-600">{errors["travelOrder.destination"]}</span>
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
            onChange={(e) => onChangeCosts({ driversAllowance: asNum(e.target.value) })}
          />
          <CurrencyInput
            label="Rent vehicles"
            placeholder="0.00"
            value={c.rentVehicles ?? ""}
            onChange={(e) => onChangeCosts({ rentVehicles: asNum(e.target.value) })}
          />
          <CurrencyInput
            label="Hired drivers"
            placeholder="0.00"
            value={c.hiredDrivers ?? ""}
            onChange={(e) => onChangeCosts({ hiredDrivers: asNum(e.target.value) })}
          />
          <CurrencyInput
            label="Accommodation"
            placeholder="0.00"
            value={c.accommodation ?? ""}
            onChange={(e) => onChangeCosts({ accommodation: asNum(e.target.value) })}
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
              onChange={(e) => onChangeCosts({ otherAmount: asNum(e.target.value) })}
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
          onChange={(e) => {
            // mark as manually edited so future dept changes won't overwrite
            headEditedRef.current = true;
            onChange({ endorsedByHeadName: e.target.value });
          }}
        />
        <DateInput
          label="Endorsement date"
          value={data.endorsedByHeadDate ?? ""}
          onChange={(e) => onChange({ endorsedByHeadDate: e.target.value })}
        />
      </div>

      {/* Signature block */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">Endorser signature</span>

          {sigSaved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              ✓ Saved{sigSavedAt ? <span className="text-green-700/80"> · {sigSavedAt}</span> : null}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">Not saved</span>
          )}
        </div>

        <SignaturePad
          height={200}
          value={data?.signatureDataUrl || null}
          onDraw={() => setSigDirty(true)}
          onSave={(dataUrl) => {
            onChange({ signatureDataUrl: dataUrl, signatureSaved: true });
            setSigSaved(true);
            setSigDirty(false);
            setSigSavedAt(new Date().toLocaleString());
          }}
          onClear={() => {
            onChange({ signatureDataUrl: "", signatureSaved: false });
            setSigDirty(false);
            setSigSaved(false);
            setSigSavedAt(null);
          }}
          onUpload={async (file) => {
            const buf = await file.arrayBuffer();
            const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            const dataUrl = `data:${file.type};base64,${b64}`;
            onChange({ signatureDataUrl: dataUrl, signatureSaved: true });
            setSigSaved(true);
            setSigDirty(false);
            setSigSavedAt(new Date().toLocaleString());
          }}
          saveDisabled={!sigDirty}
        />

        
      </div>
    </section>
  );
}
