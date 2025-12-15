// src/components/user/request/RequestWizard.client.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

import ChoicesBar from "@/components/user/request/ui/ChoicesBar.ui";
import TravelOrderForm from "@/components/user/request/ui/TravelOrderForm.ui";
import SchoolServiceSection from "@/components/user/request/ui/SchoolServiceSection.ui";
import SeminarApplicationForm from "@/components/user/request/ui/SeminarApplicationForm.ui";
import SummarySidebar from "@/components/user/request/ui/SummarySidebar.ui";
import SubmitBar from "@/components/user/request/ui/SubmitBar.ui";
import TransportationForm from "@/components/common/TransportationForm";

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

// Quick fill buttons removed per user request
import SuccessModal from "@/components/user/request/SuccessModal";
import SubmitConfirmationDialog from "@/components/user/request/SubmitConfirmationDialog";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";
import FilingDateDisplay from "@/components/common/FilingDateDisplay";

// Note: AdminRequestsRepo import removed - no longer needed (using API now)

function RequestWizardContent() {
  const search = useSearchParams();
  const pathname = usePathname();
  const toast = useToast();
  const { ask, ui: confirmUI } = useConfirm();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  
  // Determine the submissions page based on current route
  const getSubmissionsPath = React.useCallback(() => {
    if (pathname?.startsWith('/head')) {
      return '/head/submissions';
    }
    return '/user/submissions';
  }, [pathname]);
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | undefined>(currentUser?.email);

  // Fetch current user email if not available from hook
  React.useEffect(() => {
    if (currentUser?.email) {
      setCurrentUserEmail(currentUser.email);
    } else if (!userLoading && !currentUser) {
      // Fallback: fetch from API if hook doesn't provide it
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.data?.email) {
            setCurrentUserEmail(data.data.email);
            console.log('[RequestWizard] ✅ Fetched current user email from API:', data.data.email);
          }
        })
        .catch(err => console.warn('[RequestWizard] Failed to fetch current user email:', err));
    }
  }, [currentUser, userLoading]);

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
    patchTransportation,

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
  
  // Store request metadata for Date of Filing display
  const [requestMetadata, setRequestMetadata] = React.useState<{
    createdAt?: string | null;
    requestNumber?: string | null;
    status?: string;
  } | null>(null);
  const [isRepresentativeSubmission, setIsRepresentativeSubmission] = React.useState(false);
  
  // Approver selection for head requesters (messenger-style)
  const [showApproverSelection, setShowApproverSelection] = React.useState(false);
  const [approverOptions, setApproverOptions] = React.useState<any[]>([]);
  const [loadingApprovers, setLoadingApprovers] = React.useState(false);
  const [selectedApproverId, setSelectedApproverId] = React.useState<string | null>(null);
  const [selectedApproverRole, setSelectedApproverRole] = React.useState<string | null>(null);
  const [selectedApproverName, setSelectedApproverName] = React.useState<string | null>(null);
  const [defaultApproverId, setDefaultApproverId] = React.useState<string | undefined>(undefined);
  const [defaultApproverName, setDefaultApproverName] = React.useState<string | undefined>(undefined);

  const showSeminar = data.reason === "seminar";
  const showSchoolService = data.vehicleMode === "institutional";
  
  // Auto-propose budget when institutional vehicle is selected
  React.useEffect(() => {
    if (data.vehicleMode === "institutional" && data.travelOrder) {
      // Import budget proposal utility
      import("@/lib/user/request/budget-proposal").then(({ mergeProposedBudget, hasExistingBudget }) => {
        const currentCosts = data.travelOrder?.costs;
        
        // Only auto-propose if no budget exists yet
        if (!hasExistingBudget(currentCosts)) {
          const proposedCosts = mergeProposedBudget(currentCosts);
          console.log('[RequestWizard] 💰 Auto-proposing budget for institutional vehicle:', proposedCosts);
          patchCosts(proposedCosts);
        }
      });
    }
  }, [data.vehicleMode, data.travelOrder, patchCosts]);
  
  // Check if current user is head requester
  // CRITICAL: If current user is a head AND they are the requesting person, they are a head requester
  const currentUserIsHead = currentUser?.role === "head" || (currentUser as any)?.is_head === true;
  const requestingPersonMatchesCurrentUser = currentUser?.name && 
    data.travelOrder?.requestingPerson && 
    currentUser.name.toLowerCase().trim() === data.travelOrder.requestingPerson.toLowerCase().trim();
  const isHeadRequester = (currentUserIsHead && requestingPersonMatchesCurrentUser) || 
    requestingPersonIsHead === true || 
    (currentUserIsHead && !data.travelOrder?.requestingPerson); // If head and no requesting person set yet
  
  // Auto-detect requester role from current user
  const autoDetectedRole: "faculty" | "head" | null = React.useMemo(() => {
    if (!currentUser || userLoading) return null;
    // Check if user is a head
    const isHead = currentUser.role === "head" || (currentUser as any)?.is_head === true;
    return isHead ? "head" : "faculty";
  }, [currentUser, userLoading]);
  
  // Auto-set requester role on mount if not already set
  React.useEffect(() => {
    if (autoDetectedRole && !data.requesterRole) {
      console.log('[RequestWizard] 🔄 Auto-setting requester role:', autoDetectedRole);
      setRequesterRole(autoDetectedRole);
    }
  }, [autoDetectedRole, data.requesterRole, setRequesterRole]);

  // -------- restore on first mount only --------
  const didHydrateRef = React.useRef(false);
  const checkingRequestingPersonRef = React.useRef(false);
  const lastCheckedRequestingPersonRef = React.useRef<string>("");

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
      toast({ kind: "success", title: "Draft loaded", message: "Form populated from draft." });
      did = true;
    }

    // 2) URL based restore (fallback)
    (async () => {
      if (did) return;

      const draftId = search?.get("draft") ?? null;
      const subId = search?.get("submission") ?? null;
      const requestId = search?.get("requestId") ?? null;

      if (draftId) {
        const d = await getDraft(draftId);
        if (d?.data) {
          hardSet(d.data);
          clearIds();
          setCurrentDraftId(draftId);
          toast({ kind: "success", title: "Draft loaded", message: "Form populated from draft." });
          did = true;
        }
      } else if (subId || requestId) {
        // Load from database (draft or submission)
        const idToLoad = subId || requestId;
        try {
          const response = await fetch(`/api/requests/${idToLoad}`);
          const result = await response.json();
          
          if (result.ok && result.data) {
            const dbReq = result.data;
            
            // Transform expense_breakdown array to costs object
            const transformExpenseBreakdown = (breakdown: any[]): any => {
              if (!Array.isArray(breakdown)) return {};
              
              const costs: any = {};
              breakdown.forEach((item: any) => {
                const itemName = (item.item || item.category || "").toLowerCase();
                
                if (itemName === "food" || itemName.includes("meal")) {
                  costs.food = item.amount || 0;
                  if (item.description) costs.foodDescription = item.description;
                } else if (itemName === "accommodation" || itemName.includes("lodg")) {
                  costs.accommodation = item.amount || 0;
                  if (item.description) costs.accommodationDescription = item.description;
                } else if ((itemName.includes("driver") && itemName.includes("allowance")) || itemName === "driver allowance") {
                  costs.driversAllowance = item.amount || 0;
                  if (item.description) costs.driversAllowanceDescription = item.description;
                } else if (itemName.includes("hired") && itemName.includes("driver")) {
                  costs.hiredDrivers = item.amount || 0;
                  if (item.description) costs.hiredDriversDescription = item.description;
                } else if (itemName.includes("rent") || itemName.includes("vehicle") || itemName.includes("transport")) {
                  costs.rentVehicles = item.amount || 0;
                  if (item.description) costs.rentVehiclesDescription = item.description;
                } else if (itemName === "other") {
                  costs.otherAmount = item.amount || 0;
                  costs.otherLabel = item.description || item.item || "Other";
                } else if (itemName) {
                  if (!costs.otherItems) costs.otherItems = [];
                  costs.otherItems.push({
                    label: item.item || item.category || "Other",
                    amount: item.amount || 0,
                    description: item.description || ""
                  });
                }
              });
              
              return costs;
            };
            
            // Parse expense_breakdown if it's a string (JSONB from database)
            let expenseBreakdown = dbReq.expense_breakdown;
            if (typeof expenseBreakdown === "string") {
              try {
                expenseBreakdown = JSON.parse(expenseBreakdown);
              } catch (e) {
                console.warn("[RequestWizard] Failed to parse expense_breakdown:", e);
                expenseBreakdown = [];
              }
            }
            
            const costs = Array.isArray(expenseBreakdown) 
              ? transformExpenseBreakdown(expenseBreakdown)
              : (dbReq.expense_breakdown || {});
            
            // Parse attachments from database
            let attachments = dbReq.attachments || [];
            if (typeof attachments === "string") {
              try {
                attachments = JSON.parse(attachments);
              } catch (e) {
                console.warn("[RequestWizard] Failed to parse attachments:", e);
                attachments = [];
              }
            }
            console.log("[RequestWizard] Loaded attachments from database:", attachments);
            
            // Transform database request to form data format
            const formData: any = {
              requesterRole: dbReq.requester_is_head ? "head" : "faculty",
              reason: dbReq.request_type === "seminar" ? "seminar" : "official",
              vehicleMode: dbReq.needs_rental ? "rent" : dbReq.needs_vehicle ? "institutional" : "owned",
              travelOrder: {
                date: dbReq.travel_start_date ? new Date(dbReq.travel_start_date).toISOString().split('T')[0] : "",
                requestingPerson: dbReq.requester_name || "",
                department: dbReq.department?.name || dbReq.department?.code || "",
                destination: dbReq.destination || "",
                departureDate: dbReq.travel_start_date ? new Date(dbReq.travel_start_date).toISOString().split('T')[0] : "",
                returnDate: dbReq.travel_end_date ? new Date(dbReq.travel_end_date).toISOString().split('T')[0] : "",
                purposeOfTravel: dbReq.purpose || "",
                costs: costs,
                // CRITICAL: Restore signatures from database
                requesterSignature: dbReq.requester_signature || null,
                endorsedByHeadName: dbReq.head_approver?.name || dbReq.head_approver?.email || "",
                endorsedByHeadDate: dbReq.head_approved_at ? new Date(dbReq.head_approved_at).toISOString().split('T')[0] : "",
                endorsedByHeadSignature: dbReq.head_signature || null,
                requesters: dbReq.requesters || [],
                // CRITICAL: Restore attachments from database
                attachments: attachments,
              },
              // Restore seminar data if exists
              seminar: dbReq.seminar_details ? {
                ...dbReq.seminar_details,
                // CRITICAL: Restore seminar signature
                requesterSignature: dbReq.requester_signature || dbReq.seminar_details.requesterSignature || null,
                // CRITICAL: Restore attachments for seminar
                attachments: attachments,
              } : undefined,
              schoolService: dbReq.school_service_details || undefined,
              transportation: dbReq.transportation || undefined,
            };
            
            hardSet(formData);
            clearIds();
            setCurrentSubmissionId(idToLoad);
            // Store request metadata for Date of Filing display
            setRequestMetadata({
              createdAt: dbReq.created_at || null,
              requestNumber: dbReq.request_number || null,
              status: dbReq.status || null,
            });
            // Also save to localStorage draft for persistence
            await saveDraft(formData, currentDraftId || undefined);
            toast({ kind: "info", title: "Draft restored", message: "Form populated from saved draft with signatures." });
            did = true;
          }
        } catch (err: any) {
          console.error("[RequestWizard] Error loading request from database:", err);
        }
      }

      // 3) Check if there's a currentSubmissionId in store (from previous session)
      if (!did && currentSubmissionId) {
        try {
          const response = await fetch(`/api/requests/${currentSubmissionId}`);
          const result = await response.json();
          
          if (result.ok && result.data && result.data.status === "draft") {
            const dbReq = result.data;
            
            // Transform expense_breakdown array to costs object (same logic as above)
            const transformExpenseBreakdown = (breakdown: any[]): any => {
              if (!Array.isArray(breakdown)) return {};
              
              const costs: any = {};
              breakdown.forEach((item: any) => {
                const itemName = (item.item || item.category || "").toLowerCase();
                
                if (itemName === "food" || itemName.includes("meal")) {
                  costs.food = item.amount || 0;
                  if (item.description) costs.foodDescription = item.description;
                } else if (itemName === "accommodation" || itemName.includes("lodg")) {
                  costs.accommodation = item.amount || 0;
                  if (item.description) costs.accommodationDescription = item.description;
                } else if ((itemName.includes("driver") && itemName.includes("allowance")) || itemName === "driver allowance") {
                  costs.driversAllowance = item.amount || 0;
                  if (item.description) costs.driversAllowanceDescription = item.description;
                } else if (itemName.includes("hired") && itemName.includes("driver")) {
                  costs.hiredDrivers = item.amount || 0;
                  if (item.description) costs.hiredDriversDescription = item.description;
                } else if (itemName.includes("rent") || itemName.includes("vehicle") || itemName.includes("transport")) {
                  costs.rentVehicles = item.amount || 0;
                  if (item.description) costs.rentVehiclesDescription = item.description;
                } else if (itemName === "other") {
                  costs.otherAmount = item.amount || 0;
                  costs.otherLabel = item.description || item.item || "Other";
                } else if (itemName) {
                  if (!costs.otherItems) costs.otherItems = [];
                  costs.otherItems.push({
                    label: item.item || item.category || "Other",
                    amount: item.amount || 0,
                    description: item.description || ""
                  });
                }
              });
              
              return costs;
            };
            
            // Parse expense_breakdown if it's a string (JSONB from database)
            let expenseBreakdown = dbReq.expense_breakdown;
            if (typeof expenseBreakdown === "string") {
              try {
                expenseBreakdown = JSON.parse(expenseBreakdown);
              } catch (e) {
                console.warn("[RequestWizard] Failed to parse expense_breakdown:", e);
                expenseBreakdown = [];
              }
            }
            
            const costs = Array.isArray(expenseBreakdown) 
              ? transformExpenseBreakdown(expenseBreakdown)
              : (dbReq.expense_breakdown || {});
            
            // Parse attachments from database (for store ID restore)
            let attachments2 = dbReq.attachments || [];
            if (typeof attachments2 === "string") {
              try {
                attachments2 = JSON.parse(attachments2);
              } catch (e) {
                console.warn("[RequestWizard] Failed to parse attachments:", e);
                attachments2 = [];
              }
            }
            console.log("[RequestWizard] Loaded attachments from store ID:", attachments2);
            
            // Transform database request to form data format
            const formData: any = {
              requesterRole: dbReq.requester_is_head ? "head" : "faculty",
              reason: dbReq.request_type === "seminar" ? "seminar" : "official",
              vehicleMode: dbReq.needs_rental ? "rent" : dbReq.needs_vehicle ? "institutional" : "owned",
              travelOrder: {
                date: dbReq.travel_start_date ? new Date(dbReq.travel_start_date).toISOString().split('T')[0] : "",
                requestingPerson: dbReq.requester_name || "",
                department: dbReq.department?.name || dbReq.department?.code || "",
                destination: dbReq.destination || "",
                departureDate: dbReq.travel_start_date ? new Date(dbReq.travel_start_date).toISOString().split('T')[0] : "",
                returnDate: dbReq.travel_end_date ? new Date(dbReq.travel_end_date).toISOString().split('T')[0] : "",
                purposeOfTravel: dbReq.purpose || "",
                costs: costs,
                // CRITICAL: Restore signatures from database
                requesterSignature: dbReq.requester_signature || null,
                endorsedByHeadName: dbReq.head_approver?.name || dbReq.head_approver?.email || "",
                endorsedByHeadDate: dbReq.head_approved_at ? new Date(dbReq.head_approved_at).toISOString().split('T')[0] : "",
                endorsedByHeadSignature: dbReq.head_signature || null,
                requesters: dbReq.requesters || [],
                // CRITICAL: Restore attachments from database
                attachments: attachments2,
              },
              // Restore seminar data if exists
              seminar: dbReq.seminar_details ? {
                ...dbReq.seminar_details,
                // CRITICAL: Restore seminar signature
                requesterSignature: dbReq.requester_signature || dbReq.seminar_details.requesterSignature || null,
                // CRITICAL: Restore attachments for seminar
                attachments: attachments2,
              } : undefined,
              schoolService: dbReq.school_service_details || undefined,
              transportation: dbReq.transportation || undefined,
            };
            
            hardSet(formData);
            // Store request metadata for Date of Filing display
            setRequestMetadata({
              createdAt: dbReq.created_at || null,
              requestNumber: dbReq.request_number || null,
              status: dbReq.status || null,
            });
            // Also save to localStorage draft for persistence
            await saveDraft(formData, currentDraftId || undefined);
            toast({ kind: "info", title: "Draft restored", message: "Form populated from saved draft with signatures." });
            did = true;
          }
        } catch (err: any) {
          console.error("[RequestWizard] Error loading request from store ID:", err);
        }
      }

      // 4) Autosave fallback
      if (!did) {
        const autosaved = loadAutosave();
        if (autosaved) {
          hardSet(autosaved);
          toast({ kind: "info", title: "Restored", message: "Unsaved form recovered." });
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

  // Pre-fill date field with today's date if empty
  React.useEffect(() => {
    if (!data.travelOrder?.date) {
      const today = new Date();
      const todayString = today.toISOString().slice(0, 10); // Format: YYYY-MM-DD
      patchTravelOrder({ date: todayString });
      console.log('[RequestWizard] ✅ Pre-filled date field with today:', todayString);
    }
  }, [data.travelOrder?.date, patchTravelOrder]);

  // Pre-fill endorsement date with today's date if empty AND NOT head requester
  React.useEffect(() => {
    if (!isHeadRequester && !data.travelOrder?.endorsedByHeadDate) {
      const today = new Date();
      const todayString = today.toISOString().slice(0, 10); // Format: YYYY-MM-DD
      patchTravelOrder({ endorsedByHeadDate: todayString });
      console.log('[RequestWizard] ✅ Pre-filled endorsement date with today:', todayString);
    }
  }, [data.travelOrder?.endorsedByHeadDate, isHeadRequester, patchTravelOrder]);

  // Pre-fill requesting person with current user's name - ALWAYS update when user loads
  // Also pre-fill department if requesting person is current user
  React.useEffect(() => {
    if (currentUser && currentUser.name && !userLoading) {
      // Only update if empty OR different from current user
      if (!data.travelOrder?.requestingPerson || data.travelOrder.requestingPerson !== currentUser.name) {
        patchTravelOrder({ requestingPerson: currentUser.name });
      }
      
      // Also pre-fill department if requesting person matches current user
      const requestingPersonMatches = !data.travelOrder?.requestingPerson || 
        data.travelOrder.requestingPerson === currentUser.name ||
        data.travelOrder.requestingPerson.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
      
      // Pre-fill department if requesting person matches current user
      // Also handle case where department is just a code (like "CCMS")
      const currentDept = data.travelOrder?.department || "";
      const needsPreFill = requestingPersonMatches && 
        (!currentDept || 
         currentDept.length <= 10 || 
         currentDept === currentUser.department ||
         (currentDept === "CCMS" && currentUser.department === "CCMS"));
      
      if (needsPreFill) {
        (async () => {
          try {
            let deptId = (currentUser as any).department_id;
            let dept: any = null;
            
            // If has department_id, fetch by ID
            if (deptId) {
              const deptResponse = await fetch(`/api/departments?id=${deptId}`);
              const deptData = await deptResponse.json();
              if (deptData.ok && deptData.departments?.[0]) {
                dept = deptData.departments[0];
              }
            }
            
            // If no department_id but has department text, look it up
            if (!dept && currentUser.department) {
              const deptText = currentUser.department.trim();
              let deptResponse;
              if (deptText.length <= 10 && deptText === deptText.toUpperCase()) {
                // Looks like a code
                deptResponse = await fetch(`/api/departments?code=${encodeURIComponent(deptText)}`);
              } else {
                deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(deptText)}`);
              }
              
              const deptData = await deptResponse.json();
              if (deptData.ok && deptData.departments?.[0]) {
                dept = deptData.departments[0];
                deptId = dept.id;
              }
            }
            
            if (dept) {
              const deptFormatted = dept.code 
                ? `${dept.name} (${dept.code})`
                : dept.name;
              console.log('[RequestWizard] 🔄 Pre-filling department on initial load:', deptFormatted);
              
              // Also fetch department head
              let headName = "";
              if (deptId) {
                const headResponse = await fetch(`/api/approvers?role=head&department_id=${deptId}`);
                const headData = await headResponse.json();
                if (headData.ok && headData.data && headData.data.length > 0) {
                  headName = headData.data[0].name;
                }
              }
              
              patchTravelOrder({ 
                department: deptFormatted,
                ...(headName ? { endorsedByHeadName: headName } : {})
              });
              
              if (headName) {
                console.log('[RequestWizard] 🔄 Pre-filling department head on initial load:', headName);
              }
            }
          } catch (err) {
            console.warn('[RequestWizard] Failed to pre-fill department:', err);
          }
        })();
      }
    }
  }, [currentUser, userLoading]);

  // Clear any hardcoded/incorrect head names on load
  React.useEffect(() => {
    const currentHead = data.travelOrder?.endorsedByHeadName || "";
    if (currentHead && 
        (currentHead.includes("Engr. Maria") || 
         currentHead.includes("DeptHead") ||
         currentHead.includes("Dr. Aileen"))) {
      console.log('[RequestWizard] 🧹 Detected hardcoded head name, clearing:', currentHead);
      patchTravelOrder({ endorsedByHeadName: "" });
    }
  }, []); // Run once on mount

  // Check if requesting person is a head when requesting person or department changes
  React.useEffect(() => {
    console.log('[RequestWizard] 🔄 useEffect triggered');
    console.log('  - requestingPerson:', data.travelOrder?.requestingPerson);
    console.log('  - currentUser?.name:', currentUser?.name);
    console.log('  - userLoading:', userLoading);
    
    // For seminars, there's no separate "requesting person" - the submitter is the organizer
    // So seminars are never representative submissions
    if (data.reason === "seminar") {
      console.log('[RequestWizard] ✅ Seminar application - not a representative submission');
      setIsRepresentativeSubmission(false);
      
      // For seminars, requesting person is the current user (organizer)
      const isCurrentUserHead = currentUser?.role === "head" || (currentUser as any)?.is_head === true;
      setRequestingPersonIsHead(isCurrentUserHead);
      
      // Find department head for seminar organizer (current user)
      const findSeminarDepartmentHead = async () => {
        if (!currentUser || userLoading) {
          console.log('[RequestWizard] ⏳ Waiting for user to load...');
          return;
        }
        
        try {
          // Get current user's department ID
          const userResponse = await fetch("/api/profile");
          const userData = await userResponse.json();
          
          if (userData.ok && userData.data?.department_id) {
            const departmentId = userData.data.department_id;
            const departmentName = userData.data.department || "";
            
            console.log('[RequestWizard] 📍 Seminar organizer department:', {
              id: departmentId,
              name: departmentName
            });
            
            // If current user is NOT a head, find their department head
            if (!isCurrentUserHead && departmentId) {
              const headResponse = await fetch(`/api/approvers?role=head&department_id=${departmentId}`);
              const headData = await headResponse.json();
              
              if (headData.ok && headData.data && headData.data.length > 0) {
                const head = headData.data[0]; // Use first head if multiple
                console.log('[RequestWizard] ✅ Found department head for seminar:', head);
                setRequestingPersonHeadInfo({
                  name: head.name || "Department Head",
                  department: head.department || departmentName || "",
                });
              } else {
                console.warn('[RequestWizard] ⚠️ No department head found for seminar organizer');
                setRequestingPersonHeadInfo({
                  name: "Department Head",
                  department: departmentName || "",
                });
              }
            } else {
              // Current user is a head, no need to find department head
              setRequestingPersonHeadInfo(null);
            }
          } else {
            console.warn('[RequestWizard] ⚠️ Current user has no department assigned');
            setRequestingPersonHeadInfo(null);
          }
        } catch (error) {
          console.error('[RequestWizard] ❌ Failed to find department head for seminar:', error);
          setRequestingPersonHeadInfo(null);
        }
      };
      
      findSeminarDepartmentHead();
      return;
    }
    
    const checkRequestingPerson = async () => {
      const requestingPerson = data.travelOrder?.requestingPerson;
      
      // Prevent concurrent calls
      if (checkingRequestingPersonRef.current) {
        console.log('[RequestWizard] ⏭️ Already checking requesting person, skipping...');
        return;
      }
      
      // Skip if we already checked this requesting person
      if (requestingPerson && requestingPerson.trim() === lastCheckedRequestingPersonRef.current) {
        console.log('[RequestWizard] ⏭️ Already checked this requesting person, skipping...');
        return;
      }
      
      if (!requestingPerson || requestingPerson.trim() === "") {
        console.log('[RequestWizard] ⚠️ No requesting person, setting to false');
        setRequestingPersonIsHead(null);
        setRequestingPersonHeadInfo(null);
        setRequestingPersonInfo(null);
        setIsRepresentativeSubmission(false);
        lastCheckedRequestingPersonRef.current = "";
        return;
      }
      
      // Mark as checking
      checkingRequestingPersonRef.current = true;
      lastCheckedRequestingPersonRef.current = requestingPerson.trim();

      try {
        // CRITICAL: First check if requesting person is the current user
        // If it is, use current user's department (CCMS), not search for another user
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
                ...(currentUserData.data.department_id && { department_id: currentUserData.data.department_id }),
                ...(currentUserData.data.is_head !== undefined && { is_head: currentUserData.data.is_head }),
                ...(currentUserData.data.isHead !== undefined && { isHead: currentUserData.data.isHead }),
              } as any;
              console.log('[RequestWizard] Fetched current user from API:', actualCurrentUser);
            }
          } catch (error) {
            console.warn('[RequestWizard] Failed to fetch current user from API:', error);
          }
        }
        
        // Check if requesting person matches current user (by name, case-insensitive)
        const requestingPersonNormalized = requestingPerson.trim().toLowerCase();
        const currentUserNameNormalized = actualCurrentUser?.name?.trim().toLowerCase() || "";
        // Check if names match (case-insensitive)
        const namesMatch = actualCurrentUser?.name && 
          currentUserNameNormalized === requestingPersonNormalized;
        
        const isCurrentUser = actualCurrentUser && namesMatch;
        
        console.log('[RequestWizard] 🔍 Checking if requesting person is current user:');
        console.log('  - Requesting person:', requestingPerson);
        console.log('  - Requesting person (normalized):', requestingPersonNormalized);
        console.log('  - Current user name:', actualCurrentUser?.name);
        console.log('  - Current user name (normalized):', currentUserNameNormalized);
        console.log('  - Names match?', namesMatch);
        console.log('  - Is current user?', isCurrentUser);
        
        // If it's the current user, use their department directly
        if (isCurrentUser && actualCurrentUser) {
          console.log('[RequestWizard] ✅ Requesting person IS current user - using current user\'s department');
          
          // Get department name in correct format
          let requesterDepartment = "";
          let dept: any = null;
          let finalDepartmentId = (actualCurrentUser as any).department_id;
          
          if ((actualCurrentUser as any).department_id) {
            // Has department_id - fetch full department info
            try {
              const deptResponse = await fetch(`/api/departments?id=${(actualCurrentUser as any).department_id}`);
              const deptData = await deptResponse.json();
              if (deptData.ok && deptData.departments?.[0]) {
                dept = deptData.departments[0];
                requesterDepartment = dept.code 
                  ? `${dept.name} (${dept.code})`
                  : dept.name;
                finalDepartmentId = dept.id;
                console.log('[RequestWizard] ✅ Fetched current user\'s department:', requesterDepartment);
              }
            } catch (deptErr) {
              console.error('[RequestWizard] ❌ Failed to fetch current user\'s department:', deptErr);
            }
          }
          
          // If no department_id but has department text (like "CCMS"), look it up
          if (!finalDepartmentId && actualCurrentUser.department) {
            const deptText = actualCurrentUser.department.trim();
            console.log('[RequestWizard] 🔍 No department_id, looking up by text:', deptText);
            
            try {
              // Try to find by code first (if it's just a code like "CCMS")
              let deptResponse;
              if (deptText.length <= 10 && deptText === deptText.toUpperCase()) {
                // Looks like a code
                deptResponse = await fetch(`/api/departments?code=${encodeURIComponent(deptText)}`);
              } else {
                // Try by name
                deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(deptText)}`);
              }
              
              const deptData = await deptResponse.json();
              if (deptData.ok && deptData.departments?.[0]) {
                dept = deptData.departments[0];
                requesterDepartment = dept.code 
                  ? `${dept.name} (${dept.code})`
                  : dept.name;
                finalDepartmentId = dept.id;
                console.log('[RequestWizard] ✅ Found department by lookup:', requesterDepartment, 'ID:', finalDepartmentId);
              } else {
                // Fallback to original text
                requesterDepartment = deptText;
                console.warn('[RequestWizard] ⚠️ Department not found in database, using text:', deptText);
              }
            } catch (deptErr) {
              console.error('[RequestWizard] ❌ Failed to lookup department:', deptErr);
              requesterDepartment = deptText;
            }
          }
          
          // If still no department, use empty string
          if (!requesterDepartment) {
            console.warn('[RequestWizard] ⚠️ No department found for current user');
          }
          
          // Store requesting person info (current user)
          setRequestingPersonInfo({
            id: actualCurrentUser.id,
            name: actualCurrentUser.name || requestingPerson,
            department: requesterDepartment,
            departmentId: finalDepartmentId || (actualCurrentUser as any).department_id || "",
          });
          
          // Check if current user is a head
          // Check both role and is_head flag to be thorough
          const isHead = actualCurrentUser.role === "head" || 
                        (actualCurrentUser as any).is_head === true ||
                        (actualCurrentUser as any).isHead === true;
          console.log('[RequestWizard] 🔍 Checking if current user is head:', {
            role: actualCurrentUser.role,
            is_head: (actualCurrentUser as any).is_head,
            isHead: (actualCurrentUser as any).isHead,
            finalIsHead: isHead
          });
          // CRITICAL: Set requestingPersonIsHead to true if current user is a head
          // This ensures isHeadRequester is calculated correctly
          setRequestingPersonIsHead(isHead);
          setIsRepresentativeSubmission(false); // Not representative if it's the current user
          
          // If current user IS a head, check for parent head (SVP)
          // Head should see their parent head (e.g., CCMS head → SVP Academics)
          if (isHead) {
            console.log('[RequestWizard] 🔍 Current user is a head - checking for parent head');
            
            // Check if department has a parent
            if (finalDepartmentId) {
              try {
                // Fetch department info to check for parent_department_id
                const deptResponse = await fetch(`/api/departments?id=${finalDepartmentId}`);
                const deptData = await deptResponse.json();
                
                if (deptData.ok && deptData.departments?.[0]) {
                  const dept = deptData.departments[0];
                  console.log('[RequestWizard] 📋 Department info:', {
                    name: dept.name,
                    code: dept.code,
                    parent_department_id: dept.parent_department_id
                  });
                  
                  // If department has a parent, fetch parent head (SVP)
                  if (dept.parent_department_id) {
                    console.log('[RequestWizard] 🔍 Department has parent - fetching parent head (SVP)');
                    const parentHeadResponse = await fetch(`/api/approvers?role=head&department_id=${dept.parent_department_id}`);
                    const parentHeadData = await parentHeadResponse.json();
                    
                    if (parentHeadData.ok && parentHeadData.data && parentHeadData.data.length > 0) {
                      const parentHead = parentHeadData.data[0];
                      const parentHeadName = parentHead.name || "Parent Department Head";
                      console.log('[RequestWizard] ✅ Found parent head (SVP):', parentHeadName);
                      
                      setRequestingPersonHeadInfo({
                        name: parentHeadName,
                        department: parentHead.department?.name || dept.name || requesterDepartment || "",
                      });
                      
                      // Auto-populate parent head name in the form
                      if (parentHeadName && parentHeadName !== "Parent Department Head") {
                        console.log('[RequestWizard] 🔄 Auto-populating parent head name (SVP):', parentHeadName);
                        patchTravelOrder({ endorsedByHeadName: parentHeadName });
                      } else {
                        patchTravelOrder({ endorsedByHeadName: "" });
                      }
                    } else {
                      console.warn('[RequestWizard] ⚠️ No parent head found for parent_department_id:', dept.parent_department_id);
                      patchTravelOrder({ endorsedByHeadName: "" });
                      setRequestingPersonHeadInfo(null);
                    }
                  } else {
                    // No parent department - head is top-level, they choose who to send to
                    console.log('[RequestWizard] ℹ️ No parent department - head is top-level, will choose approver');
                    patchTravelOrder({ endorsedByHeadName: "" });
                    setRequestingPersonHeadInfo(null);
                  }
                } else {
                  console.warn('[RequestWizard] ⚠️ Could not fetch department info');
                  patchTravelOrder({ endorsedByHeadName: "" });
                  setRequestingPersonHeadInfo(null);
                }
              } catch (error) {
                console.error('[RequestWizard] ❌ Error fetching parent head:', error);
                patchTravelOrder({ endorsedByHeadName: "" });
                setRequestingPersonHeadInfo(null);
              }
            } else {
              // No department_id - can't determine parent
              console.warn('[RequestWizard] ⚠️ No department_id - cannot determine parent head');
              patchTravelOrder({ endorsedByHeadName: "" });
              setRequestingPersonHeadInfo(null);
            }
          }
          
          // Auto-populate department to current user's department
          // Only update if department is different or missing
          const currentDept = data.travelOrder?.department || "";
          const needsUpdate = !currentDept || 
            currentDept.trim() !== requesterDepartment.trim() ||
            (currentDept.length <= 10 && currentDept === dept?.code); // If it's just a code like "CCMS"
          
          if (requesterDepartment && needsUpdate) {
            console.log('[RequestWizard] 🔄 Auto-populating department to current user\'s department:', requesterDepartment);
            console.log('[RequestWizard]   - Current department in form:', currentDept);
            console.log('[RequestWizard]   - Will update to:', requesterDepartment);
            // Update the department field only if needed
            patchTravelOrder({ department: requesterDepartment });
          } else if (requesterDepartment && !needsUpdate) {
            console.log('[RequestWizard] ✅ Department already correct, skipping update:', currentDept);
          } else {
            console.warn('[RequestWizard] ⚠️ No department found for current user:', actualCurrentUser);
          }
          
          // If current user is NOT a head AND requesting person is NOT a head, find their department head
          // Use finalDepartmentId (which may have been looked up)
          // IMPORTANT: Don't auto-fill if head is the requester - they will choose who to send to
          if (!isHead && !isHeadRequester && finalDepartmentId) {
            console.log('[RequestWizard] 🔍 Fetching department head for department_id:', finalDepartmentId);
            const headResponse = await fetch(`/api/approvers?role=head&department_id=${finalDepartmentId}`);
            const headData = await headResponse.json();
            if (headData.ok && headData.data && headData.data.length > 0) {
              const head = headData.data[0];
              const headName = head.name || "Department Head";
              console.log('[RequestWizard] ✅ Found department head:', headName);
              setRequestingPersonHeadInfo({
                name: headName,
                department: head.department || requesterDepartment || "",
              });
              
              // Auto-populate department head name in the form
              // Always update, even if it's already set, to ensure it's the correct head from database
              if (headName && headName !== "Department Head") {
                console.log('[RequestWizard] 🔄 Auto-populating department head name:', headName);
                console.log('[RequestWizard]   - Current head in form:', data.travelOrder?.endorsedByHeadName);
                console.log('[RequestWizard]   - Will update to:', headName);
                patchTravelOrder({ endorsedByHeadName: headName });
              } else {
                // Clear any incorrect hardcoded values
                if (data.travelOrder?.endorsedByHeadName && 
                    (data.travelOrder.endorsedByHeadName.includes("Engr. Maria") || 
                     data.travelOrder.endorsedByHeadName.includes("DeptHead"))) {
                  console.log('[RequestWizard] 🧹 Clearing incorrect hardcoded head name');
                  patchTravelOrder({ endorsedByHeadName: "" });
                }
              }
            } else {
              console.warn('[RequestWizard] ⚠️ No department head found for department_id:', finalDepartmentId);
              console.warn('[RequestWizard] 🔍 DEBUG - API Response:', {
                ok: headData.ok,
                error: headData.error,
                dataLength: headData.data?.length || 0,
                data: headData.data
              });
              
              // No head found - allow manual entry
              // Don't set a placeholder name, let the user enter it manually
              setRequestingPersonHeadInfo({
                name: "", // Empty so user can enter manually
                department: requesterDepartment || "",
              });
              // Clear any incorrect hardcoded values if no head found
              if (data.travelOrder?.endorsedByHeadName && 
                  (data.travelOrder.endorsedByHeadName.includes("Engr. Maria") || 
                   data.travelOrder.endorsedByHeadName.includes("DeptHead"))) {
                console.log('[RequestWizard] 🧹 Clearing incorrect hardcoded head name (no head found)');
                patchTravelOrder({ endorsedByHeadName: "" });
              }
            }
          } else {
            if (isHead || isHeadRequester) {
              // If current user IS a head OR requesting person is a head, clear head endorsement field
              // Head should choose who to send to (parent head, admin, VP, etc.)
              console.log('[RequestWizard] 🧹 Head is requester - clearing head endorsement field');
              console.log('[RequestWizard]   - isHead:', isHead);
              console.log('[RequestWizard]   - isHeadRequester:', isHeadRequester);
              console.log('[RequestWizard]   - Current head in form:', data.travelOrder?.endorsedByHeadName);
              patchTravelOrder({ endorsedByHeadName: "" });
              setRequestingPersonHeadInfo(null);
            } else {
              console.warn('[RequestWizard] ⚠️ Cannot fetch department head - no department_id available');
              setRequestingPersonHeadInfo(null);
            }
          }
          
          return; // Exit early - we're done
        }
        
        // If NOT current user, search for the user in database
        console.log('[RequestWizard] 🔍 Requesting person is NOT current user - searching in database');
        
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
          
          // Get department name - use from API response if available, otherwise fetch it
          let requesterDepartment = result.user.department || "";
          console.log('[RequestWizard] 🔍 Checking department:', {
            fromAPI: result.user.department,
            department_id: result.user.department_id
          });
          
          // If department not in response but department_id exists, fetch it
          if (!requesterDepartment && result.user.department_id) {
            try {
              console.log('[RequestWizard] 📡 Fetching department from API...');
              const deptResponse = await fetch(`/api/departments?id=${result.user.department_id}`);
              const deptData = await deptResponse.json();
              console.log('[RequestWizard] 📡 Department API response:', deptData);
              if (deptData.ok && deptData.departments?.[0]) {
                // Format: "Name (CODE)" to match DepartmentSelect format
                const dept = deptData.departments[0];
                requesterDepartment = dept.code 
                  ? `${dept.name} (${dept.code})`
                  : dept.name;
                console.log('[RequestWizard] ✅ Fetched department:', requesterDepartment);
              } else {
                console.warn('[RequestWizard] ⚠️ Department not found in API response:', deptData);
              }
            } catch (deptErr) {
              console.error('[RequestWizard] ❌ Failed to fetch department:', deptErr);
            }
          }
          
          if (!requesterDepartment) {
            console.warn('[RequestWizard] ⚠️ Requesting person has no department assigned:', result.user);
          } else {
            console.log('[RequestWizard] ✅ Using department:', requesterDepartment);
          }
          
          // Store requesting person info - ALWAYS use requester's department
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
                  ...(currentUserData.data.department_id && { department_id: currentUserData.data.department_id }),
                  ...(currentUserData.data.is_head !== undefined && { is_head: currentUserData.data.is_head }),
                  ...(currentUserData.data.isHead !== undefined && { isHead: currentUserData.data.isHead }),
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

          // Update department to requesting person's department (requester's department)
          // Only update if department is different or missing to prevent infinite loops
          const currentDept = data.travelOrder?.department || "";
          const needsUpdate = !currentDept || currentDept.trim() !== requesterDepartment.trim();
          
          if (requesterDepartment && needsUpdate) {
            console.log('[RequestWizard] 🔄 Auto-populating department to requester\'s department:', requesterDepartment);
            console.log('[RequestWizard]   - Current department in form:', currentDept);
            patchTravelOrder({ department: requesterDepartment });
          } else if (requesterDepartment && !needsUpdate) {
            console.log('[RequestWizard] ✅ Department already correct, skipping update:', currentDept);
          } else {
            console.warn('[RequestWizard] ⚠️ Requesting person has no department assigned');
          }
          
          // If requesting person is NOT a head, find their department head (requester's department head)
          if (!result.isHead && result.user?.department_id) {
            const headResponse = await fetch(`/api/approvers?role=head&department_id=${result.user.department_id}`);
            const headData = await headResponse.json();
            if (headData.ok && headData.data && headData.data.length > 0) {
              const head = headData.data[0]; // Use first head if multiple
              const headName = head.name || "Department Head";
              setRequestingPersonHeadInfo({
                name: headName,
                department: head.department || requesterDepartment || "",
              });
              
              // Auto-populate department head name in the form
              if (headName && headName !== "Department Head") {
                console.log('[RequestWizard] 🔄 Auto-populating department head name for requester:', headName);
                patchTravelOrder({ endorsedByHeadName: headName });
              }
            } else {
              setRequestingPersonHeadInfo({
                name: "Department Head",
                department: requesterDepartment || "",
              });
            }
          } else if (result.isHead) {
            // If requesting person IS a head, DO NOT auto-fill endorsement
            // Head should choose who to send to (parent head, admin, VP, etc.) manually
            console.log('[RequestWizard] 🧹 Requester is a head - clearing head endorsement field');
            console.log('[RequestWizard] ℹ️ Head will choose who to send to when submitting');
            patchTravelOrder({ endorsedByHeadName: "" });
            setRequestingPersonHeadInfo(null);
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
                  ...(currentUserData.data.department_id && { department_id: currentUserData.data.department_id }),
                  ...(currentUserData.data.is_head !== undefined && { is_head: currentUserData.data.is_head }),
                  ...(currentUserData.data.isHead !== undefined && { isHead: currentUserData.data.isHead }),
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
        // Reset ref on error so we can retry
        lastCheckedRequestingPersonRef.current = "";
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
                ...(currentUserData.data.department_id && { department_id: currentUserData.data.department_id }),
                ...(currentUserData.data.is_head !== undefined && { is_head: currentUserData.data.is_head }),
                ...(currentUserData.data.isHead !== undefined && { isHead: currentUserData.data.isHead }),
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
        // Reset ref on error so we can retry
        lastCheckedRequestingPersonRef.current = "";
      } finally {
        // Always reset checking flag
        checkingRequestingPersonRef.current = false;
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
    // CRITICAL: Don't include data.travelOrder?.department in dependencies to prevent infinite loop
    // The department is auto-populated by this function, so including it causes re-triggers
    if (data.travelOrder?.requestingPerson) {
      console.log('[RequestWizard] ✅ Requesting person available, running check...');
      checkRequestingPerson();
    } else {
      console.log('[RequestWizard] ⚠️ No requesting person, setting to false');
      setIsRepresentativeSubmission(false);
    }
  }, [data.travelOrder?.requestingPerson, currentUser?.id, currentUser?.name, userLoading, data.reason]);

  // autosave on change (debounced)
  React.useEffect(() => {
    const id = setTimeout(() => saveAutosave(data), 400);
    return () => clearTimeout(id);
  }, [data]);

  function afterSuccessfulSubmitReset() {
    // Clear request metadata when resetting
    setRequestMetadata(null);
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
        // Clear all signatures when resetting
        requesterSignature: "",
        endorsedByHeadName: "",
        endorsedByHeadDate: "",
        endorsedByHeadSignature: "",
        // Clear requesters array when resetting
        requesters: undefined,
      },
      schoolService: undefined,
      seminar: undefined,
      transportation: undefined,
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

  // Auto-save function for invitations (silent, returns requestId)
  async function handleAutoSaveRequest(): Promise<string | null> {
    try {
      // Save to database to get a real request ID (for invitations)
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

      if (!response.ok || !result.ok) {
        console.error("[handleAutoSaveRequest] API error:", result);
        console.error("[handleAutoSaveRequest] Response status:", response.status);
        console.error("[handleAutoSaveRequest] Response headers:", Object.fromEntries(response.headers.entries()));
        
        // If unauthorized, try to refresh session or show helpful message
        if (response.status === 401) {
          console.error("[handleAutoSaveRequest] ⚠️ Unauthorized - Session may have expired");
          // Don't throw error for auto-save - just log it
          // The user can manually save later
          return null;
        }
        
        throw new Error(result.error || result.message || "Failed to save draft");
      }

      // Store the request ID in the form data (for invitations)
      if (result.data?.id) {
        if (data.reason === "seminar") {
          patchSeminar({ requestId: result.data.id } as any);
        }
        setCurrentSubmissionId(result.data.id);
        
        // CRITICAL: Also save to localStorage draft with latest data (including signatures)
        // This ensures signatures persist even if database load fails
        try {
          await saveDraft(data, currentDraftId || undefined);
          console.log("[handleAutoSaveRequest] ✅ Saved to localStorage draft with signatures");
        } catch (draftErr) {
          console.warn("[handleAutoSaveRequest] ⚠️ Failed to save to localStorage draft:", draftErr);
        }
        
        return result.data.id;
      }

      return null;
    } catch (err: any) {
      console.error("[handleAutoSaveRequest] Error saving draft:", err);
      throw err;
    }
  }

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

      if (!response.ok || !result.ok) {
        console.error("[handleSaveDraft] API error:", result);
        console.error("[handleSaveDraft] Response status:", response.status);
        console.error("[handleSaveDraft] Response body:", result);
        const errorMessage = result.error || result.message || `Failed to save draft (Status: ${response.status})`;
        throw new Error(errorMessage);
      }

      // Store the request ID in the form data (for invitations)
      if (result.data?.id) {
        if (data.reason === "seminar") {
          patchSeminar({ requestId: result.data.id } as any);
        }
        setCurrentSubmissionId(result.data.id);
      }

      // CRITICAL: Save to localStorage for draft management (includes signatures)
      // This ensures signatures persist even after page reload
      const res = await saveDraft(data, currentDraftId || undefined);
      if (!currentDraftId) setCurrentDraftId(res.id);
      console.log("[handleSaveDraft] ✅ Saved draft to localStorage with signatures:", {
        hasRequesterSignature: !!data.travelOrder?.requesterSignature,
        hasHeadSignature: !!data.travelOrder?.endorsedByHeadSignature,
        hasSeminarSignature: !!data.seminar?.requesterSignature,
      });
      toast({ kind: "success", title: "Draft saved", message: "Your draft has been saved." });
    } catch (err: any) {
      console.error("[handleSaveDraft] Error saving draft:", err);
      const errorMessage = err.message || "Could not save draft.";
      toast({ kind: "error", title: "Save failed", message: errorMessage });
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
  
  // Track confirmation status for requesters and participants
  const [allRequestersConfirmed, setAllRequestersConfirmed] = React.useState<boolean | undefined>(undefined);
  const [allHeadEndorsementsConfirmed, setAllHeadEndorsementsConfirmed] = React.useState<boolean | undefined>(undefined);
  const [allParticipantsConfirmed, setAllParticipantsConfirmed] = React.useState<boolean | undefined>(undefined);

  // Check if this is a returned request that needs resubmission
  const isReturnedRequest = requestMetadata?.status === "returned";

  // Handle resubmit for returned requests
  async function handleResubmit() {
    if (!currentSubmissionId) {
      toast({ kind: "error", title: "Error", message: "No request ID found for resubmission." });
      return;
    }

    setSubmitting(true);
    try {
      // First, save any edits to the request using PATCH
      // Include all editable fields including attachments
      const updateRes = await fetch(`/api/requests/${currentSubmissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: data.travelOrder?.purposeOfTravel || data.seminar?.title,
          destination: data.travelOrder?.destination || data.seminar?.venue,
          travel_start_date: data.travelOrder?.departureDate || data.seminar?.dateFrom,
          travel_end_date: data.travelOrder?.returnDate || data.seminar?.dateTo,
          // Include attachments from form data
          attachments: (data.travelOrder as any)?.attachments || (data.seminar as any)?.attachments || [],
        }),
      });

      if (!updateRes.ok) {
        // Try to parse error response, but handle empty body
        let errorMessage = "Failed to save changes";
        try {
          const updateResult = await updateRes.json();
          errorMessage = updateResult.error || errorMessage;
        } catch {
          // Response body might be empty or not JSON
          errorMessage = `Failed to save changes (HTTP ${updateRes.status})`;
        }
        throw new Error(errorMessage);
      }

      // Then resubmit
      const res = await fetch(`/api/requests/${currentSubmissionId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Handle potential empty response body
      let result;
      try {
        result = await res.json();
      } catch {
        // If JSON parsing fails, check if request was successful
        if (res.ok) {
          result = { ok: true, data: { message: "Request resubmitted successfully" } };
        } else {
          throw new Error(`Resubmit failed (HTTP ${res.status})`);
        }
      }

      if (result.ok) {
        toast({ 
          kind: "success", 
          title: "Request Resubmitted", 
          message: result.data?.message || "Your request has been resubmitted for review." 
        });
        // Clear form and redirect to role-aware submissions page
        clearIds();
        window.location.href = getSubmissionsPath();
      } else {
        throw new Error(result.error || "Failed to resubmit request");
      }
    } catch (err: any) {
      console.error("[RequestWizard] Resubmit error:", err);
      toast({ kind: "error", title: "Resubmit Failed", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    // library validation
    console.log('[RequestWizard] 🚀 handleSubmit called');
    console.log('  - isRepresentativeSubmission state:', isRepresentativeSubmission);
    console.log('  - requestingPerson:', data.travelOrder?.requestingPerson);
    console.log('  - currentUser?.name:', currentUser?.name);
    console.log('  - isHeadRequester:', isHeadRequester);
    const v = canSubmit(data, { 
      isRepresentativeSubmission,
      isHeadRequester,
      currentUserName: currentUser?.name,
      requestingPersonName: data.travelOrder?.requestingPerson,
    });
    console.log('  - Validation result:', { ok: v.ok, errors: Object.keys(v.errors) });

    const mergedErrors = { ...v.errors };
    setErrors(mergedErrors);

    const ok = v.ok;
    if (!ok) {
      scrollToFirstError(mergedErrors);
      toast({ kind: "error", title: "Cannot submit", message: "Please complete required fields." });
      return;
    }

    // For head requesters: show approver selection modal (messenger-style)
    if (isHeadRequester) {
      console.log('[RequestWizard] 🎯 Head requester - showing approver selection');
      setLoadingApprovers(true);
      
      try {
        // Fetch ALL available approvers: VPs, admins, parent head (if exists)
        const [vpRes, adminRes, parentHeadRes] = await Promise.all([
          fetch('/api/approvers/list?role=vp').catch(() => ({ ok: false, data: [] })),
          fetch('/api/approvers/list?role=admin').catch(() => ({ ok: false, data: [] })),
          // Check if department has parent head
          data.travelOrder?.department ? fetch(`/api/departments?name=${encodeURIComponent(data.travelOrder.department)}`)
            .then(async r => {
              if (!r.ok) return { ok: false, data: [] };
              const contentType = r.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) return { ok: false, data: [] };
              return r.json();
            })
            .catch(() => ({ ok: false, data: [] })) : Promise.resolve({ ok: false, data: [] })
        ]);
        
        const options: any[] = [];
        
        // Add ALL VPs (not just parent head)
        let vpData: any = { ok: false, data: [] };
        if (vpRes && typeof vpRes === 'object' && 'ok' in vpRes && vpRes.ok && 'headers' in vpRes) {
          const contentType = (vpRes as Response).headers?.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              vpData = await (vpRes as Response).json();
            } catch (e) {
              console.warn("[RequestWizard] Failed to parse VP data:", e);
            }
          }
        }
        if (vpData.ok && vpData.data && vpData.data.length > 0) {
          options.push(...vpData.data.map((vp: any) => ({
            ...vp,
            role: 'vp',
            roleLabel: vp.roleLabel || 'Vice President'
          })));
          console.log('[RequestWizard] ✅ Found VPs:', vpData.data.length);
        }
        
        // Add parent head if department has parent (as a separate option, labeled as parent head)
        if (parentHeadRes.ok && parentHeadRes.data?.[0]?.parent_department_id) {
          const dept = parentHeadRes.data[0];
          const parentHeadListRes = await fetch(`/api/approvers/list?role=head`)
            .then(async r => {
              if (!r.ok) return { ok: false, data: [] };
              const contentType = r.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) return { ok: false, data: [] };
              return r.json();
            })
            .catch(() => ({ ok: false, data: [] }));
          
          if (parentHeadListRes.ok && parentHeadListRes.data) {
            const parentHeads = parentHeadListRes.data
              .filter((h: any) => h.department_id === dept.parent_department_id)
              .map((h: any) => ({
                ...h,
                role: 'head',
                roleLabel: 'Parent Department Head (VP)'
              }));
            
            // Only add if not already in VPs list
            parentHeads.forEach((ph: any) => {
              if (!options.some(opt => opt.id === ph.id)) {
                options.push(ph);
              }
            });
          }
        }
        
        // Add admin options
        let adminData: any = { ok: false, data: [] };
        if (adminRes && typeof adminRes === 'object' && 'ok' in adminRes && adminRes.ok && 'json' in adminRes) {
          try {
            adminData = await (adminRes as Response).json();
          } catch (e) {
            console.warn("[RequestWizard] Failed to parse admin data:", e);
          }
        }
        if (adminData.ok && adminData.data && adminData.data.length > 0) {
          options.push(...adminData.data.map((a: any) => ({
            ...a,
            role: 'admin',
            roleLabel: 'Administrator'
          })));
          
          // Find Ma'am TM as default (prefer trizzia.casino@mseuf.edu.ph)
          const maamTM = adminData.data.find((a: any) => 
            a.email === 'trizzia.casino@mseuf.edu.ph'
          ) || adminData.data.find((a: any) => 
            a.name?.toLowerCase().includes('trizzia') || 
            a.email?.toLowerCase().includes('trizzia')
          );
          
          if (maamTM) {
            setDefaultApproverId(maamTM.id);
            setDefaultApproverName(maamTM.name);
          }
          
          console.log('[RequestWizard] ✅ Found admins:', adminData.data.length);
        }
        
        console.log('[RequestWizard] ✅ Total approvers found:', options.length);
        setApproverOptions(options);
        setLoadingApprovers(false);
        setShowApproverSelection(true);
        return;
      } catch (err) {
        console.error('[RequestWizard] Error fetching approvers:', err);
        setLoadingApprovers(false);
        // Fallback: show confirmation dialog
        setShowConfirmDialog(true);
      }
    }

    // For non-head requesters: show confirmation dialog
    setShowConfirmDialog(true);
  }
  
  // Handle approver selection and proceed with submission
  const handleApproverSelected = (approverId: string | string[], approverRole: string | string[], returnReason?: string) => {
    // Handle single selection (arrays are for multiple selection which we don't support here)
    const id = Array.isArray(approverId) ? approverId[0] : approverId;
    const role = Array.isArray(approverRole) ? approverRole[0] : approverRole;
    
    console.log('[RequestWizard] ✅ Approver selected:', { approverId: id, approverRole: role, returnReason });
    // Find the approver name from approverOptions
    const selectedApprover = approverOptions.find(opt => opt.id === id);
    const approverName = selectedApprover?.name || selectedApprover?.email || null;
    
    setSelectedApproverId(id);
    setSelectedApproverRole(role);
    setSelectedApproverName(approverName);
    setShowApproverSelection(false);
    // Now show confirmation dialog with selected approver info
    setShowConfirmDialog(true);
  };

  async function handleConfirmedSubmit() {
    setShowConfirmDialog(false);
    setSubmitting(true);
    try {
      // Call real API
      console.log("[Submit] Full form data:", data);
      console.log("[Submit] School Service:", data.schoolService);
      console.log("[Submit] 🔍 DEBUG - travelOrder signature fields:", {
        hasEndorsedByHeadSignature: !!(data.travelOrder as any)?.endorsedByHeadSignature,
        hasRequesterSignature: !!(data.travelOrder as any)?.requesterSignature,
        endorsedByHeadSignatureLength: (data.travelOrder as any)?.endorsedByHeadSignature ? (data.travelOrder as any).endorsedByHeadSignature.length : 0,
        requesterSignatureLength: (data.travelOrder as any)?.requesterSignature ? (data.travelOrder as any).requesterSignature.length : 0,
        isHeadRequester,
        travelOrderKeys: Object.keys(data.travelOrder || {}).filter((k: string) => k.toLowerCase().includes('signature'))
      });
      
      // Debug: Log costs data before submit
      console.log('[RequestWizard] 💰 COSTS DEBUG before submit:');
      console.log('[RequestWizard] 💰 data.travelOrder.costs:', JSON.stringify(data.travelOrder?.costs, null, 2));
      console.log('[RequestWizard] 💰 costs keys:', Object.keys(data.travelOrder?.costs || {}));
      console.log('[RequestWizard] 💰 food value:', data.travelOrder?.costs?.food);
      
      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelOrder: data.travelOrder,
          reason: data.reason,
          vehicleMode: data.vehicleMode,
          schoolService: data.schoolService,
          seminar: data.seminar,
          transportation: data.transportation, // Include transportation data
          attachments: (data.travelOrder as any)?.attachments || (data.seminar as any)?.attachments || [], // Include attachments
          // Pass selected approver for head requesters (messenger-style routing)
          nextApproverId: selectedApproverId || undefined,
          nextApproverRole: selectedApproverRole || undefined,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to submit");
      }

      // Show success modal
      setSubmittedData(result.data);
      setShowSuccessModal(true);
      
      // Store request metadata for Date of Filing display
      if (result.data) {
        setRequestMetadata({
          createdAt: result.data.created_at || null,
          requestNumber: result.data.request_number || null,
          status: result.data.status || null,
        });
      }
      
      // Store request ID for participant invitations (if seminar)
      // This allows sending invitations even after submission
      // Always reset form after successful submission (data is persisted in database)
      if (data.reason === "seminar" && result.data?.id) {
        // Update seminar data with request ID so invitations can be sent
        patchSeminar({ requestId: result.data.id, isSubmitted: true } as any);
      }
      
      // For travel orders: Check if multiple departments (head endorsements will be sent)
      const requesters = Array.isArray(data.travelOrder?.requesters) ? data.travelOrder.requesters : [];
      const departments = requesters
        .map((req: any) => req.department)
        .filter((dept: any): dept is string => !!dept && dept.trim() !== "");
      const uniqueDepartments = Array.from(new Set(departments.map((dept: string) => dept.trim())));
      const hasMultipleDepts = uniqueDepartments.length > 1;
      
      if (hasMultipleDepts) {
        toast({ 
          kind: "success", 
          title: "Request submitted successfully", 
          message: `Head endorsement emails are being sent automatically to ${uniqueDepartments.length} department head(s). Check the "Head Endorsements" section below to track their status.` 
        });
      }
      
      // Always reset form after successful submission
      afterSuccessfulSubmitReset();
    } catch (err: any) {
      toast({ kind: "error", title: "Submit failed", message: err.message || "Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const hasBudget = computeTotalBudget(data.travelOrder?.costs) > 0;
  const needsVehicle = data.vehicleMode === "institutional" || data.vehicleMode === "rent";
  
  // If head requester selected an approver, use that role instead of default routing
  let firstHop: string;
  if (isHeadRequester && selectedApproverRole) {
    // Map selected approver role to routing role
    if (selectedApproverRole === 'admin') {
      firstHop = "TM"; // Admin = Transportation Manager
    } else if (selectedApproverRole === 'vp') {
      firstHop = "VP"; // VP
    } else if (selectedApproverRole === 'head') {
      firstHop = "DEPT_HEAD"; // Parent head
    } else {
      // Fallback to default
      firstHop = firstReceiver({
        requesterRole: data.requesterRole,
        vehicleMode: data.vehicleMode,
        reason: data.reason,
        hasBudget,
      });
    }
  } else {
    // Use default routing for non-head requesters or when no approver selected yet
    firstHop = firstReceiver({
      requesterRole: data.requesterRole,
      vehicleMode: data.vehicleMode,
      reason: data.reason,
      hasBudget,
    });
  }
  // Check if all requesters are confirmed (for travel orders with multiple requesters)
  const hasMultipleRequesters = Array.isArray(data.travelOrder?.requesters) && data.travelOrder.requesters.length > 1;
  const requesters = Array.isArray(data.travelOrder?.requesters) ? data.travelOrder.requesters : [];
  
  // Check if there are requesters who haven't been invited yet
  const hasUninvitedRequesters = hasMultipleRequesters && requesters.some((req: any) => {
    // Requester is uninvited if they have email but no invitationId (or invitationId is undefined/null)
    return req.email && !req.invitationId;
  });
  
  // Check if invitations were sent
  const hasSentRequesterInvitations = hasMultipleRequesters && requesters.some((req: any) => req.invitationId && req.invitationId !== 'auto-confirmed');
  
  // Check if all invited requesters are confirmed
  // If there are uninvited requesters, consider as not confirmed
  const requestersAllConfirmed = hasMultipleRequesters
    ? (hasUninvitedRequesters 
        ? false // If there are uninvited requesters, not all are confirmed
        : (hasSentRequesterInvitations
            ? (allRequestersConfirmed ?? requesters.every((req: any) => {
                // Auto-confirmed (current user) counts as confirmed
                if (req.invitationId === 'auto-confirmed' && req.status === 'confirmed') return true;
                // Invited requesters must have status 'confirmed'
                if (req.invitationId && req.invitationId !== 'auto-confirmed') {
                  return req.status === 'confirmed';
                }
                // If no invitationId, don't count (shouldn't happen if hasUninvitedRequesters is false)
                return true;
              }) ?? false)
            : true)) // If no invitations sent yet, consider as confirmed (will be caught by uninvited check)
    : true; // If no multiple requesters, consider as confirmed
  
  // Check if all participants are confirmed (for seminars)
  const seminarParticipantInvitations = (data.seminar as any)?.participantInvitations;
  const hasParticipants = Array.isArray(seminarParticipantInvitations) && seminarParticipantInvitations.length > 0;
  const hasSentParticipantInvitations = hasParticipants && seminarParticipantInvitations?.some((inv: any) => inv.invitationId);
  
  // Only require confirmation if invitations were sent
  const participantsAllConfirmed = hasParticipants && hasSentParticipantInvitations
    ? (allParticipantsConfirmed ?? seminarParticipantInvitations?.every((inv: any) => inv.status === 'confirmed') ?? false)
    : true; // If no participants or no invitations sent, consider as confirmed
  
  // Check if there are multiple departments and if all head endorsements are confirmed
  // Note: requesters is already defined above (line 1653)
  const departments = requesters
    .map((req: any) => req.department)
    .filter((dept: any): dept is string => !!dept && dept.trim() !== "");
  const uniqueDepartments = Array.from(new Set(departments.map((dept: string) => dept.trim())));
  const hasMultipleDepts = uniqueDepartments.length > 1;
  
  const validation = canSubmit(data, { 
    isRepresentativeSubmission,
    isHeadRequester,
    currentUserName: currentUser?.name,
    requestingPersonName: data.travelOrder?.requestingPerson,
    allRequestersConfirmed: hasMultipleRequesters ? requestersAllConfirmed : undefined,
    allParticipantsConfirmed: hasParticipants ? participantsAllConfirmed : undefined,
    allHeadEndorsementsConfirmed: hasMultipleDepts ? allHeadEndorsementsConfirmed : undefined,
  });

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
          {/* Returned Request Banner */}
          {isReturnedRequest && (
            <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-amber-200 p-2">
                  <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-amber-800">Request Returned for Revision</h3>
                  <p className="mt-1 text-xs text-amber-700">
                    This request was returned by an approver. Please review and make any necessary changes, then click "Resubmit Request" to send it back for approval.
                  </p>
                  <p className="mt-2 text-xs text-amber-600">
                    <strong>Note:</strong> All existing signatures have been preserved.
                  </p>
                </div>
              </div>
            </div>
          )}

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
            autoDetectedRole={autoDetectedRole}
          />

          {/* Show Travel Order form only if NOT seminar */}
          {!showSeminar && (
            <>
              {/* Date of Filing Display */}
              {requestMetadata && (
                <FilingDateDisplay
                  createdAt={requestMetadata.createdAt}
                  requestNumber={requestMetadata.requestNumber}
                  status={requestMetadata.status}
                  className="mb-6"
                />
              )}
              <TravelOrderForm
                onAutoSaveRequest={handleAutoSaveRequest}
                data={data.travelOrder}
                onChange={onChangeTravelOrder}
                onChangeCosts={onChangeCosts}
                errors={errors}
                vehicleMode={data.vehicleMode}
                isHeadRequester={isHeadRequester}
                isRepresentativeSubmission={isRepresentativeSubmission}
                requestingPersonHeadName={requestingPersonHeadInfo?.name}
                currentUserName={currentUser?.name}
                requesterRole={data.requesterRole}
                requestId={currentSubmissionId || currentDraftId || undefined} // Pass request ID for invitations (from submission or draft)
                currentUserEmail={currentUserEmail} // Pass current user email for auto-confirm
                onRequestersStatusChange={setAllRequestersConfirmed}
                onHeadEndorsementsStatusChange={setAllHeadEndorsementsConfirmed}
              />
            </>
          )}

          {/* Show School Service for institutional vehicles (both travel orders and seminars) */}
          {showSchoolService && (
            <SchoolServiceSection
              data={data.schoolService}
              onChange={onChangeSchoolService}
              errors={errors}
              departureDate={data.travelOrder?.departureDate} // Pass departure date for coding day filtering
            />
          )}

          {/* Show Transportation Form for institutional vehicles */}
          {showSchoolService && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transportation Arrangement
              </h3>
              <TransportationForm
                value={data.transportation || {}}
                onChange={(value) => patchTransportation(value)}
              />
            </div>
          )}

          {/* Show Seminar form only when seminar is selected */}
          {showSeminar && (
            <>
              {/* Date of Filing Display */}
              {requestMetadata && (
                <FilingDateDisplay
                  createdAt={requestMetadata.createdAt}
                  requestNumber={requestMetadata.requestNumber}
                  status={requestMetadata.status}
                  className="mb-6"
                />
              )}
              <SeminarApplicationForm
                data={data.seminar}
                onChange={onChangeSeminar}
                errors={errors}
                onParticipantsStatusChange={setAllParticipantsConfirmed}
                onAutoSaveRequest={handleAutoSaveRequest}
              />
            </>
          )}

          <SubmitBar
            invalid={!validation.ok}
            saving={saving}
            submitting={submitting}
            onSaveDraft={handleSaveDraft}
            onSubmit={isReturnedRequest ? handleResubmit : handleSubmit}
            isResubmit={isReturnedRequest}
            headName={
              showSeminar
                ? (requestingPersonIsHead === false && requestingPersonHeadInfo
                    ? requestingPersonHeadInfo.name
                    : requestingPersonHeadInfo?.name)
                : (requestingPersonIsHead === false && requestingPersonHeadInfo
                    ? requestingPersonHeadInfo.name
                    : requestingPersonHeadInfo?.name || data.travelOrder?.endorsedByHeadName)
            }
            department={
              showSeminar
                ? (requestingPersonInfo?.department || 
                   requestingPersonHeadInfo?.department || 
                   currentUser?.department || "")
                : (requestingPersonInfo?.department || 
                   requestingPersonHeadInfo?.department || 
                   data.travelOrder?.department)
            }
            isHeadRequester={requestingPersonIsHead === true || currentUser?.role === "head" || (currentUser as any)?.is_head === true}
            requestingPersonIsHead={requestingPersonIsHead === true || currentUser?.role === "head" || (currentUser as any)?.is_head === true ? true : requestingPersonIsHead}
            isRepresentativeSubmission={data.reason === "seminar" ? false : isRepresentativeSubmission}
            requestingPersonName={data.reason === "seminar" ? undefined : data.travelOrder?.requestingPerson}
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

      {/* Approver Selection Modal for Head Requesters */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => {
            setShowApproverSelection(false);
            setLoadingApprovers(false);
          }}
          onSelect={handleApproverSelected}
          title="Select Next Approver"
          description={`Choose who to send this request to after you sign it. You can select your parent head (VP) or an administrator.`}
          options={approverOptions}
          currentRole="head"
          allowReturnToRequester={false}
          loading={loadingApprovers}
          defaultApproverId={defaultApproverId}
          defaultApproverName={defaultApproverName}
        />
      )}

      {/* Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmedSubmit}
        requesterName={
          showSeminar 
            ? (currentUser?.name || (data.seminar as any)?.requesterName || "")
            : (data.travelOrder?.requestingPerson || "")
        }
        department={
          showSeminar
            ? (requestingPersonInfo?.department || requestingPersonHeadInfo?.department || currentUser?.department || "")
            : (data.travelOrder?.department || "")
        }
        purpose={
          showSeminar
            ? (data.seminar?.title || "")
            : (data.travelOrder?.purposeOfTravel || "")
        }
        destination={
          showSeminar
            ? (data.seminar?.venue || "")
            : (data.travelOrder?.destination || "")
        }
        travelDate={
          showSeminar
            ? (data.seminar?.dateFrom || "")
            : (data.travelOrder?.departureDate || "")
        }
        returnDate={
          showSeminar
            ? (data.seminar?.dateTo || "")
            : (data.travelOrder?.returnDate || "")
        }
        approvalPath={fullApprovalPath({
          requesterRole: data.requesterRole,
          vehicleMode: data.vehicleMode,
          hasBudget,
          needsVehicle,
        })}
        firstReceiver={firstHop}
        isSubmitting={submitting}
        selectedApproverName={selectedApproverName || undefined}
        headName={(() => {
          // Priority: 1. requestingPersonHeadInfo.name (if available and requester is not head)
          // 2. data.travelOrder?.endorsedByHeadName (auto-populated in form)
          // 3. requestingPersonHeadInfo?.name (any head info available)
          let headName = "";
          
          if (requestingPersonIsHead === false && requestingPersonHeadInfo?.name) {
            headName = requestingPersonHeadInfo.name;
          } else if (data.travelOrder?.endorsedByHeadName) {
            headName = data.travelOrder.endorsedByHeadName;
          } else if (requestingPersonHeadInfo?.name) {
            headName = requestingPersonHeadInfo.name;
          }
          
          // Debug logging removed - too verbose
          // Only log if there's an issue with head name resolution
          if (!headName && requestingPersonIsHead === false) {
            console.warn('[RequestWizard] ⚠️ No head name found for non-head requester');
          }
          
          return headName;
        })()}
        isSeminar={showSeminar}
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
