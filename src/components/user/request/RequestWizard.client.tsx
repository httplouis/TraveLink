"use client";

import * as React from "react";

// adjust these paths if you don't use "@/..."
import { useRequestStore } from "@/store/user/requestStore";
import ChoicesBar from "@/components/user/request/ui/ChoicesBar.ui";
import TravelOrderForm from "@/components/user/request/ui/TravelOrderForm.ui";
import SchoolServiceSection from "@/components/user/request/ui/SchoolServiceSection.ui";
import SeminarApplicationForm from "@/components/user/request/ui/SeminarApplicationForm.ui";
import SummarySidebar from "@/components/user/request/ui/SummarySidebar.ui";
import SubmitBar from "@/components/user/request/ui/SubmitBar.ui";
import { canSubmit } from "@/lib/user/request/validation";
import { firstReceiver, fullApprovalPath } from "@/lib/user/request/routing";
import type { RequesterRole } from "@/lib/user/request/types";
import { saveDraft, submitRequest } from "@/lib/user/request/mockApi";

export default function RequestWizard() {
  const { data, lockedVehicle, setReason, setVehicleMode, patch, hardSet } = useRequestStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const showSeminar = data.reason === "seminar";
  const showSchoolService = data.vehicleMode === "institutional";

  function onChangeTravelOrder(p: any) {
    patch({ travelOrder: { ...data.travelOrder, ...p } as any });
  }
  function onChangeCosts(p: any) {
    patch({
      travelOrder: {
        ...data.travelOrder,
        costs: { ...(data.travelOrder.costs || {}), ...p },
      } as any,
    });
  }
  function onChangeSchoolService(p: any) {
    patch({ schoolService: { ...(data.schoolService || {}), ...p } as any });
  }
  function onChangeSeminar(p: any) {
    patch({ seminar: { ...(data.seminar || {}), ...p } as any });
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      await saveDraft(data);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    const v = canSubmit(data);
    setErrors(v.errors);
    if (!v.ok) return;

    setSubmitting(true);
    try {
      await submitRequest(data);
      hardSet({
        requesterRole: data.requesterRole,
        reason: "visit",
        vehicleMode: "owned",
        travelOrder: {
          date: "",
          requestingPerson: "",
          department: "",
          destination: "",
          departureDate: "",
          returnDate: "",
          purposeOfTravel: "",
          costs: {},
        },
        schoolService: undefined,
        seminar: undefined,
      });
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  const firstHop = firstReceiver({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
    reason: data.reason,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ChoicesBar
          value={{
            reason: data.reason,
            vehicleMode: data.vehicleMode,
            requesterRole: data.requesterRole,
          }}
          lockedVehicle={lockedVehicle}
          onReason={setReason}
          onVehicle={setVehicleMode}
          onRequester={(r: RequesterRole) => patch({ requesterRole: r })}
        />

        <TravelOrderForm
          data={data.travelOrder}
          onChange={onChangeTravelOrder}
          onChangeCosts={onChangeCosts}
          errors={errors}
          vehicleMode={data.vehicleMode}
        />

        {showSchoolService && (
          <SchoolServiceSection
            data={data.schoolService}
            onChange={onChangeSchoolService}
            errors={errors}
          />
        )}

        {showSeminar && (
          <SeminarApplicationForm
            data={data.seminar}
            onChange={onChangeSeminar}
            errors={errors}
          />
        )}

        <SubmitBar
          canSubmit={canSubmit(data).ok}
          saving={saving}
          submitting={submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
        />
      </div>

      <SummarySidebar
        data={data}
        firstHop={firstHop}
        path={fullApprovalPath({
          requesterRole: data.requesterRole,
          vehicleMode: data.vehicleMode,
        })}
      />
    </div>
  );
}
