// src/components/user/request/parts/TopGridFields.ui.tsx
"use client";

import * as React from "react";
import { TextInput, DateInput } from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { UI_TEXT } from "@/lib/user/request/uiText";

type Props = {
  data: any;
  errors: Record<string, string>;
  onChange: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
};

export default function TopGridFields({
  data,
  errors,
  onChange,
  onDepartmentChange,
}: Props) {
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // Format badge time
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DateInput
        id="to-date"
        label={UI_TEXT.date.label}
        required
        value={data?.date || ""}
        onChange={(e) => onChange({ date: e.target.value })}
        error={errors["travelOrder.date"]}
        helper={UI_TEXT.date.helper}
      />

      <div className="flex flex-col">
        <TextInput
          id="to-requester"
          label={UI_TEXT.requester.label}
          required
          placeholder={UI_TEXT.requester.placeholder}
          value={data?.requestingPerson || ""}
          onChange={(e) => onChange({ requestingPerson: e.target.value })}
          error={errors["travelOrder.requestingPerson"]}
          helper=""
        />

        {/* Requester signature label row with right-aligned badge */}
        <div className="mt-3 mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700">
            Requesting person’s signature
          </label>
          {savedAt && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.07a1 1 0 01-1.415 0L3.293 9.95a1 1 0 111.414-1.414l3.1 3.1 6.364-6.343a1 1 0 011.536 0z"
                  clipRule="evenodd"
                />
              </svg>
              Saved · {savedAt}
            </span>
          )}
        </div>

        <SignaturePad
          height={180}
          value={data?.requestingPersonSignature || null}
          hideSaveButton
          saveDisabled
          onSave={(url) => {
            onChange({ requestingPersonSignature: url });
            setSavedAt(fmt(new Date()));
          }}
          onClear={() => {
            onChange({ requestingPersonSignature: null });
            setSavedAt(null);
          }}
          className="md:col-span-2"
        />
      </div>

      <div className="grid gap-1">
        <DepartmentSelect
          id="to-department"
          label={UI_TEXT.dept.label}
          value={data?.department || ""}
          required
          placeholder={UI_TEXT.dept.placeholder}
          onChange={onDepartmentChange}
        />
        {errors["travelOrder.department"] && (
          <span className="text-xs text-red-600">
            {errors["travelOrder.department"]}
          </span>
        )}
      </div>

      <div className="grid gap-1">
        <LocationField
          label={UI_TEXT.destination.label}
          inputId="to-destination"
          value={data?.destination || ""}
          geo={data?.destinationGeo || null}
          onChange={({ address, geo }) =>
            onChange({ destination: address, destinationGeo: geo ?? undefined })
          }
          placeholder={UI_TEXT.destination.placeholder}
        />
        {errors["travelOrder.destination"] && (
          <span className="text-xs text-red-600">
            {errors["travelOrder.destination"]}
          </span>
        )}
      </div>

      <DateInput
        id="to-departure"
        label={UI_TEXT.departure.label}
        required
        value={data?.departureDate || ""}
        onChange={(e) => onChange({ departureDate: e.target.value })}
        error={errors["travelOrder.departureDate"]}
      />

      <DateInput
        id="to-return"
        label={UI_TEXT.return.label}
        required
        value={data?.returnDate || ""}
        onChange={(e) => onChange({ returnDate: e.target.value })}
        error={errors["travelOrder.returnDate"]}
      />
    </div>
  );
}
