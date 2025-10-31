"use client";

import * as React from "react";
import type { VehicleMode } from "@/lib/user/request/types";
import { getDepartmentHead } from "@/lib/org/departments";
import TravelOrderFormView from "./TravelOrderForm.view";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

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

  // Sending state for the new flow
  const [sending, setSending] = React.useState(false);

  function handleDepartmentChange(nextDept: string) {
    const patch: any = { department: nextDept };

    // Auto-fill head if not manually edited yet or currently empty
    const currentHead = data?.endorsedByHeadName ?? "";
    if (!headEditedRef.current || !currentHead) {
      patch.endorsedByHeadName = getDepartmentHead(nextDept);
    }

    onChange(patch);
  }

  async function submitToHead() {
    if (!data?.department) {
      alert("Please select Department first.");
      return;
    }

    setSending(true);
    try {
      const now = new Date().toISOString();
      const id =
        data?.id ?? (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

      // Create/Update an AdminRequest record with status: pending_head
      AdminRequestsRepo.upsert({
        id,
        createdAt: data?.createdAt || now,
        updatedAt: now,
        status: "pending_head", // NEW head step
        driver: undefined,
        vehicle: undefined,

        // For quick admin/head reads
        travelOrder: { ...(data ?? {}) } as any,

        // Keep the whole payload if you have it; here we only ensure shape
        payload: { travelOrder: { ...(data ?? {}) } } as any,

        // No admin approval yet
        approverSignature: null,
        approvedAt: null,
        approvedBy: null,
      });

      // Also reflect the id back to form state so subsequent saves keep same record
      onChange({ id, updatedAt: now });

      alert(
        `Sent to Department Head for endorsement${
          data?.endorsedByHeadName ? ` (${data.endorsedByHeadName})` : ""
        }.`
      );
    } finally {
      setSending(false);
    }
  }

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
      // Footer action: send to head
      footerRight={
        <button
          disabled={sending}
          onClick={submitToHead}
          className="rounded-md bg-[#7a1f2a] px-4 py-2 text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send to Department Head"}
        </button>
      }
    />
  );
}
