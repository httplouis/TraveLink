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

  const headEditedRef = React.useRef(false);
  const [sending, setSending] = React.useState(false);

  function handleDepartmentChange(nextDept: string) {
    const patch: any = { department: nextDept };

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

    // ❶ signature must exist
    const requesterSig =
      data?.requestingPersonSignature ||
      data?.requesterSignature ||
      data?.signature ||
      null;

    if (!requesterSig) {
      alert("Please sign the form first before sending.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: data?.created_by ?? "00000000-0000-0000-0000-000000000000",
          current_status: "pending_head",
          payload: {
            travelOrder: {
              ...(data ?? {}),
            },
          },
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        console.error("submit-to-head error:", json);
        alert("Failed to send to Department Head. Check console.");
        return;
      }

      alert(
        `Sent to Department Head for endorsement${
          data?.endorsedByHeadName ? ` (${data.endorsedByHeadName})` : ""
        }.`
      );

      onChange({
        id: json.data.id,
        updatedAt: json.data.updated_at,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to send to Department Head. Check console.");
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
