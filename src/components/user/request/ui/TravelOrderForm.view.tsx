"use client";

import * as React from "react";
import TopGridFields from "./parts/TopGridFields.view";
// ⛔️ Removed the old PurposeField import to avoid duplicate purpose UI
// import PurposeField from "./parts/PurposeField.view";
import CostsSection from "./parts/CostsSection.view";
import EndorsementSection from "./parts/EndorsementSection.view";
import SignatureSection from "./parts/SignatureSection.view";
import { UI_TEXT } from "@/lib/user/request/uiText";

type ViewProps = {
  data: any;
  errors: Record<string, string>;
  needsJustif: boolean;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  onDepartmentChange: (dept: string) => void;

  // Endorser signature (department head)
  signature: string | null;
  sigDirty: boolean;
  sigSaved: boolean;
  sigSavedAt: string | null;
  onSigDraw: () => void;
  onSigSave: (dataUrl: string) => void;
  onSigClear: () => void;
  onSigUpload: (file: File) => void | Promise<void>;
  setHeadEdited: () => void;
};

export default function TravelOrderFormView({
  data,
  errors,
  needsJustif,
  onChange,
  onChangeCosts,
  onDepartmentChange,
  signature,
  sigDirty,
  sigSaved,
  sigSavedAt,
  onSigDraw,
  onSigSave,
  onSigClear,
  onSigUpload,
  setHeadEdited,
}: ViewProps) {
  const c = data?.costs || {};
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{UI_TEXT.title}</h3>
        <span className="text-xs text-neutral-500">{UI_TEXT.requiredHint}</span>
      </div>

      {/* Top half of the form: date, requester, dept, destination, purpose moved here, requester signature */}
      <TopGridFields
        data={data}
        errors={errors}
        onChange={onChange}
        onDepartmentChange={onDepartmentChange}
      />

      {/* PurposeField was removed; purpose is now inside TopGridFields only */}

      <CostsSection
        costs={c}
        needsJustif={needsJustif}
        errors={errors}
        onChangeCosts={onChangeCosts}
      />

      <EndorsementSection
        nameValue={data?.endorsedByHeadName ?? ""}
        dateValue={data?.endorsedByHeadDate ?? ""}
        onNameChange={(v) => {
          setHeadEdited();
          onChange({ endorsedByHeadName: v });
        }}
        onDateChange={(v) => onChange({ endorsedByHeadDate: v })}
      />

      {/* Endorser (department head) signature block */}
      <SignatureSection
        signature={signature}
        sigDirty={sigDirty}
        sigSaved={sigSaved}
        sigSavedAt={sigSavedAt}
        errors={errors}
        onSigDraw={onSigDraw}
        onSigSave={onSigSave}
        onSigClear={onSigClear}
        onSigUpload={onSigUpload}
      />
    </section>
  );
}
