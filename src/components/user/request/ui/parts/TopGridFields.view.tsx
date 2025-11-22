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
import RequesterInvitationEditor from "@/components/user/request/ui/RequesterInvitationEditor";
import { UI_TEXT } from "@/lib/user/request/uiText";

type Props = {
  data: any;
  errors: Record<string, string>;
  onChange: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
  isHeadRequester?: boolean;
  isRepresentativeSubmission?: boolean; // True if requesting person is different from logged-in user
  requesterRole?: "faculty" | "head"; // Role type to determine if multiple requesters are allowed
  requestId?: string; // Request ID for sending invitations (after saving)
  currentUserEmail?: string; // Current logged-in user's email (for auto-confirm)
  onRequestersStatusChange?: (allConfirmed: boolean) => void; // Callback when all requesters are confirmed
};

export default function TopGridFields({
  data,
  errors,
  onChange,
  onDepartmentChange,
  isHeadRequester,
  isRepresentativeSubmission = false,
  requesterRole,
  requestId,
  currentUserEmail,
  onRequestersStatusChange,
}: Props) {
  // Calculate if signature pad should be shown
  const shouldShowSignaturePad = !isHeadRequester && !isRepresentativeSubmission;
  
  // Ensure requesters is always an array and memoize it to prevent unnecessary re-renders
  const requestersArray = React.useMemo(() => {
    const reqs = Array.isArray(data?.requesters) ? data.requesters : [];
    console.log('[TopGridFields] 🔍 Requesters array memoized:', {
      count: reqs.length,
      requesters: reqs.map((r: any) => ({ id: r.id, name: r.name }))
    });
    return reqs;
  }, [data?.requesters]);
  
  // Stable onChange handler for requesters to prevent unnecessary re-renders
  const handleRequestersChange = React.useCallback((requesters: any[]) => {
    console.log('[TopGridFields] 📝 Requester onChange called:', {
      requestersCount: requesters.length,
      requesters: requesters.map(r => ({ id: r.id, name: r.name, email: r.email }))
    });
    
    // Prepare update object with all changes at once
    const update: any = { requesters };
    
    // Also update requestingPerson to first requester's name (for backward compatibility)
    if (requesters.length > 0 && requesters[0].name) {
      update.requestingPerson = requesters[0].name;
      
      // Auto-fill department: collect all unique departments from all requesters
      const departments = requesters
        .map(req => req.department)
        .filter((dept): dept is string => !!dept && dept.trim() !== "");
      
      // Remove duplicates (case-insensitive)
      const uniqueDepartments = Array.from(
        new Set(departments.map(dept => dept.trim()))
      );
      
      if (uniqueDepartments.length > 0) {
        // If there's only ONE unique department, auto-fill it
        // If there are MULTIPLE departments, DON'T auto-fill - let the head endorsement system handle it
        // The head endorsement system will send invitations to each department's head separately
        if (uniqueDepartments.length === 1) {
          const singleDepartment = uniqueDepartments[0];
          const currentDept = data?.department || "";
          if (!currentDept || currentDept !== singleDepartment) {
            console.log('[TopGridFields] 🔄 Auto-filling department from requesters (single department):', {
              department: singleDepartment,
              currentDepartment: currentDept
            });
            // Update department separately to trigger onDepartmentChange callback
            onDepartmentChange(singleDepartment);
          }
        } else {
          // Multiple departments - don't auto-fill combined string
          // The head endorsement system will handle multi-department scenarios
          console.log('[TopGridFields] ⏭️ Multiple departments detected, skipping auto-fill (head endorsement system will handle):', {
            uniqueDepartments,
            note: 'Head endorsement invitations will be sent to each department\'s head separately'
          });
        }
      }
    }
    
    // Single onChange call with all updates
    console.log('[TopGridFields] ✅ Calling onChange with update:', update);
    onChange(update);
  }, [data?.department, onChange, onDepartmentChange]);
  
  // Debug: Log the values to see what's happening
  React.useEffect(() => {
    console.log('[TopGridFields] 🔍 Signature pad check:');
    console.log('  - isHeadRequester:', isHeadRequester);
    console.log('  - isRepresentativeSubmission:', isRepresentativeSubmission);
    console.log('  - shouldShowSignaturePad:', shouldShowSignaturePad);
    console.log('  - requesters count:', requestersArray.length);
  }, [isRepresentativeSubmission, isHeadRequester, shouldShowSignaturePad, requestersArray.length]);

  return (
    <div className="space-y-6">
      {/* Row 1: Date and Requester */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="flex flex-col h-full">
          <DateInput
            id="to-date"
            label={UI_TEXT.date.label}
            required
            value={data?.date || ""}
            onChange={(e) => onChange({ date: e.target.value })}
            error={errors["travelOrder.date"]}
            helper={UI_TEXT.date.helper}
          />
        </div>

        <div className="flex flex-col h-full">
          {/* Show multiple requester editor if requesterRole is faculty or head */}
          {(requesterRole === "faculty" || requesterRole === "head") ? (
            <RequesterInvitationEditor
              requesters={requestersArray}
              onChange={handleRequestersChange}
              requestId={requestId}
              requesterRole={requesterRole}
              currentUserEmail={currentUserEmail}
              onStatusChange={onRequestersStatusChange}
            />
          ) : (
            <>
              <UserSearchableSelect
                value={data?.requestingPerson || ""}
                onChange={(userName) => onChange({ requestingPerson: userName })}
                placeholder="Type to search user (e.g., name, email)..."
                label={UI_TEXT.requester.label}
                required
                error={errors["travelOrder.requestingPerson"]}
              />
              <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 min-h-[20px]">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Search and select a user. You can edit this if you're filling out the form for someone else</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Department and Destination */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="flex flex-col h-full">
          <DepartmentSelect
            id="to-department"
            label={UI_TEXT.dept.label}
            value={data?.department || ""}
            required
            placeholder={UI_TEXT.dept.placeholder}
            onChange={onDepartmentChange}
          />
          <div className="mt-1 min-h-[20px]">
            {errors["travelOrder.department"] ? (
              <span className="text-xs text-red-600">
                {errors["travelOrder.department"]}
              </span>
            ) : (
              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {requesterRole === "head" || requesterRole === "faculty" 
                    ? "Select the requester's department/office. If multiple requesters have different departments, they will be combined automatically (e.g., 'HRD and WCDEO')."
                    : "Select the requester's department/office"
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col h-full">
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
          <div className="mt-1 min-h-[20px]">
            {errors["travelOrder.destination"] && (
              <span className="text-xs text-red-600">
                {errors["travelOrder.destination"]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Dates */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
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
            onUseSaved={(dataUrl) => onChange({ requesterSignature: dataUrl })}
            showUseSavedButton={true}
            hideSaveButton
          />
        </div>
      )}
    </div>
  );
}
