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
import { computeTotalBudget } from "@/lib/user/request/status";
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
  const [requestingPersonIsHead, setRequestingPersonIsHead] = React.useState<boolean | null>(null);
  const [requestingPersonHeadInfo, setRequestingPersonHeadInfo] = React.useState<{
    name: string;
    department: string;
  } | null>(null);
  const [requestingPersonInfo, setRequestingPersonInfo] = React.useState<{
    id: string;
    name: string;
    department: string;
    departmentId: string;
  } | null>(null);
  const [isRepresentativeSubmission, setIsRepresentativeSubmission] = React.useState(false);

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

  // Check if requesting person is a head when requesting person or department changes
  React.useEffect(() => {
    console.log('[RequestWizard] 🔄 useEffect triggered');
    console.log('  - requestingPerson:', data.travelOrder?.requestingPerson);
    console.log('  - currentUser?.name:', currentUser?.name);
    console.log('  - userLoading:', userLoading);
    
    const checkRequestingPerson = async () => {
      const requestingPerson = data.travelOrder?.requestingPerson;
      
      if (!requestingPerson || requestingPerson.trim() === "") {
        console.log('[RequestWizard] ⚠️ No requesting person, setting to false');
        setRequestingPersonIsHead(null);
        setRequestingPersonHeadInfo(null);
        setRequestingPersonInfo(null);
        setIsRepresentativeSubmission(false);
        return;
      }

      try {
        // First, get department ID from department name if available
        let deptId = null;
        if (data.travelOrder?.department) {
          const deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(data.travelOrder.department)}`);
          const deptData = await deptResponse.json();
          if (deptData.ok && deptData.departments?.[0]) {
            deptId = deptData.departments[0].id;
          }
        }

        const response = await fetch("/api/users/check-head", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestingPersonName: requestingPerson,
            departmentId: deptId,
          }),
        });

        const result = await response.json();
        if (result.ok && result.user) {
          setRequestingPersonIsHead(result.isHead);
          
          // Store requesting person info - ALWAYS use requester's department
          const requesterDepartment = result.user.department || "";
          setRequestingPersonInfo({
            id: result.user.id,
            name: result.user.name || requestingPerson,
            department: requesterDepartment,
            departmentId: result.user.department_id || "",
          });

          // Check if requesting person is different from logged-in user
          // Compare by user ID first (most reliable), then by name
          const requestingPersonNameFromDB = result.user.name || requestingPerson;
          const requestingPersonId = result.user.id;
          
          // If currentUser is null but userLoading is false, try to fetch current user info
          let actualCurrentUser = currentUser;
          if (!actualCurrentUser && !userLoading) {
            try {
              // Try to get current user from API
              const currentUserResponse = await fetch("/api/profile");
              const currentUserData = await currentUserResponse.json();
              if (currentUserData.ok && currentUserData.data) {
                actualCurrentUser = {
                  id: currentUserData.data.id,
                  email: currentUserData.data.email,
                  name: currentUserData.data.name,
                  role: currentUserData.data.role,
                  department: currentUserData.data.department,
                };
                console.log('[RequestWizard] Fetched current user from API:', actualCurrentUser);
              }
            } catch (error) {
              console.warn('[RequestWizard] Failed to fetch current user from API:', error);
            }
          }
          
          // Check if it's the same person by comparing IDs or names
          const isSamePersonById = actualCurrentUser?.id && requestingPersonId && actualCurrentUser.id === requestingPersonId;
          const isSamePersonByName = actualCurrentUser?.name && 
            actualCurrentUser.name.toLowerCase().trim() === requestingPersonNameFromDB.toLowerCase().trim();
          
          // It's the same person if either ID or name matches
          const isSamePerson = isSamePersonById || isSamePersonByName;
          
          // It's a representative submission if:
          // 1. Current user exists AND requesting person is different (not same by ID or name)
          // 2. If current user doesn't exist, compare by name only (fallback)
          // 3. If still can't determine, default to false (show signature pad - safer for self-requests)
          let finalIsDifferent = false;
          if (actualCurrentUser) {
            finalIsDifferent = !isSamePerson;  // User exists: check if different (not same person)
          } else {
            // No current user info available - compare requesting person name with what we might know
            // If requesting person name looks like it could be the current user, default to false (not representative)
            // Otherwise, we can't determine, so default to false (show signature pad - safer)
            console.log('[RequestWizard] ⚠️ No current user info available, defaulting to NOT representative (show signature pad)');
            finalIsDifferent = false;
          }
          
          console.log('[RequestWizard] Checking representative submission:');
          console.log('  - Current user ID (from hook):', currentUser?.id);
          console.log('  - Current user name (from hook):', currentUser?.name);
          console.log('  - Actual current user ID:', actualCurrentUser?.id);
          console.log('  - Actual current user name:', actualCurrentUser?.name);
          console.log('  - Requesting person ID:', requestingPersonId);
          console.log('  - Requesting person name (from DB):', requestingPersonNameFromDB);
          console.log('  - Is same person (by ID)?', isSamePersonById);
          console.log('  - Is same person (by name)?', isSamePersonByName);
          console.log('  - Is same person (overall)?', isSamePerson);
          console.log('  - Is representative submission?', finalIsDifferent);
          setIsRepresentativeSubmission(finalIsDifferent);

          // ALWAYS update department to requesting person's department (requester's department)
          // This ensures the department matches the requester, not the current user
          if (requesterDepartment) {
            if (requesterDepartment !== data.travelOrder?.department) {
              console.log('[RequestWizard] 🔄 Updating department to requester\'s department:', requesterDepartment);
              patchTravelOrder({ department: requesterDepartment });
            } else {
              console.log('[RequestWizard] ✅ Department already matches requester\'s department:', requesterDepartment);
            }
          }
          
          // If requesting person is NOT a head, find their department head (requester's department head)
          if (!result.isHead && result.user?.department_id) {
            const headResponse = await fetch(`/api/approvers?departmentId=${result.user.department_id}`);
            const headData = await headResponse.json();
            if (headData.ok && headData.heads?.[0]) {
              setRequestingPersonHeadInfo({
                name: headData.heads[0].name || "Department Head",
                department: headData.heads[0].department || requesterDepartment || "",
              });
            } else {
              setRequestingPersonHeadInfo({
                name: "Department Head",
                department: requesterDepartment || "",
              });
            }
          } else {
            setRequestingPersonHeadInfo(null);
          }
        } else {
          // User not found in database, compare by name only
          // Try to get current user info if not available
          let actualCurrentUser = currentUser;
          if (!actualCurrentUser && !userLoading) {
            try {
              const currentUserResponse = await fetch("/api/profile");
              const currentUserData = await currentUserResponse.json();
              if (currentUserData.ok && currentUserData.data) {
                actualCurrentUser = {
                  id: currentUserData.data.id,
                  email: currentUserData.data.email,
                  name: currentUserData.data.name,
                  role: currentUserData.data.role,
                  department: currentUserData.data.department,
                };
              }
            } catch (error) {
              console.warn('[RequestWizard] Failed to fetch current user from API:', error);
            }
          }
          
          // If current user is loaded, check if names match
          const isSamePersonByName = actualCurrentUser?.name && 
            actualCurrentUser.name.toLowerCase().trim() === requestingPerson.toLowerCase().trim();
          const finalIsDifferent = actualCurrentUser 
            ? !isSamePersonByName  // User exists: check if different by name
            : false;  // User not available: default to NOT representative (show signature pad - safer)
          setIsRepresentativeSubmission(finalIsDifferent);
          setRequestingPersonIsHead(null);
          setRequestingPersonHeadInfo(null);
          setRequestingPersonInfo(null);
        }
      } catch (error) {
        console.error("Failed to check requesting person:", error);
        // Still check if different from current user even if API fails
        // Try to get current user info if not available
        let actualCurrentUser = currentUser;
        if (!actualCurrentUser && !userLoading) {
          try {
            const currentUserResponse = await fetch("/api/profile");
            const currentUserData = await currentUserResponse.json();
            if (currentUserData.ok && currentUserData.data) {
              actualCurrentUser = {
                id: currentUserData.data.id,
                email: currentUserData.data.email,
                name: currentUserData.data.name,
                role: currentUserData.data.role,
                department: currentUserData.data.department,
              };
            }
          } catch (fetchError) {
            console.warn('[RequestWizard] Failed to fetch current user from API:', fetchError);
          }
        }
        
        // Compare by name only if API fails
        const isSamePersonByName = actualCurrentUser?.name && 
          actualCurrentUser.name.toLowerCase().trim() === requestingPerson.toLowerCase().trim();
        const finalIsDifferent = actualCurrentUser 
          ? !isSamePersonByName  // User exists: check if different by name
          : false;  // User not available: default to NOT representative (show signature pad - safer)
        setIsRepresentativeSubmission(finalIsDifferent);
        setRequestingPersonIsHead(null);
        setRequestingPersonHeadInfo(null);
        setRequestingPersonInfo(null);
      }
    };

    // Wait for user to load first - we need currentUser to properly determine if it's representative
    if (userLoading) {
      console.log('[RequestWizard] ⏳ Waiting for user to load...');
      // While loading, don't set representative yet - will be determined once user loads
      // This prevents hiding signature pad prematurely
      return;
    }
    
    // Check if we have requesting person - we need both to compare properly
    if (data.travelOrder?.requestingPerson) {
      console.log('[RequestWizard] ✅ Requesting person available, running check...');
      checkRequestingPerson();
    } else {
      console.log('[RequestWizard] ⚠️ No requesting person, setting to false');
      setIsRepresentativeSubmission(false);
    }
  }, [data.travelOrder?.requestingPerson, data.travelOrder?.department, currentUser?.id, currentUser?.name, userLoading]);

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
  const onChangeTravelOrder = (p: any) => {
    patchTravelOrder(p);
    
    // Immediately check if requesting person changed and if it's different from current user
    // Note: This is a quick check by name only, but the full check in useEffect will run after API call with ID comparison
    if (p.requestingPerson !== undefined) {
      if (currentUser?.name) {
        // Quick check by name - full check with ID will happen in useEffect
        const isSamePersonByName = currentUser.name.toLowerCase().trim() === p.requestingPerson.toLowerCase().trim();
        const isDifferent = !isSamePersonByName;
        console.log('[RequestWizard] 🚀 Immediate check on onChange (by name):');
        console.log('  - Current user:', currentUser.name);
        console.log('  - New requesting person:', p.requestingPerson);
        console.log('  - Is different?', isDifferent);
        setIsRepresentativeSubmission(isDifferent);
      }
      // If currentUser is not loaded yet, don't set it here - let useEffect handle it with full API check
      // This prevents incorrect assumptions
    }
  };
  const onChangeCosts = (p: any) => patchCosts(p);
  const onChangeSchoolService = (p: any) => patchSchoolService(p);
  const onChangeSeminar = (p: any) => patchSeminar(p);

  async function handleSaveDraft() {
    setSaving(true);
    try {
      // First, save to database to get a real request ID (for invitations)
      // This allows sending invitations even for drafts
      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelOrder: data.travelOrder,
          reason: data.reason,
          vehicleMode: data.vehicleMode,
          schoolService: data.schoolService,
          seminar: data.seminar,
          status: "draft", // Save as draft
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to save draft");
      }

      // Store the request ID in the form data (for invitations)
      if (result.data?.id) {
        if (data.reason === "seminar") {
          patchSeminar({ requestId: result.data.id });
        }
        setCurrentSubmissionId(result.data.id);
      }

      // Also save to localStorage for draft management
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

    // Try to find element with data-error attribute first (most reliable)
    const errorElement = document.querySelector('[data-error="true"]');
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      (errorElement as HTMLInputElement | HTMLTextAreaElement).focus?.();
      return;
    }

    // Fallback to ID mapping
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
      "travelOrder.requesterSignature": "to-signature",
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
    const v = canSubmit(data, { isRepresentativeSubmission });

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
      
      // Store request ID for participant invitations (if seminar)
      // This allows sending invitations even after submission
      if (data.reason === "seminar" && result.data?.id) {
        // Update seminar data with request ID so invitations can be sent
        patchSeminar({ requestId: result.data.id, isSubmitted: true });
        // Don't reset immediately if there are pending invitations
        const hasPendingInvitations = Array.isArray(data.seminar?.participantInvitations) && 
          data.seminar.participantInvitations.some((inv: any) => !inv.invitationId);
        
        if (!hasPendingInvitations) {
          afterSuccessfulSubmitReset();
        } else {
          // Keep form open so they can send invitations
          toast({
            kind: "info",
            title: "Request submitted",
            message: "You can now send participant invitations. The form will remain open for you to send invitations.",
          });
        }
      } else {
        afterSuccessfulSubmitReset();
      }
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

  const hasBudget = computeTotalBudget(data.travelOrder?.costs) > 0;
  const needsVehicle = data.vehicleMode === "institutional" || data.vehicleMode === "rent";
  
  const firstHop = firstReceiver({
    requesterRole: data.requesterRole,
    vehicleMode: data.vehicleMode,
    reason: data.reason,
    hasBudget,
  });
  const validation = canSubmit(data, { isRepresentativeSubmission });

  return (
    <>
      {showSuccessModal && (
        <SuccessModal
          data={submittedData}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main Form Area */}
        <div className="space-y-6">
          {/* Header Section - Enhanced */}
          <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentSubmissionId ? "Edit Submission" : "Request Form"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {currentSubmissionId 
                    ? "Update your submission details" 
                    : "Fill out the form below to submit a new travel request"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  type="button"
                  className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
                  title="Clear all fields"
                >
                  Clear
                </button>
                <QuickFillCurrentButton />
                <QuickFillMenu />
                <Link 
                  href="/user/drafts" 
                  className="rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100"
                >
                  View drafts
                </Link>
                <Link 
                  href="/user/submissions" 
                  className="rounded-lg border-2 border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-all hover:border-green-300 hover:bg-green-100"
                >
                  View submissions
                </Link>
              </div>
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

          {/* Show Travel Order form only if NOT seminar */}
          {!showSeminar && (
            <TravelOrderForm
              data={data.travelOrder}
              onChange={onChangeTravelOrder}
              onChangeCosts={onChangeCosts}
              errors={errors}
              vehicleMode={data.vehicleMode}
              isHeadRequester={currentUser?.role === "head"}
              isRepresentativeSubmission={isRepresentativeSubmission}
              requestingPersonHeadName={requestingPersonHeadInfo?.name}
              currentUserName={currentUser?.name}
            />
          )}

          {/* Show School Service only for institutional vehicles AND not seminar */}
          {showSchoolService && !showSeminar && (
            <SchoolServiceSection
              data={data.schoolService}
              onChange={onChangeSchoolService}
              errors={errors}
            />
          )}

          {/* Show Seminar form only when seminar is selected */}
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
            headName={
              requestingPersonIsHead === false && requestingPersonHeadInfo
                ? requestingPersonHeadInfo.name
                : requestingPersonHeadInfo?.name || data.travelOrder?.endorsedByHeadName
            }
            department={
              // ALWAYS use requester's department (from requestingPersonInfo or requestingPersonHeadInfo)
              requestingPersonInfo?.department || 
              requestingPersonHeadInfo?.department || 
              data.travelOrder?.department
            }
            isHeadRequester={requestingPersonIsHead === true || currentUser?.role === "head"}
            requestingPersonIsHead={requestingPersonIsHead}
            isRepresentativeSubmission={isRepresentativeSubmission}
            requestingPersonName={data.travelOrder?.requestingPerson}
            vehicleMode={data.vehicleMode}
            errors={validation.errors}
            onGoToField={(fieldKey) => {
              // Map field key to element and scroll
              const idMap: Record<string, string> = {
                "travelOrder.date": "to-date",
                "travelOrder.requestingPerson": "to-requester",
                "travelOrder.department": "to-department",
                "travelOrder.destination": "to-destination",
                "travelOrder.departureDate": "to-departure",
                "travelOrder.returnDate": "to-return",
                "travelOrder.purposeOfTravel": "to-purpose",
                "travelOrder.costs.justification": "to-justification",
                "travelOrder.requesterSignature": "to-signature",
                "seminar.applicationDate": "sem-applicationDate",
                "seminar.title": "sem-title",
                "seminar.dateFrom": "sem-dateFrom",
                "seminar.dateTo": "sem-dateTo",
                "seminar.requesterSignature": "sem-signature",
              };
              
              const elementId = idMap[fieldKey];
              if (elementId) {
                const el = document.getElementById(elementId) || document.querySelector(`[data-error="true"]`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  (el as HTMLElement).focus?.();
                }
              } else {
                // Try to find by data-error attribute
                const errorEl = document.querySelector('[data-error="true"]');
                if (errorEl) {
                  errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  (errorEl as HTMLElement).focus?.();
                }
              }
            }}
          />
        </div>

        <SummarySidebar
          data={data}
          firstHop={firstHop}
          path={fullApprovalPath({
            requesterRole: data.requesterRole,
            vehicleMode: data.vehicleMode,
            hasBudget,
            needsVehicle,
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
