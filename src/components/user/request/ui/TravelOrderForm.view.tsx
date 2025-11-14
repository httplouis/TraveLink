// src/components/user/request/ui/TravelOrderForm.view.tsx
"use client";

import * as React from "react";
import TopGridFields from "./parts/TopGridFields.view";
import CostsSection from "./parts/CostsSection.view";
import EndorsementSection from "./parts/EndorsementSection.view";
import { UI_TEXT } from "@/lib/user/request/uiText";

type ViewProps = {
  data: any;
  errors: Record<string, string>;
  needsJustif: boolean;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;
  setHeadEdited: () => void;
  footerRight?: React.ReactNode;

  // extra props
  isHeadRequester?: boolean;
  isRepresentativeSubmission?: boolean;
  requestingPersonHeadName?: string; // Head name for requesting person's department
  currentUserName?: string;
};

export default function TravelOrderFormView({
  data,
  errors,
  needsJustif,
  onChange,
  onChangeCosts,
  onDepartmentChange,
  setHeadEdited,
  footerRight,
  isHeadRequester,
  isRepresentativeSubmission,
  requestingPersonHeadName,
  currentUserName,
}: ViewProps) {
  const c = data?.costs || {};

  // Debug: Log props
  React.useEffect(() => {
    console.log('[TravelOrderFormView] Props received:');
    console.log('  - isRepresentativeSubmission:', isRepresentativeSubmission);
    console.log('  - isHeadRequester:', isHeadRequester);
  }, [isRepresentativeSubmission, isHeadRequester]);

  return (
    <section className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-7 shadow-xl">
      <div className="mb-7 flex items-center justify-between border-b-2 border-gray-200 pb-5">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{UI_TEXT.title}</h3>
          <p className="mt-2 text-sm text-gray-600">Complete all required fields to submit your travel request</p>
        </div>
        <div className="rounded-lg border border-[#7A0010]/20 bg-gradient-to-br from-[#7A0010]/5 to-[#7A0010]/10 px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-[#7A0010]">{UI_TEXT.requiredHint}</span>
        </div>
      </div>

      {/* Top half: date, requester, dept, destination, purpose */}
      <TopGridFields
        data={data}
        errors={errors}
        onChange={onChange}
        onDepartmentChange={onDepartmentChange}
        isHeadRequester={isHeadRequester}
        isRepresentativeSubmission={isRepresentativeSubmission}
      />

      <CostsSection
        costs={c}
        needsJustif={needsJustif}
        errors={errors}
        onChangeCosts={onChangeCosts}
      />

      {/* Head details + (optionally) signature kapag head mismo nagrerequest */}
      <EndorsementSection
        nameValue={isRepresentativeSubmission && requestingPersonHeadName 
          ? requestingPersonHeadName 
          : (data?.endorsedByHeadName ?? "")}
        dateValue={data?.endorsedByHeadDate ?? ""}
        onNameChange={(v) => {
          setHeadEdited();
          onChange({ endorsedByHeadName: v });
        }}
        onDateChange={(v) => onChange({ endorsedByHeadDate: v })}
        isHeadRequester={isHeadRequester}
        currentUserName={currentUserName}
        // kung may na-upload na e-signature ng head (head requester case)
        signature={data?.endorsedByHeadSignature ?? null}
        onSignatureChange={(dataUrl) => {
          onChange({ endorsedByHeadSignature: dataUrl });
        }}
      />

      <div className="mt-5 flex items-center justify-end gap-2">{footerRight}</div>
    </section>
  );
}
