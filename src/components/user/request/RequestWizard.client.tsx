// src/components/user/request/RequestWizard.client.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ChoicesBar from "@/components/user/request/ui/ChoicesBar.ui";
import TravelOrderForm from "@/components/user/request/ui/TravelOrderForm.ui";
import SchoolServiceSection from "@/components/user/request/ui/SchoolServiceSection.ui";
import SeminarApplicationForm from "@/components/user/request/ui/SeminarApplicationForm.ui";
import SummarySidebar from "@/components/user/request/ui/SummarySidebar.ui";
import SubmitBar from "@/components/user/request/ui/SubmitBar.ui";

import { useRequestStore } from "@/store/user/requestStore";
import { canSubmit } from "@/lib/user/request/validation";
import { firstReceiver, fullApprovalPath } from "@/lib/user/request/routing";
import {
  saveDraft,
  updateSubmission,
  getDraft,
  getSubmission,
} from "@/lib/user/request/mockApi";
import type { RequesterRole } from "@/lib/user/request/types";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import {
  consumeHandoff,
  loadAutosave,
  saveAutosave,
  clearAutosave,
} from "@/lib/user/request/persist";
import { useConfirm } from "@/components/common/hooks/useConfirm";

import {
  QuickFillCurrentButton,
  QuickFillMenu,
} from "@/components/user/request/dev/QuickFillButton.ui";

// ✅ import AdminRequestsRepo
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

export default function RequestWizard() {
  const search = useSearchParams(); // may be null
  const toast = useToast();
  const { ask, ui: confirmUI } = useConfirm();

  const {
    data,
    lockedVehicle,
    setReason,
    setVehicleMode,
    patch,
    hardSet,
    currentDraftId,
    setCurrentDraftId,
    currentSubmissionId,
    setCurrentSubmissionId,
    clearIds,
  } = useRequestStore();

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const showSeminar = data.reason === "seminar";
  const showSchoolService = data.vehicleMode === "institutional";

  // ---------- restore in this order: handoff → URL → autosave ----------
  React.useEffect(() => {
    let did = false;

    const h = consumeHandoff();
    if (h?.data) {
      hardSet(h.data);
      clearIds();
      if (h.from === "draft") setCurrentDraftId(h.id);
      if (h.from === "submission") setCurrentSubmissionId(h.id);
      toast({
        kind: "success",
        title: "Loaded",
        message: `Form populated from ${h.from}.`,
      });
      did = true;
    }

    const tryUrlFetch = async () => {
      if (did) return;

      const draftId = search?.get("draft") ?? null;
      const subId = search?.get("submission") ?? null;

      if (draftId) {
        const d = await getDraft(draftId);
        if (d?.data) {
          hardSet(d.data);
          clearIds();
          setCurrentDraftId(draftId);
          toast({
            kind: "success",
            title: "Draft loaded",
            message: "Form populated from draft.",
          });
          did = true;
        }
      } else if (subId) {
        const s = await getSubmission(subId);
        if (s?.data) {
          hardSet(s.data);
          clearIds();
          setCurrentSubmissionId(subId);
          toast({
            kind: "info",
            title: "Editing submission",
            message: "Form populated from submission.",
          });
          did = true;
        }
      }

      if (!did) {
        const autosaved = loadAutosave();
        if (autosaved) {
          hardSet(autosaved);
          toast({
            kind: "info",
            title: "Restored",
            message: "Unsaved form recovered.",
          });
        }
      }
    };

    tryUrlFetch().catch(() => {
      const autosaved = loadAutosave();
      if (autosaved) {
        hardSet(autosaved);
        toast({
          kind: "info",
          title: "Restored",
          message: "Unsaved form recovered.",
        });
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- autosave whenever data changes (debounced) ----------
  React.useEffect(() => {
    const id = setTimeout(() => saveAutosave(data), 400);
    return () => clearTimeout(id);
  }, [data]);

  function afterSuccessfulSubmitReset() {
    clearAutosave();
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
        endorsedByHeadName: "",
        endorsedByHeadDate: "",
        endorsedByHeadSignature: "", // ✅ include signature
      },
      schoolService: undefined,
      seminar: undefined,
    });
    setErrors({});
    clearIds();
  }

  async function handleClear() {
    const yes = await ask(
      "Clear the form?",
      "All unsaved values will be removed.",
      "Clear form",
      "Keep"
    );
    if (!yes) return;

    clearAutosave();
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
        endorsedByHeadName: "",
        endorsedByHeadDate: "",
        endorsedByHeadSignature: "", // ✅ include signature
      },
      schoolService: undefined,
      seminar: undefined,
    });
    setErrors({});
    clearIds();
    toast({ kind: "success", title: "Cleared", message: "Form reset." });
  }

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
      const res = await saveDraft(data, currentDraftId || undefined);
      if (!currentDraftId) setCurrentDraftId(res.id);
      toast({
        kind: "success",
        title: "Draft saved",
        message: "Your draft has been saved.",
      });
    } catch {
      toast({
        kind: "error",
        title: "Save failed",
        message: "Could not save draft.",
      });
    } finally {
      setSaving(false);
    }
  }

  function scrollToFirstError(errs: Record<string, string>) {
    const firstKey = Object.keys(errs)[0];
    if (!firstKey) return;
    const idMap: Record<string, string> = {
      "travelOrder.date": "to-date",
      "travelOrder.requestingPerson": "to-requester",
      "travelOrder.department": "to-department",
      "travelOrder.destination": "to-destination",
      "travelOrder.departureDate": "to-departure",
      "travelOrder.returnDate": "to-return",
      "travelOrder.purposeOfTravel": "to-purpose",
      "travelOrder.costs.justification": "to-justification",
      "schoolService.driver": "ss-driver",
      "schoolService.vehicle": "ss-vehicle",
      "schoolService.vehicleDispatcherDate": "ss-dispatcher-date",
      "seminar.applicationDate": "sem-applicationDate",
      "seminar.title": "sem-title",
      "seminar.dateFrom": "sem-dateFrom",
      "seminar.dateTo": "sem-dateTo",
    };
    const el = document.getElementById(idMap[firstKey] || "");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | HTMLTextAreaElement).focus?.();
    }
  }

  async function handleSubmit() {
    const v = canSubmit(data);
    setErrors(v.errors);
    if (!v.ok) {
      scrollToFirstError(v.errors);
      toast({
        kind: "error",
        title: "Cannot submit",
        message: "Please complete required fields.",
      });
      return;
    }
    setSubmitting(true);
    try {
      // ✅ directly save to AdminRequestsRepo
      AdminRequestsRepo.acceptFromUser(data);
      toast({
        kind: "success",
        title: "Submitted",
        message: "Request has been submitted and sent to Admin.",
      });
      afterSuccessfulSubmitReset();
    } catch {
      toast({
        kind: "error",
        title: "Submit failed",
        message: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const firstHop = firstReceiver({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
    reason: data.reason,
  });
  const validation = canSubmit(data);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {currentSubmissionId ? "Edit Submission" : "Request Form"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                type="button"
                className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
                title="Clear all fields"
              >
                Clear
              </button>
              <QuickFillCurrentButton />
              <QuickFillMenu />
              <Link href="/user/drafts" className="text-sm text-neutral-600 underline">
                View drafts
              </Link>
              <Link href="/user/submissions" className="text-sm text-neutral-600 underline">
                View submissions
              </Link>
            </div>
          </div>

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
            invalid={!validation.ok}
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

      {confirmUI}
    </>
  );
}
