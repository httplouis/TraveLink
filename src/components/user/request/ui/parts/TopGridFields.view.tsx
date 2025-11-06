"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  TextInput,
  DateInput,
  TextArea,
} from "@/components/user/request/ui/controls";
import LocationField from "@/components/user/request/ui/LocationField.ui";
import DepartmentSelect from "@/components/common/inputs/DepartmentSelect.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { UI_TEXT } from "@/lib/user/request/uiText";

type Props = {
  data: any;
  errors: Record<string, string>;
  onChange: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
  isHeadRequester?: boolean;
};

export default function TopGridFields({
  data,
  errors,
  onChange,
  onDepartmentChange,
  isHeadRequester,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Row 1: Date and Requester */}
      <div className="grid gap-6 md:grid-cols-2">
        <DateInput
          id="to-date"
          label={UI_TEXT.date.label}
          required
          value={data?.date || ""}
          onChange={(e) => onChange({ date: e.target.value })}
          error={errors["travelOrder.date"]}
          helper={UI_TEXT.date.helper}
        />

        <div>
          <TextInput
            id="to-requester"
            label={UI_TEXT.requester.label}
            required
            placeholder={UI_TEXT.requester.placeholder}
            value={data?.requestingPerson || ""}
            onChange={(e) => onChange({ requestingPerson: e.target.value })}
            error={errors["travelOrder.requestingPerson"]}
          />
          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>You can edit this if you're filling out the form for someone else</span>
          </div>
        </div>
      </div>

      {/* Row 2: Department and Destination */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <DepartmentSelect
            id="to-department"
            label={UI_TEXT.dept.label}
            value={data?.department || ""}
            required
            placeholder={UI_TEXT.dept.placeholder}
            onChange={onDepartmentChange}
          />
          {errors["travelOrder.department"] ? (
            <span className="text-xs text-red-600">
              {errors["travelOrder.department"]}
            </span>
          ) : (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Select the requester's department/office</span>
            </div>
          )}
        </div>

        <div>
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
            <span className="text-xs text-red-600 mt-1">
              {errors["travelOrder.destination"]}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: Dates */}
      <div className="grid gap-6 md:grid-cols-2">
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

      {/* Row 4: Purpose (full width) */}
      <TextArea
        id="to-purpose"
        label={UI_TEXT.purpose.label}
        required
        rows={4}
        placeholder={UI_TEXT.purpose.placeholder}
        value={data?.purposeOfTravel ?? ""}
        onChange={(e) => onChange({ purposeOfTravel: e.target.value })}
        error={errors["travelOrder.purposeOfTravel"]}
      />

      {/* Row 5: Requesting person's signature - HIDE if head is requester (only need one signature) */}
      {!isHeadRequester && (
        <div className={`rounded-xl border p-4 ${errors["travelOrder.requesterSignature"] ? "border-red-300 bg-red-50/30" : "border-neutral-200 bg-neutral-50/60"}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {UI_TEXT.requesterSignature?.title ?? "Requesting person's signature"} <span className="text-red-500">*</span>
            </span>
            {errors["travelOrder.requesterSignature"] && (
              <span className="text-xs font-semibold text-red-600">
                {errors["travelOrder.requesterSignature"]}
              </span>
            )}
          </div>
          <SignaturePad
            height={160}
            value={data?.requesterSignature || null}
            onSave={(dataUrl) => onChange({ requesterSignature: dataUrl })}
            onClear={() => onChange({ requesterSignature: "" })}
            hideSaveButton
          />
        </div>
      )}
    </div>
  );
}
