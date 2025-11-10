"use client";

import * as React from "react";
import type { VehicleMode } from "@/lib/user/request/types";
import { getDepartmentHead } from "@/lib/org/departments";
import TravelOrderFormView from "./TravelOrderForm.view";

type Props = {
  data: any;
  onChange: (patch: any) => void;
  onChangeCosts: (patch: any) => void;
  errors: Record<string, string>;
  vehicleMode: VehicleMode;
  isHeadRequester?: boolean;
  currentUserName?: string;
};

export default function TravelOrderForm({
  data,
  onChange,
  onChangeCosts,
  errors,
  vehicleMode,
  isHeadRequester,
  currentUserName,
}: Props) {
  // Always show justification field (but it's optional)
  const needsJustif = true;

  const headEditedRef = React.useRef(false);

  function handleDepartmentChange(nextDept: string) {
    const patch: any = { department: nextDept };

    const currentHead = data?.endorsedByHeadName ?? "";
    if (!headEditedRef.current || !currentHead) {
      patch.endorsedByHeadName = getDepartmentHead(nextDept);
    }

    onChange(patch);
  }

  // Submission is now handled by SubmitBar component in RequestWizard
  // This form should only handle data input, not submission

  return (
    <TravelOrderFormView
      data={data}
      errors={errors}
      needsJustif={needsJustif}
      onChange={onChange}
      onChangeCosts={onChangeCosts}
      onDepartmentChange={handleDepartmentChange}
      setHeadEdited={() => {
        headEditedRef.current = true;
      }}
      isHeadRequester={isHeadRequester}
      currentUserName={currentUserName}
      // No footerRight - submission handled by SubmitBar at bottom
    />
  );
}
