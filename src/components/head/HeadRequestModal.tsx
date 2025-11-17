// src/components/head/HeadRequestModal.ui.tsx
"use client";

import React from "react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { Users, UserCircle, User, Car, UserCog } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";

type Props = {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  viewOnly?: boolean; // For history - no approval actions
};

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HeadRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
  viewOnly = false,
}: Props) {
  // New schema: data is directly on request object, not in payload
  const t = request;
  const toast = useToast();
  
  // Comments/rejection reason
  const [comments, setComments] = React.useState("");
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [headName, setHeadName] = React.useState<string>(
    request.head_signed_by ?? ""
  );
  const [headProfile, setHeadProfile] = React.useState<any>(null);
  const [headSignature, setHeadSignature] = React.useState<string>(
    request.head_signature ?? ""
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [requesterSignature, setRequesterSignature] = React.useState<string>(
    request.requester_signature ?? ""
  );
  const [preferredDriverName, setPreferredDriverName] = React.useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = React.useState<string>("");
  const [showApproverSelection, setShowApproverSelection] = React.useState(false);
  const [approverOptions, setApproverOptions] = React.useState<any[]>([]);
  const [loadingApprovers, setLoadingApprovers] = React.useState(false);

  // Auto-load saved signature and head info
  React.useEffect(() => {
    async function loadData() {
      try {
        // Load current user (head) info
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        
        if (meData) {
          const name = meData.name || meData.email || "";
          setHeadName(name);
          setHeadProfile(meData);
        }

        // Load saved signature if not already present
        if (!headSignature) {
          const sigRes = await fetch("/api/signature");
          const sigData = await sigRes.json();
          if (sigData.ok && sigData.signature) {
            setHeadSignature(sigData.signature);
          }
        }
        
        // Load requester signature from request data
        if (request.requester_signature) {
          setRequesterSignature(request.requester_signature);
        }
      } catch (err) {
        console.error("[HeadRequestModal] Failed to load data:", err);
      }
    }
    
    loadData();
  }, [request.requester_signature]);
  
  // Load preferred driver/vehicle names
  React.useEffect(() => {
    async function loadPreferences() {
      try {
        // Fetch driver name if ID exists
        if (t.preferred_driver_id) {
          const driverRes = await fetch(`/api/drivers`);
          const driverData = await driverRes.json();
          if (driverData.ok && driverData.data) {
            const driver = driverData.data.find((d: any) => d.id === t.preferred_driver_id);
            if (driver) {
              setPreferredDriverName(driver.name);
            }
          }
        }
        
        // Fetch vehicle name if ID exists
        if (t.preferred_vehicle_id) {
          const vehicleRes = await fetch(`/api/vehicles`);
          const vehicleData = await vehicleRes.json();
          if (vehicleData.ok && vehicleData.data) {
            const vehicle = vehicleData.data.find((v: any) => v.id === t.preferred_vehicle_id);
            if (vehicle) {
              setPreferredVehicleName(`${vehicle.name} • ${vehicle.plate_number}`);
            }
          }
        }
      } catch (err) {
        console.error("[HeadRequestModal] Failed to load preferences:", err);
      }
    }
    
    if (t.preferred_driver_id || t.preferred_vehicle_id) {
      loadPreferences();
    }
  }, [t.preferred_driver_id, t.preferred_vehicle_id]);

  // New schema uses expense_breakdown array
  const expenseBreakdown = t.expense_breakdown || [];
  const totalCost = t.total_budget || expenseBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  
  // Debug logging
  console.log("[HeadRequestModal] Request data:", t);
  console.log("[HeadRequestModal] Preferred driver ID:", t.preferred_driver_id);
  console.log("[HeadRequestModal] Preferred vehicle ID:", t.preferred_vehicle_id);
  console.log("[HeadRequestModal] Expense breakdown:", expenseBreakdown);
  console.log("[HeadRequestModal] Total cost:", totalCost);
  
  // Log each expense for debugging
  expenseBreakdown.forEach((exp: any, i: number) => {
    console.log(`[HeadRequestModal] Expense ${i}:`, {
      item: exp.item,
      description: exp.description,
      amount: exp.amount
    });
  });

  async function doApprove() {
    if (submitting) return;
    
    // Validate comments
    if (!comments.trim() || comments.trim().length < 10) {
      toast.warning("Comments Required", "Please provide comments (minimum 10 characters)");
      return;
    }

    // Check if we need to show approver selection
    // Head can send to: Admin (default) or return to requester
    // If there's a parent department, can also send to parent head
    const needsApproverSelection = true; // Always show selection for flexibility
    
    if (needsApproverSelection) {
      // Fetch available approvers - Head can send to Admin or return to requester
      // Also check for parent head if department has parent
      setLoadingApprovers(true);
      
      try {
        // Fetch admins using the correct endpoint
        console.log("[HeadRequestModal] Fetching admins from /api/approvers/list?role=admin");
        const approversRes = await fetch(`/api/approvers/list?role=admin`);
        
        if (!approversRes.ok) {
          console.error("[HeadRequestModal] ❌ API request failed:", approversRes.status, approversRes.statusText);
          const errorText = await approversRes.text();
          console.error("[HeadRequestModal] Error response:", errorText);
          toast.warning("Warning", "Could not fetch admin list. You can still return the request to the requester.");
          setApproverOptions([]);
          setLoadingApprovers(false);
          setShowApproverSelection(true);
          return;
        }
        
        const approversData = await approversRes.json();
        
        console.log("[HeadRequestModal] Approvers list response:", {
          ok: approversData.ok,
          count: approversData.count,
          dataLength: approversData.data?.length || 0,
          error: approversData.error,
          data: approversData.data
        });
        
        let options: any[] = [];
        
        // Add admin options
        if (approversData.ok && approversData.data && approversData.data.length > 0) {
          // Map admin users to options
          const adminOptions = approversData.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            profile_picture: a.profile_picture,
            phone: a.phone,
            position: a.position || "Administrator",
            department: a.department,
            role: "admin",
            roleLabel: "Administrator"
          }));
          
          options.push(...adminOptions);
          console.log("[HeadRequestModal] ✅ Admin options count:", adminOptions.length);
          console.log("[HeadRequestModal] Admin options:", adminOptions.map(o => ({ name: o.name, email: o.email })));
        } else {
          console.warn("[HeadRequestModal] ⚠️ No admins found or API error:", {
            ok: approversData.ok,
            error: approversData.error,
            dataLength: approversData.data?.length || 0,
            count: approversData.count
          });
          if (approversData.error) {
            toast.warning("Warning", `Could not fetch admin list: ${approversData.error}. You can still return the request to the requester.`);
          } else {
            toast.warning("Warning", "No administrators found in the system. You can still return the request to the requester.");
          }
        }
        
        // Add VP options if this is a head request
        if (isHeadRequest && vpRes) {
          try {
            const vpData = await vpRes.json();
            if (vpData.ok && vpData.data && vpData.data.length > 0) {
              const vpOptions = vpData.data.map((v: any) => ({
                id: v.id,
                name: v.name,
                email: v.email,
                profile_picture: v.profile_picture,
                phone: v.phone,
                position: v.position || "Vice President",
                department: v.department,
                role: "vp",
                roleLabel: "Vice President"
              }));
              
              options.push(...vpOptions);
              console.log("[HeadRequestModal] ✅ VP options count:", vpOptions.length);
              console.log("[HeadRequestModal] VP options:", vpOptions.map(v => ({ name: v.name, email: v.email })));
            }
          } catch (vpErr) {
            console.error("[HeadRequestModal] Error fetching VP options:", vpErr);
          }
        }
        
        // Also check for parent department head if applicable
        if (request.department_id) {
          try {
            // Fetch department to check for parent
            const deptRes = await fetch(`/api/departments?id=${request.department_id}`);
            const deptData = await deptRes.json();
            
            const dept = deptData.departments?.[0] || deptData.data?.[0];
            if (dept?.parent_department_id) {
              console.log("[HeadRequestModal] Department has parent:", dept.parent_department_id);
              // Fetch parent department head
              const parentHeadRes = await fetch(`/api/approvers/list?role=head`);
              const parentHeadData = await parentHeadRes.json();
              
              if (parentHeadData.ok && parentHeadData.data) {
                const parentHeads = parentHeadData.data
                  .filter((h: any) => h.department_id === dept.parent_department_id)
                  .map((h: any) => ({
                    id: h.id,
                    name: h.name,
                    email: h.email,
                    profile_picture: h.profile_picture,
                    phone: h.phone,
                    position: h.position || "Department Head",
                    department: h.department,
                    role: "head",
                    roleLabel: "Parent Department Head"
                  }));
                
                if (parentHeads.length > 0) {
                  console.log("[HeadRequestModal] ✅ Found parent head(s):", parentHeads.length);
                  options = [...parentHeads, ...options];
                }
              }
            }
          } catch (deptErr) {
            console.error("[HeadRequestModal] Error fetching parent head:", deptErr);
          }
        }
        
        // Set options (even if empty, so modal can show "no approvers" message)
        setApproverOptions(options);
        setLoadingApprovers(false);
        setShowApproverSelection(true);
        return;
      } catch (err) {
        console.error("[HeadRequestModal] Error fetching approvers:", err);
        setLoadingApprovers(false);
        // Still show modal even if fetch fails, so user can return to requester
        setApproverOptions([]);
        setShowApproverSelection(true);
        toast.warning("Warning", "Could not fetch approvers. You can still return the request to the requester.");
        return;
      }
    }

    // If no selection needed, proceed with default (Admin)
    proceedWithApproval(null, "admin");
  }

  async function proceedWithApproval(selectedApproverId: string | null, selectedRole: string, returnReason?: string) {
    setSubmitting(true);
    try {
      const approvalDate = new Date().toISOString();
      const res = await fetch("/api/head", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          action: "approve",
          signature: headSignature,
          comments: comments.trim(),
          approved_at: approvalDate,
          next_approver_id: selectedApproverId, // Send to specific approver if selected
          next_approver_role: selectedRole,
          return_reason: returnReason || null
        }),
      });
      const j = await res.json();
      if (j.ok) {
        const roleLabel = selectedRole === "requester" ? "Requester" : 
                         selectedRole === "admin" ? "Admin" : "Next Approver";
        toast.success(
          "Approved Successfully!",
          `Request has been sent to ${roleLabel}`
        );
        setShowApproverSelection(false);
        onApproved(request.id);
      } else {
        toast.error("Approval Failed", j.error ?? "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("Approval Failed", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function doReject() {
    if (submitting) return;
    if (!comments.trim()) {
      toast.warning("Reason Required", "Please provide a reason for rejection.");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/head", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          id: t.id, 
          action: "reject",
          comments: comments.trim()
        }),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success(
          "Request Rejected",
          "Requester has been notified"
        );
        onRejected(request.id);
      } else {
        toast.error("Rejection Failed", j.error ?? "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      toast.error("Rejection Failed", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
      setShowRejectDialog(false);
    }
  }

  function initiateReject() {
    setShowRejectDialog(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Request Details
            </h2>
            {t.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              t.status === 'pending_head' ? 'bg-amber-100 text-amber-700' :
              t.status === 'approved_head' ? 'bg-green-100 text-green-700' :
              t.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {t.status === 'pending_head' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Review
                </>
              ) : t.status === 'approved_head' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </>
              ) : t.status === 'rejected' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Rejected
                </>
              ) : (
                t.status || 'Pending'
              )}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* body */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto flex-1">
          {/* LEFT */}
          <div className="space-y-5">
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Requesting person
              </p>
              
              {/* Show submitter badge if representative */}
              {t.is_representative && t.submitted_by_name ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {(t.requester?.profile_picture || t.requester?.avatar_url) ? (
                      <img 
                        src={t.requester.profile_picture || t.requester.avatar_url} 
                        alt={t.requester_name || "Requester"}
                        className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                        onError={(e) => {
                          // Fallback to initials if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-avatar')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                            fallback.textContent = (t.requester_name || "U").charAt(0).toUpperCase();
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(t.requester_name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-semibold text-slate-900">
                          <NameWithProfile
                            name={t.requester_name || "Unknown Requester"}
                            profile={{
                              id: t.requester?.id || '',
                              name: t.requester_name || '',
                              email: t.requester?.email,
                              department: t.department?.name || t.department?.code,
                              position: t.requester?.position_title,
                              profile_picture: t.requester?.profile_picture,
                            }}
                          />
                        </p>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          On behalf
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {t.department?.name || t.department?.code || "No department indicated"}
                      </p>
                      {t.requester?.position_title && (
                        <p className="text-xs text-slate-500 mt-0.5">{t.requester.position_title}</p>
                      )}
                    </div>
                  </div>
                  <div className="pl-[64px] border-l-2 border-slate-200 ml-3 pt-2">
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">Submitted by</p>
                    <div className="flex items-center gap-2">
                      {(t.requester?.profile_picture || t.requester?.avatar_url) ? (
                        <img 
                          src={t.requester.profile_picture || t.requester.avatar_url} 
                          alt={t.submitted_by_name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-avatar-small')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold fallback-avatar-small';
                              fallback.textContent = t.submitted_by_name.charAt(0).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                          {t.submitted_by_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="text-sm font-medium text-slate-900">
                        <NameWithProfile
                          name={t.submitted_by_name}
                          profile={{
                            id: t.requester?.id || '',
                            name: t.submitted_by_name,
                            email: t.requester?.email,
                            department: t.department?.name || t.department?.code,
                            position: t.requester?.position_title,
                            profile_picture: t.requester?.profile_picture,
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  {(t.requester?.profile_picture || t.requester?.avatar_url) ? (
                    <img 
                      src={t.requester.profile_picture || t.requester.avatar_url} 
                      alt={t.requester_name || "Requester"}
                      className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                      onError={(e) => {
                        // Fallback to initials if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-avatar')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                          fallback.textContent = (t.requester_name || t.requester?.name || "U").charAt(0).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(t.requester_name || t.requester?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-900 mb-1">
                      <NameWithProfile
                        name={t.requester_name || t.requester?.name || t.requester?.email || "Unknown Requester"}
                        profile={{
                          id: t.requester?.id || '',
                          name: t.requester_name || t.requester?.name || '',
                          email: t.requester?.email,
                          department: t.department?.name || t.department?.code,
                          position: t.requester?.position_title,
                          profile_picture: t.requester?.profile_picture,
                        }}
                      />
                    </p>
                    <p className="text-sm text-slate-600">
                      {t.department?.name || t.department?.code || "No department indicated"}
                    </p>
                    {t.requester?.position_title && (
                      <p className="text-xs text-slate-500 mt-0.5">{t.requester.position_title}</p>
                    )}
                  </div>
                </div>
              )}
              
              {t.created_at && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitted {new Date(t.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </section>
            
            {/* Preferred Driver/Vehicle Section - ALWAYS SHOW FOR DEBUG */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Service Preferences
              </p>
              
              {(t.preferred_driver_id || t.preferred_vehicle_id) ? (
                <div className="space-y-3">
                  {t.preferred_driver_id ? (
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <UserCog className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Preferred Driver</p>
                        <p className="text-sm font-medium text-slate-900">
                          {preferredDriverName || "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  
                  {t.preferred_vehicle_id ? (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Car className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">Preferred Vehicle</p>
                        <p className="text-sm font-medium text-slate-900">
                          {preferredVehicleName || "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Suggestions only — Admin makes final assignment
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">No driver or vehicle preferences</p>
                  <p className="text-xs text-slate-500 mt-1">Admin will assign resources</p>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <section className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 mb-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Purpose
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Travel dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.travel_start_date && t.travel_end_date
                    ? `${new Date(t.travel_start_date).toLocaleDateString()} – ${new Date(t.travel_end_date).toLocaleDateString()}`
                    : "—"}
                </p>
              </section>
              {/* Transportation Mode Badge */}
              <section className="rounded-lg p-4 border-2 shadow-sm" style={{
                backgroundColor: (t as any).vehicle_mode === 'owned' ? '#f0fdf4' : (t as any).vehicle_mode === 'rent' ? '#fefce8' : '#eff6ff',
                borderColor: (t as any).vehicle_mode === 'owned' ? '#86efac' : (t as any).vehicle_mode === 'rent' ? '#fde047' : '#93c5fd'
              }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                    backgroundColor: (t as any).vehicle_mode === 'owned' ? '#d1fae5' : (t as any).vehicle_mode === 'rent' ? '#fef3c7' : '#dbeafe'
                  }}>
                    <Car className="h-5 w-5" style={{
                      color: (t as any).vehicle_mode === 'owned' ? '#059669' : (t as any).vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{
                      color: (t as any).vehicle_mode === 'owned' ? '#059669' : (t as any).vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }}>
                      Transportation Mode
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {(t as any).vehicle_mode === 'owned' && 'Personal Vehicle (Owned)'}
                      {(t as any).vehicle_mode === 'institutional' && 'University Vehicle'}
                      {(t as any).vehicle_mode === 'rent' && 'Rental Vehicle'}
                      {!(t as any).vehicle_mode && (t.vehicle_type || 'Not specified')}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Destination Section */}
            <section className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Destination
                </p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 flex-1">
                  {t.destination || "No destination provided."}
                </p>
                {t.destination && (
                  <button
                    onClick={() => {
                      const encodedDest = encodeURIComponent(t.destination);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDest}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                    title="View on Google Maps"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Map
                  </button>
                )}
              </div>
            </section>

            {/* Participants Section */}
            {t.participants && Array.isArray(t.participants) && t.participants.length > 0 && (
              <section className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                    Travel Participants ({t.participants.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {t.participants.map((participant: any, idx: number) => {
                    const participantName = typeof participant === 'string' 
                      ? participant 
                      : participant?.name || participant?.id || `Participant ${idx + 1}`;
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-100">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-700">
                            {participantName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">{participantName}</span>
                      </div>
                    );
                  })}
                </div>
                {t.head_included && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs text-purple-700 font-medium flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Department Head is included in travel
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* requester sig */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase text-slate-700 mb-3">
                Requester's Signature
              </p>
              {(requesterSignature || request.requester_signature) ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <img
                    src={requesterSignature || request.requester_signature}
                    alt="Requester signature"
                    className="h-[100px] w-full object-contain"
                  />
                  <p className="text-center text-xs text-slate-600 mt-2 font-medium">
                    Signed by: {t.requester_name || "Requester"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 p-4">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>No signature provided by requester</span>
                </div>
              )}
            </section>

            {/* Rejection Reason - Show if rejected */}
            {t.status === 'rejected' && t.rejection_reason && (
              <section className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Reason for Rejection</h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{t.rejection_reason}</p>
                </div>
                {t.rejected_at && (
                  <p className="text-xs text-red-600 mt-2">
                    Rejected on {new Date(t.rejected_at).toLocaleString()}
                  </p>
                )}
              </section>
            )}

            {/* Budget Breakdown - Professional */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                <span className="text-lg font-bold text-slate-700">₱</span>
                <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
              </div>

              {expenseBreakdown.length > 0 ? (
                <>
                  <div className="space-y-2 mb-3">
                    {expenseBreakdown.map((expense: any, idx: number) => {
                      // Show custom label if "Other" has a description
                      const label = expense.item === "Other" && expense.description 
                        ? expense.description 
                        : expense.item || expense.description;
                      
                      return expense.amount > 0 && (
                        <div key={idx} className="flex items-center justify-between py-2">
                          <span className="text-sm text-slate-600">{label}</span>
                          <span className="text-sm font-semibold text-slate-900">{peso(expense.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {totalCost > 0 && (
                    <div className="pt-3 border-t border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                        <span className="text-lg font-bold text-[#7A0010]">{peso(totalCost)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">No budget specified</p>
                </div>
              )}
            </section>

            {/* Cost Justification */}
            {t.cost_justification && (
              <section className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-4">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Cost Justification
                </h3>
                <div className="bg-white rounded-md border border-amber-200 p-3 text-sm text-gray-800 leading-relaxed shadow-sm">
                  {t.cost_justification}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-lg">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-[#7A0010]/10">
              {(headProfile?.profile_picture || headProfile?.avatar_url) ? (
                <img 
                  src={headProfile.profile_picture || headProfile.avatar_url} 
                  alt={headName || "Head"}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#7A0010] shadow-lg flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-avatar-head')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 fallback-avatar-head';
                      fallback.textContent = (headName || 'H').charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                  {headName ? (
                    headName.charAt(0).toUpperCase()
                  ) : (
                    'H'
                  )}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7A0010]/70">
                  Department Head Endorsement
                </p>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {headName || headProfile?.name ? (
                    headName || headProfile?.name
                  ) : headProfile?.email ? (
                    headProfile.email
                  ) : (
                    <span className="text-slate-400 font-normal">Loading user info...</span>
                  )}
                </div>
                {headProfile?.department && (
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {headProfile.department.name || headProfile.department.code}
                  </p>
                )}
                {headProfile?.position_title && (
                  <p className="text-xs text-slate-500 mt-0.5">{headProfile.position_title}</p>
                )}
              </div>
            </div>

            {viewOnly ? (
              // View-only: Show saved signature
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  Head Signature
                </label>
                <div className="rounded-xl bg-slate-50 p-4 border-2 border-slate-200">
                  {request.head_signature ? (
                    <img 
                      src={request.head_signature} 
                      alt="Head Signature" 
                      className="max-h-40 mx-auto"
                    />
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">
                      No signature available
                    </p>
                  )}
                  {request.head_approved_at && (
                    <p className="text-xs text-slate-500 text-center mt-2">
                      Signed on {new Date(request.head_approved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Edit mode: Signature pad
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  Your Signature *
                </label>
                <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                  <SignaturePad
                    height={160}
                    value={headSignature || null}
                    onSave={(dataUrl) => {
                      setHeadSignature(dataUrl);
                    }}
                    onClear={() => {
                      console.log("[HeadRequestModal] Clearing signature");
                      setHeadSignature("");
                    }}
                    hideSaveButton
                  />
                </div>
              </div>
            )}

            {/* Comments field for approval */}
            {!viewOnly && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                    Comments <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">(Required, minimum 10 characters)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setComments("Request approved.")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7A0010] bg-white border border-[#7A0010]/30 rounded-lg hover:bg-[#7A0010]/5 hover:border-[#7A0010]/50 transition-colors"
                    title="Quick fill: Request approved"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Fill
                  </button>
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your comments or notes for this approval..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none ${
                    comments.trim().length > 0 && comments.trim().length < 10
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {comments.trim().length > 0 && comments.trim().length < 10 && (
                  <p className="mt-1 text-xs text-red-600">
                    Comments must be at least 10 characters long
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        {viewOnly ? (
          // View-only footer: Just close button
          <div className="flex items-center justify-end border-t bg-slate-50 px-6 py-4 flex-shrink-0 rounded-b-3xl">
            <button
              onClick={onClose}
              type="button"
              className="rounded-md bg-slate-600 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          // Edit mode footer: Reject, Close, and Approve buttons
          <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4 flex-shrink-0 rounded-b-3xl">
            <button
              onClick={initiateReject}
              disabled={submitting}
              className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                type="button"
                className="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={doApprove}
                disabled={submitting || !headSignature}
                className="rounded-md bg-[#7A0010] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5e000d] disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Approve"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => {
            setShowApproverSelection(false);
            setLoadingApprovers(false);
          }}
          onSelect={(approverId, approverRole, returnReason) => {
            proceedWithApproval(approverId, approverRole, returnReason);
          }}
          title="Select Next Approver"
          description={`Request ${request.request_number || request.id} - Choose where to send this request after approval`}
          options={approverOptions}
          currentRole="head"
          allowReturnToRequester={true}
          requesterId={request.requester_id}
          requesterName={request.requester?.name || request.requester_name || "Requester"}
          loading={loadingApprovers}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Please provide a reason for rejecting this request. This will be sent to the requester.
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Insufficient budget documentation, duplicate request, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setComments("");
                }}
                disabled={submitting}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={doReject}
                disabled={submitting || !comments.trim()}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
