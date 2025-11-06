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
import { saveDraft, getDraft, getSubmission } from "@/lib/user/request/mockApi";
import type { RequesterRole } from "@/lib/user/request/types";

import { useToast } from "@/components/common/ui/ToastProvider.ui";
import {
  consumeHandoff,
  loadAutosave,
  saveAutosave,
  clearAutosave,
} from "@/lib/user/request/persist";
import { useConfirm } from "@/components/common/hooks/useConfirm";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import {
  QuickFillCurrentButton,
  QuickFillMenu,
} from "@/components/user/request/dev/QuickFillButton.ui";
import SuccessModal from "@/components/user/request/SuccessModal";
import SubmitConfirmationDialog from "@/components/user/request/SubmitConfirmationDialog";

// Admin list sink (mock inbox)
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

function RequestWizardContent() {
  const search = useSearchParams();
  const toast = useToast();
  const { ask, ui: confirmUI } = useConfirm();
  const { user: currentUser, loading: userLoading } = useCurrentUser();

  const {
    data,
    lockedVehicle,
    setReason,
    setVehicleMode,
    setRequesterRole,

    // safe nested patchers
    patchTravelOrder,
    patchCosts,
    patchSchoolService,
    patchSeminar,

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

  // -------- restore on first mount only --------
  const didHydrateRef = React.useRef(false);

  React.useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    let did = false;

    // 1) session handoff (edit-from-history)
    const h = consumeHandoff();
    if (h?.data) {
      hardSet(h.data);
      clearIds();
      if (h.from === "draft") setCurrentDraftId(h.id);
      if (h.from === "submission") setCurrentSubmissionId(h.id);
      toast({
        kind: "success",
        title: "Draft loaded",
        message: "Form populated from draft.",
      });
      did = true;
    }

    // 2) URL based restore (fallback)
    (async () => {
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

      // 3) Autosave fallback
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
    })().catch(() => {
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

  // Pre-fill requesting person with current user's name - ALWAYS update when user loads
  React.useEffect(() => {
    if (currentUser && currentUser.name) {
      // Only update if empty OR different from current user
      if (!data.travelOrder?.requestingPerson || data.travelOrder.requestingPerson !== currentUser.name) {
        patchTravelOrder({ requestingPerson: currentUser.name });
      }
    }
  }, [currentUser]);

  // autosave on change (debounced)
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
        // keep both signatures in shape when resetting
        requesterSignature: "",
        endorsedByHeadName: "",
        endorsedByHeadDate: "",
        endorsedByHeadSignature: "",
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
    afterSuccessfulSubmitReset();
    toast({ kind: "success", title: "Cleared", message: "Form reset." });
  }

  // pass patchers (latest state inside store)
  const onChangeTravelOrder = (p: any) => patchTravelOrder(p);
  const onChangeCosts = (p: any) => patchCosts(p);
  const onChangeSchoolService = (p: any) => patchSchoolService(p);
  const onChangeSeminar = (p: any) => patchSeminar(p);

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
      toast({ kind: "error", title: "Save failed", message: "Could not save draft." });
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
      "seminar.applicationDate": "sem-applicationDate",
      "seminar.title": "sem-title",
      "seminar.dateFrom": "sem-dateFrom",
      "seminar.dateTo": "sem-dateTo",
      // Optional: if you later require requester signature, this lets us scroll near the top grid
      "travelOrder.requesterSignature": "to-requester",
      // Endorser signature has no direct input ID; keep as-is
      "travelOrder.endorsedByHeadSignature": "",
    };

    const el = document.getElementById(idMap[firstKey] || "");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | HTMLTextAreaElement).focus?.();
    }
  }

  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [submittedData, setSubmittedData] = React.useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  async function handleSubmit() {
    // library validation
    const v = canSubmit(data);

    const mergedErrors = { ...v.errors };
    setErrors(mergedErrors);

    const ok = v.ok;
    if (!ok) {
      scrollToFirstError(mergedErrors);
      toast({
        kind: "error",
        title: "Cannot submit",
        message: "Please complete required fields.",
      });
      return;
    }

    // Show confirmation dialog instead of submitting immediately
    setShowConfirmDialog(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirmDialog(false);
    setSubmitting(true);
    try {
      // Call real API
      console.log("[Submit] Full form data:", data);
      console.log("[Submit] School Service:", data.schoolService);
      
      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelOrder: data.travelOrder,
          reason: data.reason,
          vehicleMode: data.vehicleMode,
          schoolService: data.schoolService, // ✅ NOW INCLUDED!
          seminar: data.seminar,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to submit");
      }

      // Show success modal
      setSubmittedData(result.data);
      setShowSuccessModal(true);
      afterSuccessfulSubmitReset();
    } catch (err: any) {
      toast({
        kind: "error",
        title: "Submit failed",
        message: err.message || "Please try again.",
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
      {showSuccessModal && (
        <SuccessModal
          data={submittedData}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

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
            onRequester={(r: RequesterRole) => setRequesterRole(r)}
          />

          <TravelOrderForm
            data={data.travelOrder}
            onChange={onChangeTravelOrder}
            onChangeCosts={onChangeCosts}
            errors={errors}
            vehicleMode={data.vehicleMode}
            isHeadRequester={currentUser?.role === "head"}
            currentUserName={currentUser?.name}
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
            headName={data.travelOrder?.endorsedByHeadName}
            department={data.travelOrder?.department}
            isHeadRequester={currentUser?.role === "head"}
            vehicleMode={data.vehicleMode}
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

      {/* Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmedSubmit}
        requesterName={data.travelOrder?.requestingPerson || ""}
        department={data.travelOrder?.department || ""}
        purpose={data.travelOrder?.purposeOfTravel || ""}
        destination={data.travelOrder?.destination || ""}
        travelDate={data.travelOrder?.departureDate || ""}
        returnDate={data.travelOrder?.returnDate || ""}
        approvalPath={fullApprovalPath({
          requesterRole: data.requesterRole,
          vehicleMode: data.vehicleMode,
        })}
        firstReceiver={firstHop}
        isSubmitting={submitting}
      />
    </>
  );
}

export default function RequestWizard() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <RequestWizardContent />
    </React.Suspense>
  );
}
