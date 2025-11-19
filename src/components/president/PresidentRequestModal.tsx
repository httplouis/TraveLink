"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, Users, Car, UserCog, MapPin, Calendar, DollarSign, FileText, Edit2, Check } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";

interface PresidentRequestModalProps {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  viewOnly?: boolean;
}

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PresidentRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
  viewOnly = false,
}: PresidentRequestModalProps) {
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [presidentSignature, setPresidentSignature] = useState<string>(request.president_signature || "");
  const [presidentProfile, setPresidentProfile] = useState<any>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [editedExpenses, setEditedExpenses] = useState<any[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [preferredDriverName, setPreferredDriverName] = useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = useState<string>("");
  const [showApproverSelection, setShowApproverSelection] = useState(false);
  const [approverOptions, setApproverOptions] = useState<any[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [defaultApproverId, setDefaultApproverId] = useState<string | undefined>(undefined);
  const [defaultApproverName, setDefaultApproverName] = useState<string | undefined>(undefined);
  const [suggestionReason, setSuggestionReason] = useState<string | undefined>(undefined);

  const t = request;

  // Load President profile and expense breakdown
  useEffect(() => {
    async function loadData() {
      try {
        // Load current President info
        const meRes = await fetch("/api/profile");
        const meData = await meRes.json();
        if (meData.ok && meData.data) {
          setPresidentProfile(meData.data);
        } else {
          console.error("[PresidentRequestModal] Failed to load profile:", meData);
        }

        // Load expense breakdown
        if (t.expense_breakdown && Array.isArray(t.expense_breakdown)) {
          setExpenseBreakdown(t.expense_breakdown);
          setEditedExpenses(t.expense_breakdown.map((exp: any) => ({
            item: exp.item,
            amount: exp.amount
          })));
          const total = t.expense_breakdown.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          setTotalCost(total || t.total_budget || 0);
        } else {
          setTotalCost(t.total_budget || 0);
          setEditedExpenses([]);
        }

        // Load preferred driver
        if (t.preferred_driver_id) {
          try {
            const driverRes = await fetch(`/api/users/${t.preferred_driver_id}`);
            const driverData = await driverRes.json();
            if (driverData.ok && driverData.data) {
              setPreferredDriverName(driverData.data.name || "Unknown Driver");
            }
          } catch (err) {
            console.error("[PresidentRequestModal] Failed to load driver:", err);
          }
        }

        // Load preferred vehicle
        if (t.preferred_vehicle_id) {
          try {
            const vehicleRes = await fetch(`/api/vehicles/${t.preferred_vehicle_id}`);
            const vehicleData = await vehicleRes.json();
            if (vehicleData.ok && vehicleData.data) {
              setPreferredVehicleName(vehicleData.data.name || vehicleData.data.plate_number || "Unknown Vehicle");
            }
          } catch (err) {
            console.error("[PresidentRequestModal] Failed to load vehicle:", err);
          }
        }
      } catch (err) {
        console.error("[PresidentRequestModal] Error loading data:", err);
      }
    }
    loadData();
  }, [t]);

  const handleApprove = async () => {
    if (!presidentSignature) {
      toast({ message: "Please provide your signature", kind: "error" });
      return;
    }

    // Show approver selection
    setLoadingApprovers(true);
    try {
      const options: any[] = [];

      // Fetch Comptrollers
      const comptrollerRes = await fetch(`/api/approvers/list?role=comptroller`);
      if (comptrollerRes.ok) {
        const comptrollerData = await comptrollerRes.json();
        if (comptrollerData.ok && comptrollerData.data && comptrollerData.data.length > 0) {
          const comptrollerOptions = comptrollerData.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            profile_picture: c.profile_picture,
            phone: c.phone,
            position: c.position || "Comptroller",
            department: c.department,
            role: "comptroller",
            roleLabel: "Comptroller"
          }));
          options.push(...comptrollerOptions);
        }
      }

      // Fetch HRs
      const hrRes = await fetch(`/api/approvers/list?role=hr`);
      if (hrRes.ok) {
        const hrData = await hrRes.json();
        if (hrData.ok && hrData.data && hrData.data.length > 0) {
          const hrOptions = hrData.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            email: h.email,
            profile_picture: h.profile_picture,
            phone: h.phone,
            position: h.position || "HR",
            department: h.department,
            role: "hr",
            roleLabel: "HR"
          }));
          options.push(...hrOptions);
        }
      }

      // Smart suggestion logic
      if (options.length > 0) {
        try {
          const { suggestNextApprover, findSuggestedApprover } = await import('@/lib/workflow/suggest-next-approver');
          const suggestion = suggestNextApprover({
            status: request.status,
            requester_is_head: request.requester_is_head || false,
            requester_role: request.requester?.role || request.requester_role,
            has_budget: (request.total_budget || 0) > 0,
            head_included: request.head_included || false,
            parent_head_approved_at: request.parent_head_approved_at,
            parent_head_approver: request.parent_head_approver,
            requester_signature: request.requester_signature,
            head_approved_at: request.head_approved_at,
            admin_approved_at: request.admin_approved_at,
            comptroller_approved_at: request.comptroller_approved_at,
            hr_approved_at: request.hr_approved_at,
            vp_approved_at: request.vp_approved_at,
            vp2_approved_at: request.vp2_approved_at,
            both_vps_approved: request.both_vps_approved || false
          });
          
          let suggestionReasonText = '';
          
          if (suggestion) {
            const suggested = findSuggestedApprover(suggestion, options);
            if (suggested) {
              setDefaultApproverId(suggested.id);
              setDefaultApproverName(suggested.name);
              suggestionReasonText = suggestion.reason;
              console.log("[PresidentRequestModal] ✅ Smart suggestion:", suggestion.roleLabel, "-", suggestion.reason);
            } else {
              console.log("[PresidentRequestModal] ⚠️ Suggestion not found in options:", suggestion.roleLabel);
            }
          }
          
          setSuggestionReason(suggestionReasonText);
        } catch (err) {
          console.error("[PresidentRequestModal] Error in smart suggestion:", err);
        }
      }

      setApproverOptions(options);
      setLoadingApprovers(false);
      setShowApproverSelection(true);
    } catch (err) {
      console.error("[PresidentRequestModal] Error fetching approvers:", err);
      setLoadingApprovers(false);
      setApproverOptions([]);
      setShowApproverSelection(true);
      toast({ message: "Could not fetch approvers. You can still return the request to the requester.", kind: "warning" });
    }
  };

  const proceedWithApproval = async (selectedApproverId: string | null, selectedRole: string, returnReason?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/president/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature: presidentSignature,
          notes: notes.trim(),
          nextApproverId: selectedApproverId,
          nextApproverRole: selectedRole,
          returnReason: returnReason || null,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        const roleLabel = selectedRole === "requester" ? "Requester" : 
                         selectedRole === "comptroller" ? "Comptroller" : 
                         selectedRole === "hr" ? "HR" : "Next Approver";
        toast({ message: `Request has been sent to ${roleLabel}`, kind: "success" });
        setShowApproverSelection(false);
        setTimeout(() => {
          onApproved(request.id);
          onClose();
        }, 1500);
      } else {
        toast({ message: data.error || "Failed to approve request", kind: "error" });
      }
    } catch (error) {
      toast({ message: "An error occurred", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({ message: "Please provide a reason for rejection", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/president/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
          notes,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast({ message: "Request rejected", kind: "info" });
        setTimeout(() => {
          onRejected(request.id);
          onClose();
        }, 1500);
      } else {
        toast({ message: data.error || "Failed to reject request", kind: "error" });
      }
    } catch (error) {
      toast({ message: "An error occurred", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Presidential Review
            </h2>
            {t.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              t.status === 'pending_exec' || t.status === 'pending_president' ? 'bg-amber-100 text-amber-700' :
              t.status === 'approved' ? 'bg-green-100 text-green-700' :
              t.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {t.status === 'pending_exec' || t.status === 'pending_president' ? 'Pending Review' :
               t.status === 'approved' ? 'Approved' :
               t.status === 'rejected' ? 'Rejected' :
               t.status || 'Pending'}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body - Same structure as VPRequestModal */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto flex-1">
          {/* LEFT - Same sections as VPRequestModal */}
          <div className="space-y-5">
            {/* Requester Information */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Requesting Person
              </p>
              
              <div className="flex items-start gap-3">
                {(t.requester?.profile_picture || t.requester?.avatar_url) ? (
                  <img 
                    src={t.requester.profile_picture || t.requester.avatar_url} 
                    alt={t.requester_name || "Requester"}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                    onError={(e) => {
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
                  {t.requester?.role && (
                    <p className="text-xs text-slate-500 mt-0.5">Role: {t.requester.role}</p>
                  )}
                </div>
              </div>
              
              {t.created_at && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Submitted {new Date(t.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </section>

            {/* Service Preferences */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Service Preferences
              </p>
              
              {(t.preferred_driver_id || t.preferred_vehicle_id) ? (
                <div className="space-y-3">
                  {t.preferred_driver_id ? (
                    <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
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
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
                    <Car className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600">No driver or vehicle preferences</p>
                  <p className="text-xs text-slate-500 mt-1">Admin will assign resources</p>
                </div>
              )}
            </section>

            {/* Request Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <section className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4" />
                  Purpose
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4" />
                  Travel Dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.travel_start_date && t.travel_end_date
                    ? `${new Date(t.travel_start_date).toLocaleDateString()} – ${new Date(t.travel_end_date).toLocaleDateString()}`
                    : "—"}
                </p>
              </section>
              <section className="rounded-lg bg-amber-50/50 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Budget
                </p>
                <p className="text-lg font-bold text-[#7A0010]">
                  {peso(totalCost || t.total_budget)}
                </p>
              </section>
            </div>

            {/* Transportation Mode */}
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

            {/* Destination */}
            <section className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-blue-600" />
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
                    <MapPin className="h-4 w-4" />
                    View Map
                  </button>
                )}
              </div>
            </section>

            {/* Participants */}
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
                      <CheckCircle2 className="h-4 w-4" />
                      Department Head is included in travel
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Requester Signature */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase text-slate-700 mb-3">
                Requester's Signature
              </p>
              {(t.requester_signature) ? (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <img
                    src={t.requester_signature}
                    alt="Requester signature"
                    className="h-[100px] w-full object-contain"
                  />
                  <p className="text-center text-xs text-slate-600 mt-2 font-medium">
                    Signed by: {t.requester_name || "Requester"}
                  </p>
                  {t.requester_signed_at && (
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {new Date(t.requester_signed_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 p-4">
                  <FileText className="h-4 w-4" />
                  <span>No signature provided by requester</span>
                </div>
              )}
            </section>

            {/* Previous Approvals */}
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase text-slate-700 mb-3">
                Previous Approvals
              </p>
              <div className="space-y-3">
                {t.head_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Head Approved</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.head_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {t.head_approved_by && (
                      <p className="text-xs text-slate-600">
                        By: {t.head_approver?.name || t.head_signed_by || "Department Head"}
                      </p>
                    )}
                    {t.head_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.head_signature}
                          alt="Head signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.head_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.head_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.hr_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">HR Approved</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.hr_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {t.hr_approved_by && (
                      <p className="text-xs text-slate-600">
                        By: {t.hr_approver?.name || "HR Officer"}
                      </p>
                    )}
                    {t.hr_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.hr_signature}
                          alt="HR signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.hr_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.hr_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.vp_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">First VP Approved</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.vp_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {t.vp_approved_by && (
                      <p className="text-xs text-slate-600">
                        By: {t.vp_approver?.name || "Vice President"}
                      </p>
                    )}
                    {t.vp_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.vp_signature}
                          alt="VP signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.vp_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.vp_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.vp2_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Second VP Approved</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.vp2_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {t.vp2_approved_by && (
                      <p className="text-xs text-slate-600">
                        By: {t.vp2_approver?.name || "Vice President"}
                      </p>
                    )}
                    {t.vp2_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.vp2_signature}
                          alt="VP2 signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.vp2_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.vp2_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {t.comptroller_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Comptroller Approved</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.comptroller_approved_at).toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    {t.comptroller_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.comptroller_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {!t.head_approved_at && !t.hr_approved_at && !t.vp_approved_at && !t.vp2_approved_at && !t.comptroller_approved_at && (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No previous approvals yet
                  </div>
                )}
              </div>
            </section>

            {/* Budget Breakdown - With Editing Capability */}
            <section className="rounded-lg bg-slate-50 border-2 border-[#7A0010] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
                </div>
                {!editingBudget && !viewOnly && (
                  <button
                    onClick={() => setEditingBudget(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7A0010] text-white hover:bg-[#5e000d] rounded-lg transition-colors text-xs font-semibold shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Budget
                  </button>
                )}
              </div>

              {editedExpenses.length > 0 ? (
                <>
                  <div className="space-y-2 mb-3">
                    {editedExpenses.map((expense: any, index: number) => {
                      const label = expense.item === "Other" && expense.description 
                        ? expense.description 
                        : expense.item || expense.description;
                      
                      return expense.amount > 0 && (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-sm text-slate-600">{label}</span>
                          {editingBudget ? (
                            <input
                              type="number"
                              value={expense.amount}
                              onChange={(e) => {
                                const amount = parseFloat(e.target.value) || 0;
                                setEditedExpenses(prev => {
                                  const updated = [...prev];
                                  updated[index] = { ...updated[index], amount };
                                  return updated;
                                });
                              }}
                              className="w-32 px-3 py-1.5 border-2 border-[#7A0010]/20 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] text-sm"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-slate-900">{peso(expense.amount)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-3 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                      <div className="text-right">
                        {(() => {
                          const calculatedTotal = editedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          const originalTotal = expenseBreakdown.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || totalCost;
                          return calculatedTotal !== originalTotal ? (
                            <>
                              <div className="text-sm text-slate-500 line-through mb-1">
                                {peso(originalTotal)}
                              </div>
                              <div className="text-lg font-bold text-[#7A0010]">
                                {peso(calculatedTotal)}
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-bold text-[#7A0010]">
                              {peso(calculatedTotal)}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {editingBudget && !viewOnly && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          // Save budget edits without approving
                          try {
                            setSubmitting(true);
                            const calculatedTotal = editedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            const res = await fetch("/api/president/action", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                requestId: request.id,
                                action: "edit_budget",
                                editedBudget: calculatedTotal,
                                notes: notes || "Budget edited by President",
                              }),
                            });

                            const json = await res.json();
                            
                            if (json.ok) {
                              toast({ message: "✅ Budget updated successfully", kind: "success" });
                              setEditingBudget(false);
                              // Update expense breakdown to reflect changes
                              setExpenseBreakdown(editedExpenses);
                              setTotalCost(calculatedTotal);
                            } else {
                              toast({ message: json.error || "Failed to update budget", kind: "error" });
                            }
                          } catch (err) {
                            console.error("Save budget error:", err);
                            toast({ message: "Failed to save budget. Please try again.", kind: "error" });
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4" />
                        {submitting ? "Saving..." : "Save Budget Changes"}
                      </button>
                      <button
                        onClick={() => {
                          // Cancel editing - revert to original
                          setEditedExpenses(expenseBreakdown.map((exp: any) => ({
                            item: exp.item,
                            amount: exp.amount
                          })));
                          setEditingBudget(false);
                        }}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </button>
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
                  <FileText className="h-4 w-4" />
                  Cost Justification
                </h3>
                <div className="bg-white rounded-md border border-amber-200 p-3 text-sm text-gray-800 leading-relaxed shadow-sm">
                  {t.cost_justification}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT - President Signature Section */}
          <div className="space-y-5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-lg">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-[#7A0010]/10">
              {(presidentProfile?.profile_picture || presidentProfile?.avatar_url || presidentProfile?.avatarUrl) ? (
                <img 
                  src={presidentProfile.profile_picture || presidentProfile.avatar_url || presidentProfile.avatarUrl} 
                  alt={presidentProfile?.name || "President"}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#7A0010] shadow-lg flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-avatar-president')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 fallback-avatar-president';
                      fallback.textContent = (presidentProfile?.name || 'P').charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                  {(presidentProfile?.name || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7A0010]/70">
                  Presidential Review
                </p>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {presidentProfile?.name || presidentProfile?.email || "Loading..."}
                </div>
                {presidentProfile?.department && (
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {typeof presidentProfile.department === 'string' 
                      ? presidentProfile.department 
                      : (presidentProfile.department.name || presidentProfile.department.code)}
                  </p>
                )}
                {presidentProfile?.position_title && (
                  <p className="text-xs text-slate-500 mt-0.5">{presidentProfile.position_title}</p>
                )}
              </div>
            </div>

            {viewOnly ? (
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  President Signature
                </label>
                <div className="rounded-xl bg-slate-50 p-4 border-2 border-slate-200">
                  {t.president_signature ? (
                    <>
                      <img 
                        src={t.president_signature} 
                        alt="President Signature" 
                        className="max-h-40 mx-auto"
                      />
                      {t.president_approved_at && (
                        <p className="text-xs text-slate-500 text-center mt-2">
                          Signed on {new Date(t.president_approved_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">
                      No signature available
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  Your Signature <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                  <SignaturePad
                    height={160}
                    value={presidentSignature || null}
                    onSave={(dataUrl) => {
                      setPresidentSignature(dataUrl);
                    }}
                    onClear={() => {
                      setPresidentSignature("");
                    }}
                    hideSaveButton
                  />
                </div>
              </div>
            )}

            {/* President Notes/Comments */}
            {!viewOnly && (
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  President Notes/Comments
                </label>
                
                {/* Quick Fill Buttons */}
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNotes("Okay, approved.")}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    ✓ Okay, approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Request fully approved. All requirements have been met.")}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    ✓ Fully Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Request approved. Final authorization granted. Proceed with travel arrangements.")}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    ✓ Final Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotes("Request rejected. Please review and resubmit with necessary corrections.")}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    ✗ Rejected
                  </button>
                </div>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#7A0010]/20 rounded-xl focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                  placeholder="Add your comments here..."
                />
              </div>
            )}

            {viewOnly && t.president_comments && (
              <div>
                <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                  President Comments
                </label>
                <div className="rounded-xl bg-slate-50 p-4 border-2 border-slate-200">
                  <p className="text-sm text-slate-700">{t.president_comments}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {!viewOnly && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0">
            <button
              onClick={handleApprove}
              disabled={submitting || !presidentSignature}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-5 w-5" />
              {submitting ? "Approving..." : "Approve Request"}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting || !notes.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-5 w-5" />
              {submitting ? "Rejecting..." : "Reject Request"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {viewOnly && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => setShowApproverSelection(false)}
          onSelect={(approverId, approverRole, returnReason) => {
            proceedWithApproval(approverId, approverRole, returnReason);
          }}
          title="Select Next Approver"
          description="Choose who should review this request next, or return it to the requester for revision."
          options={approverOptions}
          currentRole="president"
          allowReturnToRequester={true}
          requesterId={request.requester_id}
          requesterName={request.requester?.name || "Requester"}
          loading={loadingApprovers}
          defaultApproverId={defaultApproverId}
          defaultApproverName={defaultApproverName}
          suggestionReason={suggestionReason}
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
              console.error("[PresidentRequestModal] Error fetching all users:", err);
              return [];
            }
          }}
        />
      )}
    </div>
  );
}
