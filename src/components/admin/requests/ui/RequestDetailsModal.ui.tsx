// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, FileDown, CheckCircle, AlertTriangle, MapPin, User, Car, CheckCircle2, PenTool, Clock, Users } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { generateRequestPDF } from "@/lib/admin/requests/pdfWithTemplate";
import { generateSeminarPDF } from "@/lib/admin/requests/pdfSeminar";
import { useToast } from "@/components/common/ui/Toast";

// 🔹 Detailed Seminar block (keeps this modal tidy)
import SeminarDetails from "@/components/admin/requests/parts/SeminarDetails.ui";

// 🔹 Your signature pad component
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

// 🔹 Submission history component
import SubmissionHistoryUI from "@/components/admin/requests/ui/SubmissionHistory.ui";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";

// 🔹 Choice-based sending modal
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";

// Drivers and vehicles will be fetched from API

/** Peso formatter */
function peso(n: number | null | undefined) {
  const num = typeof n === "number" && isFinite(n) ? n : 0;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format date to readable format like "November 13, 2025" */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  } catch {
    return dateStr;
  }
}

/** Read requester signature regardless of the saved key */
function getRequesterSig(to?: any): string | null {
  return (
    to?.requesterSignature ||
    to?.requestingPersonSignature || // legacy/alternate
    to?.requesterSig ||
    null
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  row?: AdminRequest;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function RequestDetailsModalUI({
  open,
  onClose,
  row,
  onApprove,
  onReject,
}: Props) {
  const toast = useToast();
  const [driver, setDriver] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  
  // Admin notes (textarea instead of buttons)
  const [adminNotes, setAdminNotes] = React.useState("");
  
  // Preferred driver/vehicle from requester
  const [preferredDriver, setPreferredDriver] = React.useState("");
  const [preferredVehicle, setPreferredVehicle] = React.useState("");
  
  // Real drivers and vehicles from API
  const [drivers, setDrivers] = React.useState<Array<{id: string; name: string}>>([]);
  const [vehicles, setVehicles] = React.useState<Array<{id: string; label: string}>>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(true);

  // signature modal (for Approve)
  const [signOpen, setSignOpen] = React.useState(false);
  const [sigDataUrl, setSigDataUrl] = React.useState<string | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);
  
  // Choice-based sending
  const [showApproverSelection, setShowApproverSelection] = React.useState(false);
  const [approverOptions, setApproverOptions] = React.useState<any[]>([]);
  const [selectedApproverId, setSelectedApproverId] = React.useState<string | null>(null);
  const [selectedApproverRole, setSelectedApproverRole] = React.useState<string | null>(null);

  // Confirmed requesters
  const [confirmedRequesters, setConfirmedRequesters] = React.useState<any[]>([]);
  const [loadingRequesters, setLoadingRequesters] = React.useState(false);

  // Hydrate local assignment state from the selected row (robust over many shapes)
  React.useEffect(() => {
    if (!row) {
      setDriver("");
      setVehicle("");
      setAdminNotes("");
      setPreferredDriver("");
      setPreferredVehicle("");
      return;
    }
    
    // Debug logging
    console.log("🎯 Modal received row data:");
    console.log("  - requester_name:", (row as any).requester_name);
    console.log("  - requestingPerson:", row.travelOrder?.requestingPerson);
    console.log("  - preferred_driver:", (row as any).preferred_driver);
    console.log("  - preferred_vehicle:", (row as any).preferred_vehicle);
    console.log("  - requester:", (row as any).requester);
    
    const t: any = row.travelOrder ?? {};
    
    // Assigned driver/vehicle
    const drv =
      row.driver ||
      t.driver ||
      t.schoolService?.driverName ||
      t.schoolService?.driver ||
      t.selectedDriverName ||
      t.selectedDriver ||
      t.assignedDriverName ||
      t.assignedDriver ||
      "";
    const veh =
      row.vehicle ||
      t.vehicle ||
      t.schoolService?.vehicleName ||
      t.schoolService?.vehicle ||
      t.selectedVehicleName ||
      t.selectedVehicle ||
      t.assignedVehicleName ||
      t.assignedVehicle ||
      "";
    
    // Preferred driver/vehicle (from requester's preferences) - use joined data from API
    const prefDrv = 
      (row as any).preferred_driver?.name || 
      (row as any).preferred_driver_name || 
      t.schoolService?.preferredDriverName || 
      t.preferredDriverName || 
      "";
    const prefVeh = 
      (row as any).preferred_vehicle?.vehicle_name || 
      (row as any).preferred_vehicle?.label || 
      (row as any).preferred_vehicle_label || 
      t.schoolService?.preferredVehicleName || 
      t.preferredVehicleName || 
      "";
    
    // Admin notes
    const notes = row.tmNote || "";
    
    setDriver(drv);
    setVehicle(veh);
    setPreferredDriver(prefDrv);
    setPreferredVehicle(prefVeh);
    setAdminNotes(notes);
  }, [row]);

  // Persist driver/vehicle/notes assignments back to repo when changed (only if not final approved)
  React.useEffect(() => {
    if (row?.id && row.status !== "approved") AdminRequestsRepo.setDriver(row.id, driver);
  }, [driver, row?.id, row?.status]);

  React.useEffect(() => {
    if (row?.id && row.status !== "approved") AdminRequestsRepo.setVehicle(row.id, vehicle);
  }, [vehicle, row?.id, row?.status]);
  
  React.useEffect(() => {
    if (row?.id && row.status !== "approved") AdminRequestsRepo.setTmNote(row.id, adminNotes || null);
  }, [adminNotes, row?.id, row?.status]);
  
  // Fetch real drivers and vehicles
  React.useEffect(() => {
    async function fetchOptions() {
      try {
        setLoadingOptions(true);
        
        // Get travel date from request for coding day filtering
        const travelDate = (row as any)?.travel_start_date 
          ? new Date((row as any).travel_start_date).toISOString().split('T')[0]
          : null;
        
        const [driversRes, vehiclesRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch(travelDate 
            ? `/api/vehicles?status=available&date=${encodeURIComponent(travelDate)}`
            : '/api/vehicles?status=available'
          )
        ]);
        
        if (driversRes.ok) {
          const driversData = await driversRes.json();
          setDrivers(driversData.ok && driversData.data ? driversData.data : []);
        }
        
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData.ok && vehiclesData.data ? vehiclesData.data : []);
          console.log(`[RequestDetailsModal] Loaded ${vehiclesData.data?.length || 0} vehicles${travelDate ? ` for date ${travelDate}` : ''}`);
        }
      } catch (err) {
        console.error('[RequestDetailsModal] Failed to fetch options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    if (open) fetchOptions();
  }, [open, row]);

  // Fetch confirmed requesters
  React.useEffect(() => {
    async function fetchRequesters() {
      if (!row?.id) {
        setConfirmedRequesters([]);
        return;
      }

      try {
        setLoadingRequesters(true);
        const response = await fetch(`/api/requesters/status?request_id=${row.id}`);
        const data = await response.json();
        
        if (data.ok && data.data) {
          // Filter only confirmed requesters AND exclude the main requester
          const confirmed = data.data.filter((req: any) => {
            // Only include if status is confirmed
            if (req.status !== 'confirmed') {
              return false;
            }
            
            // Exclude if this is the main requester (by user_id, email, or name match)
            const isMainRequester = 
              (req.user_id && row?.requester?.id && req.user_id === row.requester.id) ||
              (req.email && row?.requester?.email && req.email.toLowerCase() === row.requester.email.toLowerCase()) ||
              (req.name && row?.requester?.name && req.name.toLowerCase().trim() === row.requester.name.toLowerCase().trim());
            
            return !isMainRequester;
          });
          setConfirmedRequesters(confirmed);
        }
      } catch (err) {
        console.error('[RequestDetailsModal] Error fetching confirmed requesters:', err);
      } finally {
        setLoadingRequesters(false);
      }
    }
    
    if (open && row?.id) fetchRequesters();
  }, [open, row?.id]);

  // Compute total cost — sum base categories + otherItems + single "other"
  const totalCost = React.useMemo(() => {
    const c: any = row?.travelOrder?.costs || {};
    const baseKeys = ["food", "driversAllowance", "rentVehicles", "hiredDrivers", "accommodation"] as const;

    const base = baseKeys.reduce((sum, k) => {
      const v = c[k];
      return sum + (typeof v === "number" && isFinite(v) ? v : 0);
    }, 0);

    const othersArray = Array.isArray(c.otherItems)
      ? c.otherItems.reduce(
          (s: number, it: any) => s + (it && typeof it.amount === "number" && isFinite(it.amount) ? it.amount : 0),
          0
        )
      : 0;

    const singleOther =
      c.otherLabel && typeof c.otherAmount === "number" && isFinite(c.otherAmount) ? c.otherAmount : 0;

    return base + othersArray + singleOther;
  }, [row?.travelOrder?.costs]);

  // Get department name from the head approver's department, not the request's department
  // Check for BOTH direct head approval AND parent head approval (SVP, etc.)
  // Also check VP approval if VP is also a head (dual role)
  // Check both row and payload for VP data (data might be in payload)
  const payload = (row as any)?.payload;
  const headApprover = (row as any)?.head_approver || payload?.head_approver;
  const parentHeadApprover = (row as any)?.parent_head_approver || payload?.parent_head_approver;
  const vpApprover = (row as any)?.vp_approver || payload?.vp_approver;
  const hasHeadApproval = !!(row as any)?.head_approved_at || !!(row as any)?.head_approved_by || payload?.head_approved_at || payload?.head_approved_by;
  const hasParentHeadApproval = !!(row as any)?.parent_head_approved_at || !!(row as any)?.parent_head_approved_by || payload?.parent_head_approved_at || payload?.parent_head_approved_by;
  const hasVpApproval = !!(row as any)?.vp_approved_at || !!(row as any)?.vp_approved_by || payload?.vp_approved_at || payload?.vp_approved_by;
  
  // Debug logging
  console.log("🔍 Head Approval Check:", {
    hasHeadApproval,
    hasParentHeadApproval,
    hasVpApproval,
    vpApprover: vpApprover ? { id: vpApprover.id, name: vpApprover.name, is_head: vpApprover.is_head } : null,
    vp_approved_at: (row as any)?.vp_approved_at,
    vp_signature: (row as any)?.vp_signature ? "EXISTS" : "NULL",
    row_vp_approver: (row as any)?.vp_approver,
    row_vp_approved_at: (row as any)?.vp_approved_at,
    row_vp_signature: (row as any)?.vp_signature ? "EXISTS" : "NULL"
  });
  
  // If VP approved and VP is also a head, treat it as head approval
  // Also check if VP has is_head flag OR if we have VP approval (fallback)
  const vpIsHead = vpApprover?.is_head === true;
  const hasAnyHeadApproval = hasHeadApproval || hasParentHeadApproval || (hasVpApproval && vpIsHead);
  
  // Priority: parent head > direct head > VP (if VP is head)
  const approverToUse = hasParentHeadApproval ? parentHeadApprover 
    : hasHeadApproval ? headApprover 
    : (hasVpApproval && vpIsHead) ? vpApprover 
    : null;
  const approverDept = approverToUse?.department?.name || approverToUse?.department_name || "";
  
  // Only use approver's department if there's actually a head approval
  const deptName = hasAnyHeadApproval ? (approverDept || "") : "";

  // Derived rules for routing after Admin approval
  const usesVehicle = React.useMemo(() => {
    const t: any = row?.travelOrder || {};
    const vm = (t.vehicleMode || "").toString().toLowerCase();
    // Treat any non-empty mode as vehicle use; if you have "none" as value, it will be skipped
    return !!vm && vm !== "none";
  }, [row?.travelOrder]);

  const requiresComptroller = usesVehicle || totalCost > 0;

  // Can Admin approve now?
  // If requester is head, they don't need head signature (they already signed as requester)
  const requesterIsHead = (row as any)?.requester_is_head === true;
  const awaitingHead = row?.status === "pending_head" && !requesterIsHead;
  const hasAdminApproved = !!(row as any)?.admin_approved_at; // Check if admin has already approved
  const canAdminApprove =
    !!row &&
    !awaitingHead &&
    !hasAdminApproved && // Don't show approve if admin already approved
    row.status !== "approved" && // Don't show approve if already approved
    row.status !== "rejected" && // Don't show approve if rejected
    (row.status === "head_approved" ||
      row.status === "pending_admin" || // NEW: Admin's turn to approve
      row.status === "admin_received" ||
      row.status === "pending" || // legacy fallback
      row.status === "comptroller_pending" || // allow re-approval loops if needed
      row.status === "hr_pending" ||
      row.status === "executive_pending" ||
      (row.status === "pending_head" && requesterIsHead)); // Head requester can be approved even if status is pending_head

  // PDF uses current driver/vehicle selections
  const handlePrintTravelPDF = React.useCallback(() => {
    if (!row) return;
    const printable: AdminRequest = {
      ...row,
      driver,
      vehicle,
    } as AdminRequest;

    generateRequestPDF(printable);
  }, [row, driver, vehicle]);

  const isApproved = row?.status === "approved" || !!(row as any)?.admin_approved_at;
  const approvedWhen = row?.approvedAt
    ? new Date(row.approvedAt).toLocaleString()
    : null;
  
  // Build submission history entries - COMPLETE timeline with ALL signatures
  const historyEntries = React.useMemo(() => {
    if (!row) return [];
    const entries = [];
    const r: any = row;
    
    console.log("🔍 Building COMPLETE history entries for request:", r.id);
    
    // 1. Request Submitted
    if (r.createdAt || r.created_at) {
      entries.push({
        action: "Request Submitted",
        by: r.requester?.name || r.requester_name || r.requester?.email || "Unknown",
        timestamp: r.createdAt || r.created_at,
        icon: "submitted" as const,
        signature: r.requester_signature || null,
      });
    }
    
    // 2. Parent Head Approved (if applicable - for child departments)
    if (r.parent_head_approved_at) {
      const parentHeadName = r.parent_head_approver?.name || r.parent_head_approver?.email || "Parent Department Head";
      entries.push({
        action: "Parent Head Approved",
        by: parentHeadName,
        timestamp: r.parent_head_approved_at,
        icon: "approved" as const,
        signature: r.parent_head_signature || null,
      });
    }
    
    // 3. Head Approved
    if (r.head_approved_at) {
      const headName = r.head_approver?.name || r.travelOrder?.endorsedByHeadName || "Department Head";
      entries.push({
        action: "Department Head Approved",
        by: headName,
        timestamp: r.head_approved_at,
        icon: "approved" as const,
        signature: r.head_signature || null,
      });
    }
    
    // 4. Admin Approved
    if (r.admin_approved_at || r.admin_processed_at) {
      const adminName = r.admin_approver?.name || r.admin_approver?.email || "Administrator";
      entries.push({
        action: "Administrator Approved",
        by: adminName,
        timestamp: r.admin_approved_at || r.admin_processed_at,
        icon: "approved" as const,
        signature: r.admin_signature || null,
      });
    }
    
    // 5. Comptroller Approved
    if (r.comptroller_approved_at) {
      const comptrollerName = r.comptroller_approver?.name || r.comptroller_approver?.email || "Comptroller";
      entries.push({
        action: "Comptroller Approved",
        by: comptrollerName,
        timestamp: r.comptroller_approved_at,
        icon: "approved" as const,
        signature: r.comptroller_signature || null,
      });
    }
    
    // 6. HR Approved
    if (r.hr_approved_at) {
      const hrName = r.hr_approver?.name || r.hr_approver?.email || "HR Officer";
      entries.push({
        action: "HR Approved",
        by: hrName,
        timestamp: r.hr_approved_at,
        icon: "approved" as const,
        signature: r.hr_signature || null,
      });
    }
    
    // 7. First VP Approved
    if (r.vp_approved_at || r.vp_approved_by) {
      const vpName = r.vp_approver?.name || r.vp_approver?.email || "Vice President";
      entries.push({
        action: "First VP Approved",
        by: vpName,
        timestamp: r.vp_approved_at,
        icon: "approved" as const,
        signature: r.vp_signature || null,
      });
    }
    
    // 8. Second VP Approved (if applicable)
    if (r.vp2_approved_at || r.vp2_approved_by) {
      const vp2Name = r.vp2_approver?.name || r.vp2_approver?.email || "Second Vice President";
      entries.push({
        action: "Second VP Approved",
        by: vp2Name,
        timestamp: r.vp2_approved_at,
        icon: "approved" as const,
        signature: r.vp2_signature || null,
      });
    }
    
    // 9. President Approved
    if (r.president_approved_at || r.exec_approved_at) {
      const presidentName = r.president_approver?.name || r.exec_approver?.name || r.president_approver?.email || r.exec_approver?.email || "President";
      entries.push({
        action: "President Approved",
        by: presidentName,
        timestamp: r.president_approved_at || r.exec_approved_at,
        icon: "approved" as const,
        signature: r.president_signature || r.exec_signature || null,
      });
    }
    
    // 10. Final Approval
    if (r.final_approved_at) {
      entries.push({
        action: "Request Fully Approved",
        by: "System",
        timestamp: r.final_approved_at,
        icon: "approved" as const,
        signature: null,
      });
    }
    
    // 11. Rejected (if applicable)
    if (r.rejected_at) {
      const rejectedBy = r.rejected_by_user?.name || r.rejected_by_user?.email || "Approver";
      entries.push({
        action: "Request Rejected",
        by: rejectedBy,
        timestamp: r.rejected_at,
        icon: "rejected" as const,
        signature: null,
      });
    }
    
    // Sort by timestamp
    entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log(`✅ Built ${entries.length} history entries`);
    return entries;
  }, [row]);

  // open signature flow
  function requestApproval() {
    // Validate admin notes
    if (!adminNotes || adminNotes.trim() === "") {
      alert("Admin Notes are required! Please add notes before approving.");
      return;
    }
    
    setSigDataUrl(null);
    setSignOpen(true);
  }

  // State for default approver (Ma'am TM)
  const [defaultApproverId, setDefaultApproverId] = React.useState<string | undefined>(undefined);
  const [defaultApproverName, setDefaultApproverName] = React.useState<string | undefined>(undefined);
  const [suggestionReason, setSuggestionReason] = React.useState<string | undefined>(undefined);

  // Load approver options for choice-based sending
  React.useEffect(() => {
    if (showApproverSelection && row?.id) {
      const loadApprovers = async () => {
        try {
          // Fetch comptroller and HR options
          const [comptrollerRes, hrRes] = await Promise.all([
            fetch('/api/approvers/list?role=comptroller'),
            fetch('/api/approvers/list?role=hr'),
          ]);
          
          const comptrollerData = await comptrollerRes.json().catch(() => ({ ok: false, data: [] }));
          const hrData = await hrRes.json().catch(() => ({ ok: false, data: [] }));
          
          const options: any[] = [];
          
          // Note: API returns { ok, data } not { ok, approvers }
          if (comptrollerData.ok && comptrollerData.data) {
            options.push(...comptrollerData.data.map((a: any) => ({
              ...a,
              role: 'comptroller',
              roleLabel: 'Comptroller'
            })));
          }
          
          if (hrData.ok && hrData.data) {
            options.push(...hrData.data.map((a: any) => ({
              ...a,
              role: 'hr',
              roleLabel: 'HR'
            })));
          }
          
          setApproverOptions(options);
        } catch (error) {
          console.error('[Admin Approve] Failed to load approvers:', error);
          setApproverOptions([]);
        }
      };
      
      loadApprovers();
    }
  }, [showApproverSelection, row?.id]);

  // Smart suggestion: Use workflow logic to suggest next approver
  React.useEffect(() => {
    if (showApproverSelection && approverOptions.length > 0 && row) {
      (async () => {
        try {
          const { suggestNextApprover, findSuggestedApprover } = await import('@/lib/workflow/suggest-next-approver');
          const suggestion = suggestNextApprover({
            status: (row as any).status,
            requester_is_head: (row as any).requester_is_head || false,
            requester_role: (row as any).requester?.role || (row as any).requester_role,
            has_budget: ((row as any).total_budget || 0) > 0,
            head_included: (row as any).head_included || false,
            parent_head_approved_at: (row as any).parent_head_approved_at,
            parent_head_approver: (row as any).parent_head_approver,
            requester_signature: (row as any).requester_signature,
            head_approved_at: (row as any).head_approved_at,
            admin_approved_at: (row as any).admin_approved_at,
            comptroller_approved_at: (row as any).comptroller_approved_at,
            hr_approved_at: (row as any).hr_approved_at,
            vp_approved_at: (row as any).vp_approved_at,
            vp2_approved_at: (row as any).vp2_approved_at,
            both_vps_approved: (row as any).both_vps_approved
          });

          if (suggestion) {
            const suggested = findSuggestedApprover(suggestion, approverOptions);
            if (suggested) {
              setDefaultApproverId(suggested.id);
              setDefaultApproverName(suggested.name);
              setSuggestionReason(suggestion.reason);
              console.log('[Admin Approve] ✅ Smart suggestion:', suggestion.roleLabel, '-', suggestion.reason);
            } else {
              setSuggestionReason(undefined);
            }
          } else {
            setSuggestionReason(undefined);
          }
        } catch (err) {
          console.error('[Admin Approve] Error getting suggestion:', err);
          setSuggestionReason(undefined);
        }
      })();
    }
  }, [showApproverSelection, approverOptions, row]);

  async function confirmSignature() {
    if (!row?.id || !sigDataUrl || isApproving) return;

    // Show approver selection modal for choice-based sending
    setShowApproverSelection(true);
    setSignOpen(false); // Close signature modal
  }

  async function proceedWithApproval() {
    if (!row?.id || !sigDataUrl || isApproving) return;

    setIsApproving(true); // Disable button to prevent double-click

    try {
      // Call API to approve in database with choice-based sending
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: row.id,
          signature: sigDataUrl,
          driver,
          vehicle,
          adminNotes,
          requiresComptroller,
          nextApproverId: selectedApproverId,
          nextApproverRole: selectedApproverRole || (requiresComptroller ? 'comptroller' : 'hr'),
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        console.error('[Admin Approve] Error:', result.error);
        alert(`Error: ${result.error}`);
        setIsApproving(false); // Re-enable button on error
        return;
      }

      console.log('[Admin Approve] Success:', result.message);

      // Show success toast
      const approverLabel = selectedApproverRole === 'comptroller' ? 'Comptroller' : 
                            selectedApproverRole === 'hr' ? 'HR' :
                            requiresComptroller ? 'Comptroller' : 'HR';
      toast.success("Request Approved", `Request approved and sent to ${approverLabel}!`);

      // Also update localStorage for offline support
      const nowIso = new Date().toISOString();
      const nextStatus = selectedApproverRole === 'comptroller' ? "pending_comptroller" : 
                        selectedApproverRole === 'hr' ? "pending_hr" :
                        requiresComptroller ? "pending_comptroller" : "pending_hr";
      
      const repoAny = AdminRequestsRepo as unknown as {
        upsert: (req: AdminRequest) => void;
      };
      
      repoAny.upsert({
        ...row,
        approverSignature: sigDataUrl,
        approvedAt: nowIso,
        approvedBy: "Admin User",
        updatedAt: nowIso,
        status: nextStatus as AdminRequest["status"],
        driver,
        vehicle,
      } as AdminRequest);

      onApprove?.();
      setSignOpen(false);
      setShowApproverSelection(false);
      setSelectedApproverId(null);
      setSelectedApproverRole(null);
      
      // Close main modal after successful approval
      setTimeout(() => {
        onClose();
        // Refresh page to show updated data
        window.location.reload();
      }, 1500); // Longer delay to show toast
      
    } catch (error) {
      console.error('[Admin Approve] Network error:', error);
      alert('Network error. Please try again.');
      setIsApproving(false); // Re-enable button on error
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with fade-in animation */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out" 
        style={{
          animation: open ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in'
        }}
        aria-hidden="true" 
      />

      {/* Modal with scale + fade animation - Consistent with other modals */}
      <div 
        className="relative z-50 w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transition-all duration-300 ease-out flex flex-col overflow-hidden"
        style={{
          animation: open ? 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'popOut 0.2s ease-in',
          transformOrigin: 'center center'
        }}
      >
        {!row ? (
          <div className="text-center text-sm text-neutral-500 p-6">No request selected</div>
        ) : (
          <>
            {/* Header - Consistent with other modals */}
            <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Request Details
                </h2>
                <div className="space-y-1">
                  {(row as any).request_number && (
                    <p className="text-sm text-white/80 font-mono">
                      {(row as any).request_number}
                    </p>
                  )}
                  {(row as any).file_code && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70">File Code:</span>
                      <span className="text-xs font-mono font-semibold text-white/90">
                        {(row as any).file_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  (row as any).status === 'pending_admin' ? 'bg-amber-100 text-amber-700' :
                  (row as any).status === 'pending_comptroller' || (row as any).status === 'comptroller_pending' ? 'bg-yellow-100 text-yellow-700' :
                  (row as any).status === 'pending_hr' || (row as any).status === 'hr_pending' ? 'bg-blue-100 text-blue-700' :
                  (row as any).status === 'pending_exec' || (row as any).status === 'executive_pending' ? 'bg-purple-100 text-purple-700' :
                  (row as any).status === 'approved' ? 'bg-green-100 text-green-700' :
                  (row as any).status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {(row as any).status === 'pending_admin' ? 'Pending Review' :
                   (row as any).status === 'pending_comptroller' || (row as any).status === 'comptroller_pending' ? 'For Comptroller Review' :
                   (row as any).status === 'pending_hr' || (row as any).status === 'hr_pending' ? 'For HR Review' :
                   (row as any).status === 'pending_exec' || (row as any).status === 'executive_pending' ? 'For Executive Review' :
                   (row as any).status === 'approved' ? 'Approved' :
                   (row as any).status === 'rejected' ? 'Rejected' :
                   (row as any).status || 'Pending'}
                </span>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {/* Context banners */}
              {awaitingHead && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-medium">Awaiting Department Head Endorsement</div>
                    <div>Admin approval is disabled until the Head signs.</div>
                  </div>
                </div>
              )}
              {row.status === "head_approved" && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Head endorsement received. You may review and approve.
                </div>
              )}

              <div className="space-y-6">
              {/* Travel Order */}
              <section className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
                <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Travel Order Details
                </h3>
                {/* Basic Information Section */}
                <div className="mb-6 bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="h-4 w-4 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h4>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {(() => {
                      const payload = (row as any)?.payload;
                      const reasonOfTrip = payload?.reason_of_trip || (row as any)?.reason_of_trip || (row as any)?.workflow_metadata?.reason_of_trip;
                      return reasonOfTrip ? (
                        <>
                          <dt className="font-semibold text-slate-600">Reason of Trip</dt>
                          <dd className="text-slate-900 capitalize">{reasonOfTrip}</dd>
                        </>
                      ) : null;
                    })()}
                    
                    <dt className="font-semibold text-slate-600">Purpose</dt>
                    <dd className="text-slate-900">{row.travelOrder?.purposeOfTravel || (row as any)?.purpose || (row as any)?.title || "—"}</dd>

                    <dt className="font-semibold text-slate-600">Destination</dt>
                    <dd>
                      <div className="flex items-center gap-2">
                        <span>{row.travelOrder?.destination || (row as any)?.destination || "—"}</span>
                        {(row.travelOrder?.destination || (row as any)?.destination) && (
                          <button
                            onClick={() => {
                              const dest = row.travelOrder?.destination || (row as any)?.destination || "";
                              const query = encodeURIComponent(dest);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                            title="View on Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            View on Map
                          </button>
                        )}
                      </div>
                    </dd>

                    <dt className="font-semibold text-slate-600">Department</dt>
                    <dd className="text-slate-900">{deptName || "—"}</dd>

                    <dt className="font-semibold text-slate-600">Travel Dates</dt>
                    <dd className="text-slate-900">
                      {(() => {
                        const startDate = row.travelOrder?.departureDate || (row as any)?.travel_start_date;
                        const endDate = row.travelOrder?.returnDate || (row as any)?.travel_end_date;
                        if (startDate && endDate) {
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const startFormatted = start.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Manila'
                          });
                          const endFormatted = end.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Manila'
                          });
                          return `${startFormatted} - ${endFormatted}`;
                        }
                        return formatDate(startDate) + (endDate ? ` - ${formatDate(endDate)}` : '');
                      })()}
                    </dd>

                    <dt className="font-semibold text-slate-600">Date Requested</dt>
                    <dd className="text-slate-900">
                      {(() => {
                        const date = row.travelOrder?.date || row.createdAt || (row as any)?.created_at;
                        if (date) {
                          const d = new Date(date);
                          return d.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Asia/Manila'
                          });
                        }
                        return "—";
                      })()}
                    </dd>

                    {(() => {
                      const payload = (row as any)?.payload;
                      const totalBudget = payload?.total_budget || (row as any)?.total_budget;
                      if (totalBudget && parseFloat(totalBudget) > 0) {
                        return (
                          <>
                            <dt className="font-semibold text-slate-600">Budget</dt>
                            <dd className="text-slate-900 font-semibold text-[#7A0010]">{peso(parseFloat(totalBudget))}</dd>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </dl>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <dt className="font-semibold text-slate-600">Requesting Person</dt>
                  <dd>
                    <div className="space-y-3">
                      {/* Main Requester */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg shadow-sm">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            {((row as any).requester?.profile_picture || (row as any).profile_picture) ? (
                              <img
                                src={(row as any).requester?.profile_picture || (row as any).profile_picture}
                                alt={(row as any).requester_name || 'Requester'}
                                className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center border-2 border-blue-300">
                                <User className="h-8 w-8 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">
                              {(row as any).requester_name || row.travelOrder?.requestingPerson || (row as any).requester?.name || "—"}
                            </h4>
                            {((row as any).requester?.position_title || (row as any).position_title) && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                  {(row as any).requester?.position_title || (row as any).position_title}
                                </span>
                                {((row as any).requester_is_head) && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                    Department Head
                                  </span>
                                )}
                              </div>
                            )}
                            {((row as any).requester?.email || (row as any).requester_email) && (
                              <p className="text-sm text-gray-600 mb-1 break-all">
                                📧 {(row as any).requester?.email || (row as any).requester_email}
                              </p>
                            )}
                            {((row as any).requester?.department || (row as any).department?.name || (row as any).department_name) && (
                              <p className="text-sm text-gray-700 font-medium">
                                🏢 {(row as any).requester?.department || (row as any).department?.name || (row as any).department_name}
                              </p>
                            )}
                          </div>
                        </div>
                        {(() => {
                          const sig = getRequesterSig(row.travelOrder) || (row as any).requester_signature || (row as any).payload?.requester_signature;
                          if (sig) {
                            return (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
                                  <PenTool className="h-3.5 w-3.5" />
                                  Requester Signature
                                </p>
                                <div className="p-2 bg-white border border-blue-200 rounded-lg">
                                  <img
                                    src={sig}
                                    alt="Requester signature"
                                    className="h-12 w-auto max-w-[200px] object-contain mx-auto"
                                    title="Requester e-signature"
                                  />
                                  <p className="text-center text-xs text-slate-500 mt-1">Digital Signature</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {(row as any).requester?.name && (row as any).requester.name !== ((row as any).requester_name || row.travelOrder?.requestingPerson) && (
                        <div className="mt-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-1.5">
                          <span className="font-medium">Submitted on behalf by:</span>
                          <NameWithProfile
                            name={(row as any).requester.name || (row as any).requester.email}
                            profile={{
                              id: (row as any).requester?.id || '',
                              name: (row as any).requester.name || '',
                              email: (row as any).requester.email,
                              department: (row as any).requester?.department,
                              position: (row as any).requester?.position_title,
                              profile_picture: (row as any).requester?.profile_picture,
                            }}
                          />
                        </div>
                      )}

                      {/* Additional Confirmed Requesters */}
                      {confirmedRequesters.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              Additional Requesters ({confirmedRequesters.length})
                            </span>
                          </div>
                          <div className="space-y-3">
                            {loadingRequesters ? (
                              <div className="text-center py-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7A0010] border-t-transparent mx-auto"></div>
                                <p className="text-xs text-slate-500 mt-1">Loading requesters...</p>
                              </div>
                            ) : (
                              confirmedRequesters.map((requester, index) => (
                                <div
                                  key={requester.id || index}
                                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                                >
                                  {/* Requester Info */}
                                  <div className="flex items-start gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-slate-900 text-sm truncate">
                                        {requester.name || requester.email || 'Unknown Requester'}
                                      </p>
                                      {requester.department && (
                                        <p className="text-xs text-slate-600 mt-0.5">{requester.department}</p>
                                      )}
                                      {requester.email && (
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{requester.email}</p>
                                      )}
                                    </div>
                                    <div className="flex-shrink-0">
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-medium text-green-700">Confirmed</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Signature */}
                                  {requester.signature && (
                                    <div className="mt-2 pt-2 border-t border-green-200">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <PenTool className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-xs font-semibold text-green-900">Signature</span>
                                      </div>
                                      <div className="bg-white rounded p-1.5 border border-green-200">
                                        <img
                                          src={requester.signature}
                                          alt={`${requester.name || 'Requester'} signature`}
                                          className="w-full h-12 object-contain"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Confirmation Time */}
                                  {requester.confirmed_at && (
                                    <div className="mt-2 pt-2 border-t border-green-200">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <span className="text-xs text-slate-600">
                                          Confirmed: <span className="font-medium text-slate-900">
                                            {new Date(requester.confirmed_at).toLocaleString('en-US', {
                                              timeZone: 'Asia/Manila',
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: 'numeric',
                                              minute: '2-digit',
                                              hour12: true
                                            })}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </dd>

                </dl>

                {/* Budget Breakdown - Use expense_breakdown from API */}
                {(() => {
                  // Get expense_breakdown from payload (Supabase data) or travelOrder.costs (legacy)
                  const payload = (row as any)?.payload;
                  let expenseBreakdown = payload?.expense_breakdown || (row as any)?.expense_breakdown;
                  
                  // Parse if string (JSONB)
                  if (typeof expenseBreakdown === 'string') {
                    try {
                      expenseBreakdown = JSON.parse(expenseBreakdown);
                    } catch (e) {
                      console.error("[RequestDetailsModal] Failed to parse expense_breakdown:", e);
                      expenseBreakdown = null;
                    }
                  }
                  
                  // Fallback to travelOrder.costs if no expense_breakdown
                  const costs = row.travelOrder?.costs;
                  const hasExpenseBreakdown = expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0;
                  const hasCosts = costs && Object.keys(costs).length > 0;
                  
                  if (hasExpenseBreakdown || hasCosts) {
                    return (
                      <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="mb-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className="text-lg">₱</span>
                          Budget Breakdown
                        </h4>
                        {hasExpenseBreakdown ? (
                          // Use expense_breakdown from API (new format)
                          <>
                            <div className="space-y-2 mb-3">
                              {expenseBreakdown.map((item: any, idx: number) => {
                                if (!item || item.amount <= 0) return null;
                                const label = item.item || item.description || "Unknown";
                                const description = item.description && item.item !== "Other" ? item.description : null;
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <div className="flex-1">
                                      <div className="font-medium text-slate-900">{label}</div>
                                      {description && (
                                        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">{peso(item.amount)}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-300">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900">Total Budget</span>
                                <span className="text-lg font-bold text-[#7A0010]">
                                  {peso(expenseBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0))}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          // Fallback to travelOrder.costs (legacy format)
                          <table className="w-full text-sm">
                            <tbody>
                              {"food" in costs && (costs as any).food > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">Food</div>
                                      {(costs as any).foodDescription && (
                                        <div className="text-xs text-slate-500 mt-0.5">{(costs as any).foodDescription}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).food)}</td>
                                </tr>
                              )}
                              {"driversAllowance" in costs && (costs as any).driversAllowance > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">Driver's allowance</div>
                                      {(costs as any).driversAllowanceDescription && (
                                        <div className="text-xs text-slate-500 mt-0.5">{(costs as any).driversAllowanceDescription}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).driversAllowance)}</td>
                                </tr>
                              )}
                              {"rentVehicles" in costs && (costs as any).rentVehicles > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">Rent vehicles</div>
                                      {(costs as any).rentVehiclesDescription && (
                                        <div className="text-xs text-slate-500 mt-0.5">{(costs as any).rentVehiclesDescription}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).rentVehicles)}</td>
                                </tr>
                              )}
                              {"hiredDrivers" in costs && (costs as any).hiredDrivers > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">Hired drivers</div>
                                      {(costs as any).hiredDriversDescription && (
                                        <div className="text-xs text-slate-500 mt-0.5">{(costs as any).hiredDriversDescription}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).hiredDrivers)}</td>
                                </tr>
                              )}
                              {"accommodation" in costs && (costs as any).accommodation > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">Accommodation</div>
                                      {(costs as any).accommodationDescription && (
                                        <div className="text-xs text-slate-500 mt-0.5">{(costs as any).accommodationDescription}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).accommodation)}</td>
                                </tr>
                              )}
                              {"otherLabel" in costs && "otherAmount" in costs && (costs as any).otherLabel && (costs as any).otherAmount > 0 && (
                                <tr>
                                  <td className="px-2 py-1">
                                    <div>
                                      <div className="font-medium">{(costs as any).otherLabel}</div>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-right">{peso((costs as any).otherAmount)}</td>
                                </tr>
                              )}
                              {Array.isArray((costs as any).otherItems) &&
                                (costs as any).otherItems.map(
                                  (item: { label: string; amount: number; description?: string }, i: number) =>
                                    item?.amount > 0 && (
                                      <tr key={i}>
                                        <td className="px-2 py-1">
                                          <div>
                                            <div className="font-medium">{item.label}</div>
                                            {item.description && (
                                              <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-2 py-1 text-right">{peso(item.amount)}</td>
                                      </tr>
                                    )
                                )}
                            </tbody>
                          </table>
                        )}
                        {hasCosts && !expenseBreakdown && (
                          <div className="mt-4 pt-4 border-t border-slate-300">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-900">Total Budget</span>
                              <span className="text-lg font-bold text-[#7A0010]">
                                {peso(totalCost)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Endorsement / Signature */}
                <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                    {hasHeadApproval ? (
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                    Department Head Endorsement
                  </h4>

                  {/* Centered "signature over printed name" block */}
                  <div className="flex flex-col items-center mt-2">
                    {hasAnyHeadApproval ? (
                      <>
                        {/* Get head signature from the API response - check parent, direct head, and VP (if VP is head) */}
                        {(() => {
                          // Priority: parent_head_signature > head_signature > vp_signature (if VP is head)
                          let signature: string | null = null;
                          
                          const payload = (row as any)?.payload;
                          // Check parent head signature first
                          if ((row as any)?.parent_head_signature || payload?.parent_head_signature) {
                            signature = (row as any).parent_head_signature || payload?.parent_head_signature;
                          }
                          // Then check direct head signature
                          else if ((row as any)?.head_signature || payload?.head_signature) {
                            signature = (row as any).head_signature || payload?.head_signature;
                          }
                          // Then check VP signature if VP is head
                          else if (hasVpApproval && vpIsHead && ((row as any)?.vp_signature || payload?.vp_signature)) {
                            signature = (row as any).vp_signature || payload?.vp_signature;
                          }
                          // Fallback to travelOrder signature
                          else if (row.travelOrder?.endorsedByHeadSignature) {
                            signature = row.travelOrder.endorsedByHeadSignature;
                          }
                          
                          console.log("🔍 Signature check:", {
                            parent_head_signature: !!(row as any)?.parent_head_signature,
                            head_signature: !!(row as any)?.head_signature,
                            vp_signature: !!(row as any)?.vp_signature,
                            vpIsHead,
                            hasVpApproval,
                            vpApproverExists: !!vpApprover,
                            finalSignature: signature ? "EXISTS" : "NULL",
                            signatureType: typeof signature
                          });
                          
                          return signature ? (
                            <img
                              src={signature}
                              alt="Head Signature"
                              className="h-16 object-contain -mb-3"
                            />
                          ) : (
                            <div className="h-16" />
                          );
                        })()}

                        {/* signature line */}
                        <div className="w-64 border-t border-neutral-500" />

                        {/* printed name - get from approver (parent or direct) or fallback */}
                        <p className="mt-1 text-sm font-medium text-center">
                          {approverToUse?.name || row.travelOrder?.endorsedByHeadName || "—"}
                        </p>

                        {/* role + department - use approver's department */}
                        <p className="text-xs text-neutral-500 text-center">
                          {hasParentHeadApproval ? "Parent " : ""}Dept. Head{deptName ? `, ${deptName}` : ""}
                        </p>

                        {/* optional date */}
                        {(() => {
                          const payload = (row as any)?.payload;
                          const parentHeadDate = (row as any)?.parent_head_approved_at || payload?.parent_head_approved_at;
                          const headDate = (row as any)?.head_approved_at || payload?.head_approved_at;
                          const vpDate = ((row as any)?.vp_approved_at || payload?.vp_approved_at) && vpApprover?.is_head 
                            ? ((row as any)?.vp_approved_at || payload?.vp_approved_at) 
                            : null;
                          const dateToShow = parentHeadDate || headDate || vpDate || row.travelOrder?.endorsedByHeadDate;
                          
                          return dateToShow ? (
                            <p className="text-xs text-neutral-500">
                              {dateToShow && typeof dateToShow === 'string' 
                                ? new Date(dateToShow).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : dateToShow}
                            </p>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <>
                        {/* Awaiting endorsement - show empty signature line */}
                        <div className="h-16" />
                        <div className="w-64 border-t border-neutral-500" />
                        <p className="mt-1 text-sm font-medium text-center text-slate-400">
                          Awaiting Department Head Endorsement
                        </p>
                        <p className="text-xs text-neutral-400 text-center mt-1">
                          Signature pending
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Transportation Details */}
              {(() => {
                const payload = (row as any)?.payload;
                const transportation = payload?.transportation || (row as any)?.transportation;
                const pickupLocation = (row as any).pickup_location || transportation?.pickup_location || row.travelOrder?.pickupLocation;
                const pickupTime = (row as any).pickup_time || transportation?.pickup_time || row.travelOrder?.pickupTime;
                const pickupContact = (row as any).pickup_contact_number || transportation?.pickup_contact_number || row.travelOrder?.pickupContactNumber;
                const pickupInstructions = (row as any).pickup_special_instructions || transportation?.pickup_special_instructions || row.travelOrder?.pickupSpecialInstructions;
                const dropoffLocation = (row as any).dropoff_location || transportation?.dropoff_location || row.travelOrder?.dropoffLocation;
                const dropoffTime = (row as any).dropoff_time || transportation?.dropoff_time || row.travelOrder?.dropoffTime;
                const parkingRequired = (row as any).parking_required || transportation?.parking_required || row.travelOrder?.parkingRequired;
                const ownVehicleDetails = (row as any).own_vehicle_details || transportation?.own_vehicle_details || row.travelOrder?.ownVehicleDetails;
                const returnTransportationSame = (row as any).return_transportation_same !== undefined ? (row as any).return_transportation_same : (transportation?.return_transportation_same !== undefined ? transportation.return_transportation_same : row.travelOrder?.returnTransportationSame);
                
                if (pickupLocation || pickupTime || pickupContact || dropoffLocation || dropoffTime || ownVehicleDetails) {
                  return (
                    <section className="rounded-xl bg-gradient-to-br from-green-50 to-slate-100 border border-green-200 p-5">
                      <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                        <Car className="h-5 w-5 text-green-600" />
                        Transportation Arrangement Details
                      </h3>
                      <div className="space-y-4">
                        {/* Pickup Details */}
                        {(pickupLocation || pickupTime || pickupContact) && (
                          <div className="bg-white rounded-lg border border-green-200 p-4">
                            <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Pickup Details
                            </h4>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {pickupLocation && (
                                <>
                                  <dt className="font-semibold text-slate-600">Location</dt>
                                  <dd className="text-slate-900">{pickupLocation}</dd>
                                </>
                              )}
                              {pickupTime && (
                                <>
                                  <dt className="font-semibold text-slate-600">Time</dt>
                                  <dd className="text-slate-900">{pickupTime}</dd>
                                </>
                              )}
                              {pickupContact && (
                                <>
                                  <dt className="font-semibold text-slate-600">Contact Number</dt>
                                  <dd className="text-slate-900">{pickupContact}</dd>
                                </>
                              )}
                              {pickupInstructions && (
                                <>
                                  <dt className="font-semibold text-slate-600 col-span-2">Special Instructions</dt>
                                  <dd className="text-slate-900 col-span-2">{pickupInstructions}</dd>
                                </>
                              )}
                            </dl>
                          </div>
                        )}

                        {/* Return/Dropoff Details */}
                        {(dropoffLocation || dropoffTime || (returnTransportationSame === false)) && (
                          <div className="bg-white rounded-lg border border-green-200 p-4">
                            <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Return Transportation
                            </h4>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {returnTransportationSame === true && (
                                <dd className="text-slate-900 col-span-2">Same as departure arrangement</dd>
                              )}
                              {dropoffLocation && (
                                <>
                                  <dt className="font-semibold text-slate-600">Drop-off Location</dt>
                                  <dd className="text-slate-900">{dropoffLocation}</dd>
                                </>
                              )}
                              {dropoffTime && (
                                <>
                                  <dt className="font-semibold text-slate-600">Drop-off Time</dt>
                                  <dd className="text-slate-900">{dropoffTime}</dd>
                                </>
                              )}
                              {parkingRequired && (
                                <>
                                  <dt className="font-semibold text-slate-600 col-span-2">Parking Required</dt>
                                  <dd className="text-slate-900 col-span-2">Yes</dd>
                                </>
                              )}
                            </dl>
                          </div>
                        )}

                        {/* Own Vehicle Details */}
                        {ownVehicleDetails && (
                          <div className="bg-white rounded-lg border border-green-200 p-4">
                            <h4 className="text-sm font-bold text-green-900 mb-2">Own Vehicle Details</h4>
                            <p className="text-sm text-slate-900">{ownVehicleDetails}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                }
                return null;
              })()}

              {/* Attachments */}
              {(() => {
                const payload = (row as any)?.payload;
                let attachments = payload?.attachments || (row as any)?.attachments;
                
                // Parse if string (JSONB)
                if (typeof attachments === 'string') {
                  try {
                    attachments = JSON.parse(attachments);
                  } catch (e) {
                    console.error("[RequestDetailsModal] Failed to parse attachments:", e);
                    attachments = null;
                  }
                }
                
                if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                  return (
                    <section className="rounded-xl bg-gradient-to-br from-purple-50 to-slate-100 border border-purple-200 p-5">
                      <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Supporting Documents ({attachments.length})
                      </h3>
                      <div className="space-y-2">
                        {attachments.map((file: any, idx: number) => (
                          <a
                            key={idx}
                            href={file.url || file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            <svg className="h-5 w-5 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{file.name || file.filename || `Document ${idx + 1}`}</p>
                              {file.size && (
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                              )}
                            </div>
                            <svg className="h-4 w-4 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </section>
                  );
                }
                return null;
              })()}

              {/* Assignments + Admin Note */}
              <section className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
                <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                  <Car className="h-5 w-5 text-[#7A0010]" />
                  Vehicle & Driver Assignment
                </h3>

                {/* Transportation Mode Badge - Always show if we have the data */}
                {((row as any).vehicle_mode || row.travelOrder?.vehicleMode) ? (
                  <div className="mb-4 p-4 rounded-lg border-2 bg-white shadow-sm" style={{
                    borderColor: (row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned' ? '#10b981' : (row as any).vehicle_mode === 'rent' || row.travelOrder?.vehicleMode === 'rent' ? '#f59e0b' : '#3b82f6'
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                        backgroundColor: (row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned' ? '#d1fae5' : (row as any).vehicle_mode === 'rent' || row.travelOrder?.vehicleMode === 'rent' ? '#fef3c7' : '#dbeafe'
                      }}>
                        <Car className="h-5 w-5" style={{
                          color: (row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned' ? '#059669' : (row as any).vehicle_mode === 'rent' || row.travelOrder?.vehicleMode === 'rent' ? '#d97706' : '#2563eb'
                        }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wide" style={{
                          color: (row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned' ? '#059669' : (row as any).vehicle_mode === 'rent' || row.travelOrder?.vehicleMode === 'rent' ? '#d97706' : '#2563eb'
                        }}>
                          Transportation Mode
                        </div>
                        <div className="text-base font-bold text-gray-900 mt-0.5">
                          {((row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned') && 'Personal Vehicle (Owned)'}
                          {((row as any).vehicle_mode === 'institutional' || row.travelOrder?.vehicleMode === 'institutional') && 'University Vehicle (School Service)'}
                          {((row as any).vehicle_mode === 'rent' || row.travelOrder?.vehicleMode === 'rent') && 'Rental Vehicle'}
                        </div>
                        {((row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned') && (
                          <p className="text-xs text-gray-600 mt-1 italic">Requester will use their own vehicle - no assignment needed</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-orange-900">Vehicle Mode Not Set</p>
                        <p className="text-xs text-orange-700 mt-0.5">
                          This request was submitted before vehicle mode tracking was enabled. Please run the database migration to populate vehicle mode data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Preferences - Requester's Choice (only for institutional/rent AND when we have vehicle_mode data) */}
                {((row as any).vehicle_mode || row.travelOrder?.vehicleMode) && ((row as any).vehicle_mode !== 'owned' && row.travelOrder?.vehicleMode !== 'owned') && (
                <div className="mb-6 rounded-lg bg-blue-50 border-2 border-blue-300 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <h4 className="text-sm font-bold text-blue-900">SERVICE PREFERENCES</h4>
                    <span className="ml-auto text-xs font-medium bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Requester's Choice</span>
                  </div>
                  <p className="text-xs text-blue-700 mb-3 italic">Suggestions from requester (Admin will make final assignment)</p>
                  
                  {(preferredDriver || preferredVehicle) ? (
                    <div className="grid grid-cols-2 gap-3">
                      {preferredDriver && (
                        <div className="bg-white rounded border border-blue-200 p-2.5">
                          <div className="text-[10px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Preferred Driver
                          </div>
                          <div className="text-sm font-semibold text-blue-900">{preferredDriver}</div>
                        </div>
                      )}
                      {preferredVehicle && (
                        <div className="bg-white rounded border border-blue-200 p-2.5">
                          <div className="text-[10px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            Preferred Vehicle
                          </div>
                          <div className="text-sm font-semibold text-blue-900">{preferredVehicle}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-6 text-neutral-500">
                      <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <div className="text-center">
                        <div className="text-sm font-medium text-neutral-600">No driver or vehicle preferences</div>
                        <div className="text-xs text-neutral-500 mt-0.5">Admin will assign resources</div>
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Driver/Vehicle Assignment */}
                {/* Show dropdowns if: no vehicle_mode data (backwards compat) OR vehicle_mode is institutional/rent */}
                {(!((row as any).vehicle_mode || row.travelOrder?.vehicleMode) || ((row as any).vehicle_mode !== 'owned' && row.travelOrder?.vehicleMode !== 'owned')) ? (
                <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Driver</label>
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                    >
                      <option value="">— Select Driver —</option>
                      {loadingOptions ? (
                        <option disabled>Loading...</option>
                      ) : (
                        drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))
                      )}
                    </select>
                    {isApproved && (driver !== ((row as any)?.assigned_driver_id || "")) && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Changes will update assignment</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Vehicle</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                    >
                      <option value="">— Select Vehicle —</option>
                      {loadingOptions ? (
                        <option disabled>Loading...</option>
                      ) : (
                        vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))
                      )}
                    </select>
                    {isApproved && (vehicle !== ((row as any)?.assigned_vehicle_id || "")) && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Changes will update assignment</p>
                    )}
                  </div>
                </div>
                
                {/* Save Assignment Changes Button (shown when approved and changes made) */}
                {isApproved && (
                  (driver !== ((row as any)?.assigned_driver_id || "") || 
                   vehicle !== ((row as any)?.assigned_vehicle_id || "")) && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/schedule/assign", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                requestId: (row as any).id,
                                driverId: driver || null,
                                vehicleId: vehicle || null,
                              }),
                            });
                            const data = await res.json();
                            if (data.ok) {
                              toast.success("Assignment Updated", "Driver and vehicle assignment has been updated");
                              onApprove?.(); // Refresh the list
                            } else {
                              toast.error("Update Failed", data.error || "Failed to update assignment");
                            }
                          } catch (error: any) {
                            toast.error("Update Failed", error.message || "Failed to update assignment");
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        💾 Save Assignment Changes
                      </button>
                    </div>
                  )
                )}
              </>
            ) : (
                  /* Only show this green box if vehicle_mode is explicitly 'owned' */
                  ((row as any).vehicle_mode === 'owned' || row.travelOrder?.vehicleMode === 'owned') && (
                    <div className="text-center py-6 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-green-900">No Assignment Required</p>
                        <p className="text-xs text-green-700">Requester will use their personal vehicle</p>
                      </div>
                    </div>
                  )
                )}

                {/* Admin Notes Textarea */}
                <div className="mt-4">
                    <label className="block text-xs font-medium mb-1">
                      Admin Notes <span className="text-red-600">*</span>
                      <span className="text-xs font-normal text-neutral-500 ml-2">(Required)</span>
                    </label>
                    
                    {/* Quick Fill Buttons */}
                    {!isApproved && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAdminNotes("Vehicle and driver assigned. Ready for processing.")}
                          className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          ✓ Assigned
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminNotes("Request processed. All requirements met. Proceed to comptroller.")}
                          className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          ✓ Processed
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminNotes("Request processed. No budget required. Proceed to HR.")}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          ✓ No Budget
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminNotes("Request requires revision. Please review and resubmit.")}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          ✗ Needs Revision
                        </button>
                      </div>
                    )}
                    
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      disabled={isApproved}
                      placeholder="Required: Add notes for comptroller/HR (e.g., vehicle ownership, special instructions...)"
                      rows={3}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                        isApproved 
                          ? "bg-neutral-100 text-neutral-500 border-neutral-300" 
                          : adminNotes.trim() === ""
                          ? "border-red-300 focus:ring-red-500 bg-red-50"
                          : "border-neutral-300 focus:ring-[#7A0010]"
                      }`}
                    />
                    {!isApproved && adminNotes.trim() === "" && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Admin notes are required before approval
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAdminNotes("Requester will use their own personal vehicle. No university vehicle or driver assignment needed.")}
                        disabled={isApproved}
                        className="text-xs px-2 py-1 rounded border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Personal Vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminNotes("University vehicle and driver assigned as shown above.")}
                        disabled={isApproved}
                        className="text-xs px-2 py-1 rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        School Service
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminNotes("Rental vehicle required. Approved for rental service.")}
                        disabled={isApproved}
                        className="text-xs px-2 py-1 rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Rental Approved
                      </button>
                    </div>
                </div>
              </section>

              {/* Seminar details (if present) */}
              <SeminarDetails seminar={row.seminar} />
              
              {/* Submission History - shown below modal content */}
              {historyEntries.length > 0 && (
                <SubmissionHistoryUI entries={historyEntries} />
              )}
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handlePrintTravelPDF}
                  className="flex items-center gap-2 rounded-md bg-[#7A0010] hover:bg-[#5c000c] px-4 py-2 text-sm text-white transition"
                >
                  <FileDown className="h-4 w-4" />
                  Travel Order PDF
                </button>
                {row.seminar && (
                  <button
                    onClick={() => generateSeminarPDF(row)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white transition"
                  >
                    <FileDown className="h-4 w-4" />
                    Seminar PDF
                  </button>
                )}
              </div>

              {/* Right side: actions or status */}
              {!isApproved ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={requestApproval}
                    disabled={!canAdminApprove || adminNotes.trim() === "" || isApproving}
                    title={adminNotes.trim() === "" ? "Admin notes are required" : isApproving ? "Processing..." : ""}
                    className={`rounded-md px-4 py-2 text-sm text-white transition ${
                      canAdminApprove && adminNotes.trim() !== "" && !isApproving
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    {isApproving ? "Processing..." : "Approve"}
                  </button>
                  {onReject && (
                    <button
                      onClick={onReject}
                      className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm text-white transition"
                    >
                      Reject
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Approved{row.approvedBy ? ` by ${row.approvedBy}` : ""}{approvedWhen ? ` • ${approvedWhen}` : ""}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Signature dialog (Approve flow) */}
      <Dialog open={signOpen} onClose={() => setSignOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="relative z-[61] w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Approve — Signature</h3>
            <button onClick={() => setSignOpen(false)} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <SignaturePad
            height={220}
            value={null}
            onSave={(dataUrl) => setSigDataUrl(dataUrl)}
            onClear={() => setSigDataUrl(null)}
            hideSaveButton
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setSignOpen(false)}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmSignature}
              disabled={!sigDataUrl || isApproving}
              className={`rounded-md px-4 py-2 text-sm text-white transition ${
                sigDataUrl && !isApproving ? "bg-green-600 hover:bg-green-700" : "bg-neutral-400 cursor-not-allowed"
              }`}
            >
              {isApproving 
                ? "Processing..." 
                : sigDataUrl 
                  ? "Continue to Select Approver" 
                  : "Approve"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => {
            setShowApproverSelection(false);
            setSignOpen(true); // Return to signature modal
          }}
          onSelect={(approverId, approverRole) => {
            setSelectedApproverId(approverId);
            setSelectedApproverRole(approverRole);
            setShowApproverSelection(false);
            proceedWithApproval();
          }}
          title="Select Next Approver"
          description={`Request ${row?.request_number || row?.id} - Choose where to send this request after approval`}
          options={approverOptions}
          currentRole="admin"
          allowReturnToRequester={false}
          defaultApproverId={defaultApproverId}
          defaultApproverName={defaultApproverName}
          allowAllUsers={true}
          fetchAllUsers={async () => {
            try {
              const allUsersRes = await fetch("/api/users/all");
              const allUsersData = await allUsersRes.json();
              if (allUsersData.ok && allUsersData.data) {
                return allUsersData.data.map((u: any) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  profile_picture: u.profile_picture,
                  phone: u.phone,
                  position: u.position,
                  department: u.department,
                  role: u.role,
                  roleLabel: u.roleLabel
                }));
              }
              return [];
            } catch (err) {
              console.error("[AdminRequestDetailsModal] Error fetching all users:", err);
              return [];
            }
          }}
        />
      )}
    </Dialog>
  );
}
