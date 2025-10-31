"use client";

import * as React from "react";
import TopGridFields from "./parts/TopGridFields.view";
// ⛔️ Purpose is already part of TopGridFields; keep it centralized there.
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

  // New, optional action slot for the footer (e.g., "Send to Department Head")
  footerRight?: React.ReactNode;
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
}: ViewProps) {
  const c = data?.costs || {};

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{UI_TEXT.title}</h3>
        <span className="text-xs text-neutral-500">{UI_TEXT.requiredHint}</span>
      </div>

      {/* Top half of the form: date, requester, dept, destination, purpose (inside TopGridFields), requester signature */}
      <TopGridFields
        data={data}
        errors={errors}
        onChange={onChange}
        onDepartmentChange={onDepartmentChange}
      />

      <CostsSection
        costs={c}
        needsJustif={needsJustif}
        errors={errors}
        onChangeCosts={onChangeCosts}
      />

      {/* Head details (name/date) remain editable to route correctly; signature is NOT in user step */}
      <EndorsementSection
        nameValue={data?.endorsedByHeadName ?? ""}
        dateValue={data?.endorsedByHeadDate ?? ""}
        onNameChange={(v) => {
          setHeadEdited();
          onChange({ endorsedByHeadName: v });
        }}
        onDateChange={(v) => onChange({ endorsedByHeadDate: v })}
      />

      {/* Footer actions */}
      <div className="mt-5 flex items-center justify-end gap-2">
        {footerRight}
      </div>
    </section>
  );
}
