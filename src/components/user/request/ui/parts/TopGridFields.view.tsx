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
import UserSearchableSelect from "@/components/user/request/ui/UserSearchableSelect";
import { UI_TEXT } from "@/lib/user/request/uiText";

type Props = {
  data: any;
  errors: Record<string, string>;
  onChange: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
  isHeadRequester?: boolean;
  isRepresentativeSubmission?: boolean; // True if requesting person is different from logged-in user
};

export default function TopGridFields({
  data,
  errors,
  onChange,
  onDepartmentChange,
  isHeadRequester,
  isRepresentativeSubmission = false,
}: Props) {
  // Calculate if signature pad should be shown
  const shouldShowSignaturePad = !isHeadRequester && !isRepresentativeSubmission;
  
  // Debug: Log the values to see what's happening
  React.useEffect(() => {
    console.log('[TopGridFields] 🔍 Signature pad check:');
    console.log('  - isHeadRequester:', isHeadRequester);
    console.log('  - isRepresentativeSubmission:', isRepresentativeSubmission);
    console.log('  - shouldShowSignaturePad:', shouldShowSignaturePad);
  }, [isRepresentativeSubmission, isHeadRequester, shouldShowSignaturePad]);

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
          <UserSearchableSelect
            value={data?.requestingPerson || ""}
            onChange={(userName) => onChange({ requestingPerson: userName })}
            placeholder="Type to search user (e.g., name, email)..."
            label={UI_TEXT.requester.label}
            required
            error={errors["travelOrder.requestingPerson"]}
          />
          <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>Search and select a user. You can edit this if you're filling out the form for someone else</span>
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

      {/* Row 5: Requesting person's signature - 
          HIDE if: 
          1. Head is requester (only need one signature), OR
          2. Representative submission (requesting person needs to sign first) */}
      {shouldShowSignaturePad && (
        <div 
          id="to-signature"
          data-error={errors["travelOrder.requesterSignature"] ? "true" : undefined}
          className={`rounded-xl border-2 p-5 shadow-sm transition-all ${
            errors["travelOrder.requesterSignature"] 
              ? "border-red-300 bg-gradient-to-br from-red-50 to-red-100/50" 
              : "border-gray-200 bg-gradient-to-br from-gray-50 to-white"
          }`}
        >
          <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
            <div>
              <span className="text-sm font-bold text-gray-900">
                {UI_TEXT.requesterSignature?.title ?? "Requesting person's signature"} <span className="text-red-500">*</span>
              </span>
              <p className="mt-1 text-xs text-gray-500">
                Sign with mouse / touch - or upload your pre-saved signature image file
              </p>
            </div>
            {errors["travelOrder.requesterSignature"] && (
              <span className="rounded-lg border-2 border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
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
