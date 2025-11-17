// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, FileDown, CheckCircle, AlertTriangle, MapPin, User, Car, CheckCircle2, PenTool, Clock, Users } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { generateRequestPDF } from "@/lib/admin/requests/pdfWithTemplate";
import { generateSeminarPDF } from "@/lib/admin/requests/pdfSeminar";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

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
        const [driversRes, vehiclesRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch('/api/vehicles')
        ]);
        
        if (driversRes.ok) {
          const driversData = await driversRes.json();
          setDrivers(driversData.ok && driversData.data ? driversData.data : []);
        }
        
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData.ok && vehiclesData.data ? vehiclesData.data : []);
        }
      } catch (err) {
        console.error('[RequestDetailsModal] Failed to fetch options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    
    if (open) fetchOptions();
  }, [open]);

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
          // Filter only confirmed requesters
          const confirmed = data.data.filter((req: any) => req.status === 'confirmed');
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

  const deptName = row?.travelOrder?.department || "";

  // Derived rules for routing after Admin approval
  const usesVehicle = React.useMemo(() => {
    const t: any = row?.travelOrder || {};
    const vm = (t.vehicleMode || "").toString().toLowerCase();
    // Treat any non-empty mode as vehicle use; if you have "none" as value, it will be skipped
    return !!vm && vm !== "none";
  }, [row?.travelOrder]);

  const requiresComptroller = usesVehicle || totalCost > 0;

  // Can Admin approve now?
  const awaitingHead = row?.status === "pending_head";
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
      row.status === "executive_pending");

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
  
  // Build submission history entries
  const historyEntries = React.useMemo(() => {
    if (!row) return [];
    const entries = [];
    
    console.log("🔍 Building history entries for request:", (row as any).id);
    console.log("🔍 Head signature:", (row as any).head_signature ? "EXISTS" : "NULL");
    console.log("🔍 Admin signature:", (row as any).admin_signature ? "EXISTS" : "NULL");
    console.log("🔍 Row admin data:", {
      admin_approved_at: (row as any).admin_approved_at,
      admin_approved_by: (row as any).admin_approved_by,
      admin_signature: (row as any).admin_signature,
      admin_approver: (row as any).admin_approver,
    });
    
    // Submitted
    if (row.createdAt) {
      entries.push({
        action: "Request Submitted",
        by: (row as any).requester?.name || (row as any).requester?.email || "Unknown",
        timestamp: row.createdAt,
        icon: "submitted" as const,
      });
    }
    
    // Head Approved
    if ((row as any).head_approved_at) {
      const headSig = (row as any).head_signature || null;
      console.log("✅ Adding Head Approved entry with signature:", headSig ? "YES" : "NO");
      entries.push({
        action: "Head Approved",
        by: row.travelOrder?.endorsedByHeadName || "Department Head",
        timestamp: (row as any).head_approved_at,
        icon: "approved" as const,
        signature: headSig,
      });
    }
    
    // Admin Approved
    if ((row as any).admin_approved_at) {
      const adminName = (row as any).admin_approver?.name || (row as any).admin_approver?.email || "Trizzia Maree Casino";
      const adminSig = (row as any).admin_signature || null;
      console.log("✅ Adding Admin Approved entry with signature:", adminSig ? "YES" : "NO");
      entries.push({
        action: "Admin Approved",
        by: adminName,
        timestamp: (row as any).admin_approved_at,
        icon: "approved" as const,
        signature: adminSig,
      });
    }
    
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
          
          const comptrollerData = await comptrollerRes.json().catch(() => ({ ok: false, approvers: [] }));
          const hrData = await hrRes.json().catch(() => ({ ok: false, approvers: [] }));
          
          const options: any[] = [];
          
          if (comptrollerData.ok && comptrollerData.approvers) {
            options.push(...comptrollerData.approvers.map((a: any) => ({
              ...a,
              role: 'comptroller',
              roleLabel: 'Comptroller'
            })));
          }
          
          if (hrData.ok && hrData.approvers) {
            options.push(...hrData.approvers.map((a: any) => ({
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
      toast({
        kind: "success",
        message: `Request approved and sent to ${approverLabel}!`,
        timeoutMs: 4000
      });

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
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 ease-out" 
        style={{
          animation: open ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in'
        }}
        aria-hidden="true" 
      />

      {/* Modal with scale + fade animation */}
      <div 
        className="relative z-50 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 ease-out"
        style={{
          animation: open ? 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'popOut 0.2s ease-in',
          transformOrigin: 'center center'
        }}
      >
        {!row ? (
          <div className="text-center text-sm text-neutral-500">No request selected</div>
        ) : (
          <div 
            className="animate-fadeInUp"
            style={{
              animation: 'fadeInUp 0.4s ease-out 0.1s both'
            }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] flex items-center justify-center shadow-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Travel Request Overview
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      Approved
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete request details and approval history</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="ml-auto rounded-xl p-2.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

            {/* Scrollable body */}
            <div className="space-y-6 max-h-[72vh] overflow-y-auto pr-2">
              {/* Travel Order */}
              <section className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
                <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Travel Order Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <dt className="font-semibold text-slate-600">Date Submitted</dt>
                  <dd className="text-slate-900">{formatDate(row.travelOrder?.date || row.createdAt)}</dd>

                  <dt className="font-semibold text-slate-600">Requesting Person</dt>
                  <dd>
                    <div className="space-y-3">
                      {/* Main Requester */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <NameWithProfile
                          name={(row as any).requester_name || row.travelOrder?.requestingPerson || "—"}
                          profile={{
                            id: (row as any).requester?.id || '',
                            name: (row as any).requester_name || (row as any).requester?.name || '',
                            email: (row as any).requester?.email,
                            department: (row as any).requester?.department || (row as any).department?.name,
                            position: (row as any).requester?.position_title,
                            profile_picture: (row as any).requester?.profile_picture,
                          }}
                        />
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
                      {getRequesterSig(row.travelOrder) && (
                        <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg">
                          <img
                            src={getRequesterSig(row.travelOrder)!}
                            alt="Requester signature"
                            className="h-10 w-auto max-w-[180px] object-contain mx-auto"
                            title="Requester e-signature"
                          />
                          <p className="text-center text-xs text-slate-500 mt-1">Digital Signature</p>
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

                  <dt className="font-semibold text-slate-600">Department</dt>
                  <dd className="text-slate-900">{deptName || "—"}</dd>

                  <dt className="font-semibold">Destination</dt>
                  <dd>
                    <div className="flex items-center gap-2">
                      <span>{row.travelOrder?.destination || "—"}</span>
                      {row.travelOrder?.destination && (
                        <button
                          onClick={() => {
                            const query = encodeURIComponent(row.travelOrder?.destination || "");
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

                  <dt className="font-semibold text-slate-600">Departure Date</dt>
                  <dd className="text-slate-900">{formatDate(row.travelOrder?.departureDate)}</dd>

                  <dt className="font-semibold text-slate-600">Return Date</dt>
                  <dd className="text-slate-900">{formatDate(row.travelOrder?.returnDate)}</dd>

                  <dt className="font-semibold text-slate-600">Purpose of Travel</dt>
                  <dd className="col-span-1 text-slate-900">{row.travelOrder?.purposeOfTravel || "—"}</dd>
                </dl>

                {/* Estimated costs */}
                {row.travelOrder?.costs && (
                  <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
                    <h4 className="mb-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-lg">₱</span>
                      Budget Breakdown
                    </h4>
                    <table className="w-full text-sm">
                      <tbody>
                        {"food" in row.travelOrder.costs && (row.travelOrder.costs as any).food > 0 && (
                          <tr>
                            <td className="px-2 py-1">
                              <div>
                                <div className="font-medium">Food</div>
                                {(row.travelOrder.costs as any).foodDescription && (
                                  <div className="text-xs text-slate-500 mt-0.5">{(row.travelOrder.costs as any).foodDescription}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).food)}</td>
                          </tr>
                        )}
                        {"driversAllowance" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).driversAllowance > 0 && (
                            <tr>
                              <td className="px-2 py-1">
                                <div>
                                  <div className="font-medium">Driver's allowance</div>
                                  {(row.travelOrder.costs as any).driversAllowanceDescription && (
                                    <div className="text-xs text-slate-500 mt-0.5">{(row.travelOrder.costs as any).driversAllowanceDescription}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).driversAllowance)}</td>
                            </tr>
                          )}
                        {"rentVehicles" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).rentVehicles > 0 && (
                            <tr>
                              <td className="px-2 py-1">
                                <div>
                                  <div className="font-medium">Rent vehicles</div>
                                  {(row.travelOrder.costs as any).rentVehiclesDescription && (
                                    <div className="text-xs text-slate-500 mt-0.5">{(row.travelOrder.costs as any).rentVehiclesDescription}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).rentVehicles)}</td>
                            </tr>
                          )}
                        {"hiredDrivers" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).hiredDrivers > 0 && (
                            <tr>
                              <td className="px-2 py-1">
                                <div>
                                  <div className="font-medium">Hired drivers</div>
                                  {(row.travelOrder.costs as any).hiredDriversDescription && (
                                    <div className="text-xs text-slate-500 mt-0.5">{(row.travelOrder.costs as any).hiredDriversDescription}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).hiredDrivers)}</td>
                            </tr>
                          )}
                        {"accommodation" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).accommodation > 0 && (
                            <tr>
                              <td className="px-2 py-1">
                                <div>
                                  <div className="font-medium">Accommodation</div>
                                  {(row.travelOrder.costs as any).accommodationDescription && (
                                    <div className="text-xs text-slate-500 mt-0.5">{(row.travelOrder.costs as any).accommodationDescription}</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).accommodation)}</td>
                            </tr>
                          )}

                        {"otherLabel" in row.travelOrder.costs &&
                          "otherAmount" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).otherLabel &&
                          (row.travelOrder.costs as any).otherAmount > 0 && (
                            <tr>
                              <td className="px-2 py-1">
                                <div>
                                  <div className="font-medium">{(row.travelOrder.costs as any).otherLabel}</div>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).otherAmount)}</td>
                            </tr>
                          )}

                        {Array.isArray((row.travelOrder.costs as any).otherItems) &&
                          (row.travelOrder.costs as any).otherItems.map(
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

                        <tr className="border-t font-semibold">
                          <td className="px-2 py-1">Total</td>
                          <td className="px-2 py-1 text-right">{peso(totalCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Endorsement / Signature */}
                <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Department Head Endorsement
                  </h4>

                  {/* Centered "signature over printed name" block */}
                  <div className="flex flex-col items-center mt-2">
                    {row.travelOrder?.endorsedByHeadSignature ? (
                      <img
                        src={row.travelOrder.endorsedByHeadSignature}
                        alt="Signature"
                        className="h-16 object-contain -mb-3"
                      />
                    ) : (
                      <div className="h-16" />
                    )}

                    {/* signature line */}
                    <div className="w-64 border-t border-neutral-500" />

                    {/* printed name */}
                    <p className="mt-1 text-sm font-medium text-center">
                      {row.travelOrder?.endorsedByHeadName || "—"}
                    </p>

                    {/* role + department */}
                    <p className="text-xs text-neutral-500 text-center">
                      Dept. Head{deptName ? `, ${deptName}` : ""}
                    </p>

                    {/* optional date */}
                    {row.travelOrder?.endorsedByHeadDate && (
                      <p className="text-xs text-neutral-500">{row.travelOrder.endorsedByHeadDate}</p>
                    )}
                  </div>
                </div>
              </section>

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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Driver</label>
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      disabled={isApproved}
                      className={`w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010] ${
                        isApproved ? "bg-neutral-100 text-neutral-500" : ""
                      }`}
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
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Assigned Vehicle</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      disabled={isApproved}
                      className={`w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010] ${
                        isApproved ? "bg-neutral-100 text-neutral-500" : ""
                      }`}
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
                  </div>
                </div>
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

            {/* Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
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
          </div>
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
        />
      )}
    </Dialog>
  );
}
