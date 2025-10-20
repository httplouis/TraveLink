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

  // Signature UI state
  const [sigDirty, setSigDirty] = React.useState(false);
  const [sigSaved, setSigSaved] = React.useState<boolean>(
    !!data?.endorsedByHeadSignature
  );
  const [sigSavedAt, setSigSavedAt] = React.useState<string | null>(
    data?.endorsedByHeadSignature ? new Date().toLocaleString() : null
  );

  // ✅ Keep badge in sync with store updates (autosave, fill current, load draft, etc.)
  React.useEffect(() => {
    const has = !!data?.endorsedByHeadSignature;
    setSigSaved(has);
    if (has) setSigSavedAt(new Date().toLocaleString());
  }, [data?.endorsedByHeadSignature]);

  function handleDepartmentChange(nextDept: string) {
    const patch: any = { department: nextDept };

    // Auto-fill head if not manually edited yet or currently empty
    const currentHead = data?.endorsedByHeadName ?? "";
    if (!headEditedRef.current || !currentHead) {
      patch.endorsedByHeadName = getDepartmentHead(nextDept);
    }

    onChange(patch);
  }

  return (
    <TravelOrderFormView
      data={data}
      errors={errors}
      needsJustif={needsJustif}
      onChange={onChange}
      onChangeCosts={onChangeCosts}
      onDepartmentChange={handleDepartmentChange}
      // signature props
      signature={data?.endorsedByHeadSignature || null}
      sigDirty={sigDirty}
      sigSaved={sigSaved}
      sigSavedAt={sigSavedAt}
      onSigDraw={() => setSigDirty(true)}
      onSigSave={(dataUrl) => {
        onChange({ endorsedByHeadSignature: dataUrl });
        setSigSaved(true);
        setSigDirty(false);
        setSigSavedAt(new Date().toLocaleString());
      }}
      onSigClear={() => {
        onChange({ endorsedByHeadSignature: "" });
        setSigDirty(false);
        setSigSaved(false);
        setSigSavedAt(null);
      }}
      onSigUpload={async (file) => {
        const buf = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const dataUrl = `data:${file.type};base64,${b64}`;
        onChange({ endorsedByHeadSignature: dataUrl });
        setSigSaved(true);
        setSigDirty(false);
        setSigSavedAt(new Date().toLocaleString());
      }}
      setHeadEdited={() => {
        headEditedRef.current = true;
      }}
    />
  );
}
