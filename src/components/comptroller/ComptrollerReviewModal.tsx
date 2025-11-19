// src/components/comptroller/ComptrollerReviewModal.tsx
"use client";

import React from "react";
import { X, DollarSign, Edit2, Check, XCircle, FileText, Calendar, User, MapPin, Building2, Users, Car, UserCog, CheckCircle2 } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/ToastProvider.ui";
import ApproverSelectionModal from "@/components/common/ApproverSelectionModal";
import { NameWithProfile } from "@/components/common/ProfileHoverCard";

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Request = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  total_budget: number;
  comptroller_edited_budget?: number;
  expense_breakdown?: Array<{
    item: string;
    description?: string;
    amount: number;
  }>;
  travel_start_date: string;
  travel_end_date: string;
  created_at: string;
  status: string;
  requester?: {
    name: string;
    email: string;
  };
  department?: {
    code: string;
    name: string;
  };
};

type Props = {
  request: any;
  onClose: () => void;
};

export default function ComptrollerReviewModal({ request, onClose }: Props) {
  const toast = useToast();
  const [fullRequest, setFullRequest] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingBudget, setEditingBudget] = React.useState(false);
  const [editedExpenses, setEditedExpenses] = React.useState<Array<{ item: string; amount: number }>>([]);
  const [comptrollerNotes, setComptrollerNotes] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);
  const [showApproverSelection, setShowApproverSelection] = React.useState(false);
  const [approverOptions, setApproverOptions] = React.useState<any[]>([]);
  const [sendToRequester, setSendToRequester] = React.useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = React.useState(false);
  const [nextApproverId, setNextApproverId] = React.useState<string | null>(null);
  const [nextApproverRole, setNextApproverRole] = React.useState<string | null>(null);
  const [comptrollerProfile, setComptrollerProfile] = React.useState<any>(null);
  const [defaultApproverId, setDefaultApproverId] = React.useState<string | undefined>(undefined);
  const [defaultApproverName, setDefaultApproverName] = React.useState<string | undefined>(undefined);
  const [suggestionReason, setSuggestionReason] = React.useState<string | undefined>(undefined);
  const [preferredDriverName, setPreferredDriverName] = React.useState<string>("");
  const [preferredVehicleName, setPreferredVehicleName] = React.useState<string>("");
  const [totalCost, setTotalCost] = React.useState(0);

  React.useEffect(() => {
    loadFullRequest();
    loadComptrollerProfile();
  }, [request.id]);

  const loadComptrollerProfile = async () => {
    try {
      const meRes = await fetch("/api/profile");
      const meData = await meRes.json();
      if (meData) {
        setComptrollerProfile(meData);
      }
    } catch (err) {
      console.error("[ComptrollerReviewModal] Failed to load profile:", err);
    }
  };

  const loadFullRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${request.id}`);
      const json = await res.json();
      
      if (json.ok && json.data) {
        setFullRequest(json.data);
        const req = json.data;
        
        // Parse expense_breakdown if it's a string (JSONB from database)
        let expenseBreakdown = req.expense_breakdown;
        if (typeof expenseBreakdown === 'string') {
          try {
            expenseBreakdown = JSON.parse(expenseBreakdown);
          } catch (e) {
            console.error("[ComptrollerReviewModal] Failed to parse expense_breakdown:", e);
            expenseBreakdown = null;
          }
        }
        
        // Initialize edited expenses from original
        if (expenseBreakdown && Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0) {
          console.log("[ComptrollerReviewModal] Found expense_breakdown:", expenseBreakdown);
          const validExpenses = expenseBreakdown
            .filter((exp: any) => exp && (exp.amount > 0 || exp.item || exp.description))
            .map((exp: any) => ({
              item: exp.item || exp.description || "Travel Expenses",
              amount: exp.amount || 0,
              description: exp.description || null
            }));
          
          if (validExpenses.length > 0) {
            setEditedExpenses(validExpenses);
            const total = validExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
            setTotalCost(total || req.total_budget || 0);
          } else {
            // If expense_breakdown exists but all amounts are 0, create from total_budget
            if (req.total_budget && req.total_budget > 0) {
              setEditedExpenses([{ item: "Travel Expenses", amount: req.total_budget }]);
              setTotalCost(req.total_budget);
            } else {
              setEditedExpenses([]);
              setTotalCost(0);
            }
          }
        } else {
          console.log("[ComptrollerReviewModal] No expense_breakdown found, using total_budget:", req.total_budget);
          // ALWAYS create at least one expense item if total_budget > 0
          if (req.total_budget && req.total_budget > 0) {
            const expenses: Array<{ item: string; amount: number }> = [];
            
            // Check if there are any hints in the request data
            if (req.needs_rental || req.vehicle_mode === 'rent') {
              expenses.push({ item: "Vehicle Rental", amount: Math.round(req.total_budget * 0.4) });
            }
            if (req.travel_start_date && req.travel_end_date) {
              const startDate = new Date(req.travel_start_date);
              const endDate = new Date(req.travel_end_date);
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              if (days > 1) {
                expenses.push({ item: "Accommodation", amount: Math.round(req.total_budget * 0.3) });
              }
            }
            
            // Calculate remaining amount
            const allocated = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = req.total_budget - allocated;
            
            // Always add remaining amount as "Travel Expenses" or "Other Expenses"
            if (remaining > 0) {
              expenses.push({ item: "Travel Expenses", amount: remaining });
            } else if (expenses.length === 0) {
              // If no hints, just show total budget as a single item
              expenses.push({ item: "Travel Expenses", amount: req.total_budget });
            }
            
            console.log("[ComptrollerReviewModal] Created expenses from total_budget:", expenses);
            setEditedExpenses(expenses);
            setTotalCost(req.total_budget);
          } else {
            setEditedExpenses([]);
            setTotalCost(0);
          }
        }

        // Load preferred driver
        if (req.preferred_driver_id) {
          try {
            const driverRes = await fetch(`/api/users/${req.preferred_driver_id}`);
            const driverData = await driverRes.json();
            if (driverData.ok && driverData.data) {
              setPreferredDriverName(driverData.data.name || "Unknown Driver");
            }
          } catch (err) {
            console.error("[ComptrollerReviewModal] Failed to load driver:", err);
          }
        }

        // Load preferred vehicle
        if (req.preferred_vehicle_id) {
          try {
            const vehicleRes = await fetch(`/api/vehicles/${req.preferred_vehicle_id}`);
            const vehicleData = await vehicleRes.json();
            if (vehicleData.ok && vehicleData.data) {
              setPreferredVehicleName(vehicleData.data.name || vehicleData.data.plate_number || "Unknown Vehicle");
            }
          } catch (err) {
            console.error("[ComptrollerReviewModal] Failed to load vehicle:", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseEdit = (index: number, newAmount: string) => {
    const amount = parseFloat(newAmount) || 0;
    setEditedExpenses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount };
      return updated;
    });
  };

  const calculatedTotal = React.useMemo(() => {
    return editedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [editedExpenses]);

  const doApprove = async () => {
    console.log("[Comptroller] ========== APPROVE BUTTON CLICKED ==========");
    console.log("[Comptroller] Has signature:", !!signature);
    
    if (!signature) {
      console.log("[Comptroller] No signature - showing error toast");
      toast({ message: "Please provide your signature", kind: "error" });
      return;
    }

    // Fetch available approvers (HR)
    try {
      const approversRes = await fetch("/api/approvers/list?role=hr");
      const approversData = await approversRes.json();
      
      console.log("[Comptroller] Approvers response:", approversData);
      
      if (approversData.ok) {
        const options = (approversData.data || []).map((a: any) => ({
          ...a,
          roleLabel: a.roleLabel || "Human Resources"
        }));
        
        // Smart suggestion logic
        try {
          const { suggestNextApprover, findSuggestedApprover } = await import('@/lib/workflow/suggest-next-approver');
          const t = fullRequest || request;
          const suggestion = suggestNextApprover({
            status: t.status,
            requester_is_head: t.requester_is_head || false,
            requester_role: t.requester?.role || t.requester_role,
            has_budget: (t.total_budget || 0) > 0,
            head_included: t.head_included || false,
            parent_head_approved_at: t.parent_head_approved_at,
            parent_head_approver: t.parent_head_approver,
            requester_signature: t.requester_signature,
            head_approved_at: t.head_approved_at,
            admin_approved_at: t.admin_approved_at,
            comptroller_approved_at: t.comptroller_approved_at,
            hr_approved_at: t.hr_approved_at,
            vp_approved_at: t.vp_approved_at,
            vp2_approved_at: t.vp2_approved_at,
            both_vps_approved: t.both_vps_approved || false
          });
          
          let suggestionReasonText = '';
          
          if (suggestion) {
            const suggested = findSuggestedApprover(suggestion, options);
            if (suggested) {
              setDefaultApproverId(suggested.id);
              setDefaultApproverName(suggested.name);
              suggestionReasonText = suggestion.reason;
              console.log("[ComptrollerReviewModal] ✅ Smart suggestion:", suggestion.roleLabel, "-", suggestion.reason);
            } else {
              console.log("[ComptrollerReviewModal] ⚠️ Suggestion not found in options:", suggestion.roleLabel);
            }
          }
          
          setSuggestionReason(suggestionReasonText);
        } catch (err) {
          console.error("[ComptrollerReviewModal] Error in smart suggestion:", err);
        }
        
        console.log("[Comptroller] Approver options count:", options.length);
        setApproverOptions(options);
        setShowApproverSelection(true);
        return;
      } else {
        console.error("[Comptroller] Approvers API error:", approversData.error);
        // Still show modal even if API fails, so user can return to requester
        setApproverOptions([]);
        setShowApproverSelection(true);
        return;
      }
    } catch (err) {
      console.error("[Comptroller] Error fetching approvers:", err);
      // Still show modal even if fetch fails, so user can return to requester
      setApproverOptions([]);
      setShowApproverSelection(true);
      return;
    }
  };

  const proceedWithApproval = async (selectedApproverId?: string | null, selectedApproverRole?: string | null, returnToRequester?: boolean, returnReason?: string) => {
    console.log("[Comptroller] Starting approval process...");
    setSubmitting(true);
    try {
      const res = await fetch("/api/comptroller/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "approve",
          signature,
          notes: comptrollerNotes,
          editedBudget: calculatedTotal !== request.total_budget ? calculatedTotal : null,
          sendToRequester: returnToRequester || false,
          paymentConfirmed: paymentConfirmed || false,
          nextApproverId: selectedApproverId || nextApproverId,
          nextApproverRole: selectedApproverRole || nextApproverRole || "hr",
        }),
      });

      const json = await res.json();
      
      console.log("[Comptroller Approve] API Response:", json);
      
      if (json.ok) {
        console.log("[Comptroller Approve] Showing success toast...");
        const message = returnToRequester 
          ? "✅ Request sent to requester for payment confirmation"
          : "✅ Request approved and sent to HR for review";
        toast({ message, kind: "success" });
        // Delay to show toast before closing (increased to 1500ms to ensure visibility)
        console.log("[Comptroller Approve] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Comptroller Approve] Closing modal now");
          onClose();
        }, 1500);
      } else {
        console.log("[Comptroller Approve] Showing error toast:", json.error);
        toast({ message: json.error || "Failed to approve request", kind: "error" });
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast({ message: "Failed to approve request. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
      setShowApproverSelection(false);
    }
  };

  const handleReject = async () => {
    if (!comptrollerNotes.trim()) {
      toast({ message: "Please provide a reason for rejection", kind: "error" });
      return;
    }

    if (!showRejectConfirm) {
      setShowRejectConfirm(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comptroller/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "reject",
          notes: comptrollerNotes,
        }),
      });

      const json = await res.json();
      
      if (json.ok) {
        console.log("[Comptroller Reject] Showing info toast...");
        toast({ message: "❌ Request rejected and sent back to user", kind: "info" });
        // Delay to show toast before closing
        console.log("[Comptroller Reject] Closing modal in 1500ms...");
        setTimeout(() => {
          console.log("[Comptroller Reject] Closing modal now");
          onClose();
        }, 1500);
      } else {
        toast({ message: json.error || "Failed to reject request", kind: "error" });
      }
    } catch (err) {
      console.error("Reject error:", err);
      toast({ message: "Failed to reject request. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const t = fullRequest || request;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pt-20 pb-8">
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-3xl bg-white shadow-2xl transform transition-all duration-300 scale-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-[#7A0010] px-6 py-4 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Comptroller Review
            </h2>
            {t?.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              t?.status === 'pending_comptroller' ? 'bg-amber-100 text-amber-700' :
              t?.status === 'approved' ? 'bg-green-100 text-green-700' :
              t?.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {t?.status === 'pending_comptroller' ? 'Pending Review' :
               t?.status === 'approved' ? 'Approved' :
               t?.status === 'rejected' ? 'Rejected' :
               t?.status || 'Pending'}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] overflow-y-auto flex-1">
          {/* LEFT */}
          <div className="space-y-5">
            {/* Requester Information */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Requesting Person
              </p>
              
              <div className="flex items-start gap-3">
                {(t?.requester?.profile_picture || t?.requester?.avatar_url) ? (
                  <img 
                    src={t.requester.profile_picture || t.requester.avatar_url} 
                    alt={t?.requester_name || "Requester"}
                    className="h-12 w-12 rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-avatar')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 fallback-avatar';
                        fallback.textContent = (t?.requester_name || "U").charAt(0).toUpperCase();
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(t?.requester_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-base font-semibold text-slate-900 mb-1">
                    <NameWithProfile
                      name={t?.requester_name || t?.requester?.name || t?.requester?.email || "Unknown Requester"}
                      profile={{
                        id: t?.requester?.id || '',
                        name: t?.requester_name || t?.requester?.name || '',
                        email: t?.requester?.email,
                        department: t?.department?.name || t?.department?.code,
                        position: t?.requester?.position_title,
                        profile_picture: t?.requester?.profile_picture,
                      }}
                    />
                  </p>
                  <p className="text-sm text-slate-600">
                    {t?.department?.name || t?.department?.code || "No department indicated"}
                  </p>
                  {t?.requester?.position_title && (
                    <p className="text-xs text-slate-500 mt-0.5">{t.requester.position_title}</p>
                  )}
                  {t?.requester?.role && (
                    <p className="text-xs text-slate-500 mt-0.5">Role: {t.requester.role}</p>
                  )}
                </div>
              </div>
              
              {t?.created_at && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Submitted {new Date(t.created_at).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Manila'
                    })}
                  </p>
                </div>
              )}
            </section>

            {/* Service Preferences */}
            <section className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
                Service Preferences
              </p>
              
              {(t?.preferred_driver_id || t?.preferred_vehicle_id) ? (
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
                  {t?.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <Calendar className="h-4 w-4" />
                  Travel Dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t?.travel_start_date && t?.travel_end_date
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
                  {peso(totalCost || t?.total_budget)}
                </p>
              </section>
            </div>

            {/* Transportation Mode */}
            {t?.vehicle_mode && (
              <section className="rounded-lg p-4 border-2 shadow-sm" style={{
                backgroundColor: t.vehicle_mode === 'owned' ? '#f0fdf4' : t.vehicle_mode === 'rent' ? '#fefce8' : '#eff6ff',
                borderColor: t.vehicle_mode === 'owned' ? '#86efac' : t.vehicle_mode === 'rent' ? '#fde047' : '#93c5fd'
              }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{
                    backgroundColor: t.vehicle_mode === 'owned' ? '#d1fae5' : t.vehicle_mode === 'rent' ? '#fef3c7' : '#dbeafe'
                  }}>
                    <Car className="h-5 w-5" style={{
                      color: t.vehicle_mode === 'owned' ? '#059669' : t.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{
                      color: t.vehicle_mode === 'owned' ? '#059669' : t.vehicle_mode === 'rent' ? '#d97706' : '#2563eb'
                    }}>
                      Transportation Mode
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {t.vehicle_mode === 'owned' && 'Personal Vehicle (Owned)'}
                      {t.vehicle_mode === 'institutional' && 'University Vehicle'}
                      {t.vehicle_mode === 'rent' && 'Rental Vehicle'}
                      {!t.vehicle_mode && (t.vehicle_type || 'Not specified')}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Destination */}
            {t?.destination && (
              <section className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Destination
                  </p>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 flex-1">
                    {t.destination}
                  </p>
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
                </div>
              </section>
            )}

            {/* Participants */}
            {t?.participants && Array.isArray(t.participants) && t.participants.length > 0 && (
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
              {(t?.requester_signature) ? (
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
                      {new Date(t.requester_signed_at).toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Manila'
                      })}
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
                {/* Check for BOTH direct head approval AND parent head approval (SVP, etc.) */}
                {/* Also check VP approval if VP is also a head (dual role) */}
                {(() => {
                  const headApprover = t?.head_approver;
                  const parentHeadApprover = t?.parent_head_approver;
                  const vpApprover = t?.vp_approver;
                  const hasHeadApproval = !!(t?.head_approved_at || t?.head_approved_by);
                  const hasParentHeadApproval = !!(t?.parent_head_approved_at || t?.parent_head_approved_by);
                  const hasVpApproval = !!(t?.vp_approved_at || t?.vp_approved_by);
                  const vpIsHead = vpApprover?.is_head === true;
                  
                  // Debug logging
                  console.log("[ComptrollerReviewModal] Head Approval Check:", {
                    hasHeadApproval,
                    hasParentHeadApproval,
                    hasVpApproval,
                    vpIsHead,
                    headApprover: headApprover ? { id: headApprover.id, name: headApprover.name } : null,
                    parentHeadApprover: parentHeadApprover ? { id: parentHeadApprover.id, name: parentHeadApprover.name } : null,
                    vpApprover: vpApprover ? { id: vpApprover.id, name: vpApprover.name, is_head: vpApprover.is_head } : null,
                    parent_head_signature: t?.parent_head_signature ? "EXISTS" : "NULL",
                    head_signature: t?.head_signature ? "EXISTS" : "NULL",
                    vp_signature: t?.vp_signature ? "EXISTS" : "NULL",
                    fullRequest: !!fullRequest,
                    request: !!request
                  });
                  
                  // Priority: parent head > direct head > VP (if VP is head)
                  const approverToUse = hasParentHeadApproval ? parentHeadApprover 
                    : hasHeadApproval ? headApprover 
                    : (hasVpApproval && vpIsHead) ? vpApprover 
                    : null;
                  const hasAnyHeadApproval = hasHeadApproval || hasParentHeadApproval || (hasVpApproval && vpIsHead);
                  
                  // Get signature - priority: parent_head_signature > head_signature > vp_signature (if VP is head)
                  let signature: string | null = null;
                  if (t?.parent_head_signature) {
                    signature = t.parent_head_signature;
                  } else if (t?.head_signature) {
                    signature = t.head_signature;
                  } else if (hasVpApproval && vpIsHead && t?.vp_signature) {
                    signature = t.vp_signature;
                  }
                  
                  // Get approval date
                  const approvalDate = t?.parent_head_approved_at || t?.head_approved_at || (hasVpApproval && vpIsHead ? t?.vp_approved_at : null);
                  const approverDept = approverToUse?.department?.name || approverToUse?.department_name || "";
                  
                  return hasAnyHeadApproval ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">
                          {hasParentHeadApproval ? "Parent Head Approved (SVP)" : hasHeadApproval ? "Head Approved" : "VP Approved (as Head)"}
                        </p>
                        <span className="text-xs text-green-600 font-medium">
                          {approvalDate && new Date(approvalDate).toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Manila'
                          })}
                        </span>
                      </div>
                      {approverToUse && (
                        <p className="text-xs text-slate-600">
                          By: {approverToUse.name || (hasParentHeadApproval ? "Parent Head" : hasHeadApproval ? "Department Head" : "VP")}
                          {approverDept ? ` (${approverDept})` : ''}
                        </p>
                      )}
                      {signature && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <img
                            src={signature}
                            alt="Head signature"
                            className="h-16 w-full object-contain"
                          />
                        </div>
                      )}
                      {(t?.head_comments || t?.parent_head_comments) && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Comments:</p>
                          <p className="text-xs text-slate-700">{t?.parent_head_comments || t?.head_comments}</p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {t?.admin_approved_at && (
                  <div className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">Admin Processed</p>
                      <span className="text-xs text-green-600 font-medium">
                        {new Date(t.admin_approved_at).toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Manila'
                        })}
                      </span>
                    </div>
                    {t.admin_approved_by && (
                      <p className="text-xs text-slate-600">
                        By: {t.admin_approver?.name || "Administrator"}
                      </p>
                    )}
                    {t.admin_signature && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <img
                          src={t.admin_signature}
                          alt="Admin signature"
                          className="h-16 w-full object-contain"
                        />
                      </div>
                    )}
                    {t.admin_comments && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Comments:</p>
                        <p className="text-xs text-slate-700">{t.admin_comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {!t?.head_approved_at && !t?.parent_head_approved_at && !t?.vp_approved_at && !t?.admin_approved_at && (
                  <div className="text-center py-4 text-sm text-slate-500">
                    No previous approvals yet
                  </div>
                )}
              </div>
            </section>

            {/* Budget Breakdown - MAIN FOCUS (with editing capability) */}
            <section className="rounded-lg bg-slate-50 border-2 border-[#7A0010] p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">Budget Breakdown</h3>
                </div>
                {!editingBudget && (
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
                    {editedExpenses.map((expense, index) => {
                      const label = expense.item === "Other" && (expense as any).description 
                        ? (expense as any).description 
                        : expense.item || "Unknown";
                      
                      return expense.amount > 0 && (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-sm text-slate-600 font-medium">{label}</span>
                          {editingBudget ? (
                            <input
                              type="number"
                              value={expense.amount}
                              onChange={(e) => handleExpenseEdit(index, e.target.value)}
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
                        {calculatedTotal !== (t?.total_budget || request.total_budget) && (
                          <div className="text-sm text-slate-500 line-through mb-1">
                            {peso(t?.total_budget || request.total_budget)}
                          </div>
                        )}
                        <div className={`text-lg font-bold ${calculatedTotal !== (t?.total_budget || request.total_budget) ? 'text-[#7A0010]' : 'text-slate-900'}`}>
                          {peso(calculatedTotal)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingBudget && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          // Save budget edits without approving
                          try {
                            setSubmitting(true);
                            const res = await fetch("/api/comptroller/action", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                requestId: request.id,
                                action: "edit_budget",
                                editedBudget: calculatedTotal,
                                expense_breakdown: editedExpenses, // Send updated expense breakdown
                                notes: comptrollerNotes || "Budget edited by comptroller",
                              }),
                            });

                            const json = await res.json();
                            
                            if (json.ok) {
                              toast({ message: "✅ Budget updated successfully", kind: "success" });
                              setEditingBudget(false);
                              // Reload request to show updated budget
                              await loadFullRequest();
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
                          setEditedExpenses(
                            (fullRequest || request).expense_breakdown?.map((exp: any) => ({
                              item: exp.item,
                              amount: exp.amount
                            })) || []
                          );
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
              ) : (t?.total_budget && t.total_budget > 0) ? (
                // If no expense breakdown but has total_budget, show it as a single item
                <>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600 font-medium">Travel Expenses</span>
                      <span className="text-sm font-semibold text-slate-900">{peso(t.total_budget)}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">TOTAL BUDGET</span>
                      <div className="text-lg font-bold text-slate-900">
                        {peso(t.total_budget)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">No budget specified</p>
                </div>
              )}
            </section>

            {/* Cost Justification */}
            {t?.cost_justification && (
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

          {/* RIGHT */}
          <div className="space-y-5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-lg">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-[#7A0010]/10">
              {(comptrollerProfile?.profile_picture || comptrollerProfile?.avatar_url) ? (
                <img 
                  src={comptrollerProfile.profile_picture || comptrollerProfile.avatar_url} 
                  alt={comptrollerProfile?.name || "Comptroller"}
                  className="h-14 w-14 rounded-full object-cover border-2 border-[#7A0010] shadow-lg flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-avatar-comptroller')) {
                      const fallback = document.createElement('div');
                      fallback.className = 'h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0 fallback-avatar-comptroller';
                      fallback.textContent = (comptrollerProfile?.name || 'C').charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                  {(comptrollerProfile?.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7A0010]/70">
                  Comptroller Review
                </p>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {comptrollerProfile?.name || comptrollerProfile?.email || "Loading..."}
                </div>
                {comptrollerProfile?.department && (
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {comptrollerProfile.department.name || comptrollerProfile.department.code}
                  </p>
                )}
                {comptrollerProfile?.position_title && (
                  <p className="text-xs text-slate-500 mt-0.5">{comptrollerProfile.position_title}</p>
                )}
              </div>
            </div>

            {/* Comptroller Signature */}
            <div>
              <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                Your Signature <span className="text-red-500">*</span>
              </label>
              <div className="rounded-xl bg-white p-3 border-2 border-[#7A0010]/20 shadow-sm">
                <SignaturePad
                  height={160}
                  value={signature || null}
                  onSave={(dataUrl) => {
                    setSignature(dataUrl);
                  }}
                  onClear={() => {
                    setSignature(null);
                  }}
                  hideSaveButton
                />
              </div>
            </div>

            {/* Comptroller Notes */}
            <div>
              <label className="mb-3 block text-xs font-bold text-[#7A0010] uppercase tracking-wide">
                Comptroller Notes/Comments
              </label>
              
              {/* Quick Fill Buttons */}
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setComptrollerNotes("Budget verified. Payment confirmed. Proceed to HR.")}
                  className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  ✓ Payment Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => setComptrollerNotes("Budget verified and approved. All expenses are justified.")}
                  className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  ✓ Budget Approved
                </button>
                <button
                  type="button"
                  onClick={() => setComptrollerNotes("Please confirm payment before proceeding. Return to requester for payment confirmation.")}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  ⏳ Payment Pending
                </button>
                <button
                  type="button"
                  onClick={() => setComptrollerNotes("Budget requires revision. Please review and resubmit with corrected amounts.")}
                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  ✗ Needs Revision
                </button>
              </div>
              
              <textarea
                value={comptrollerNotes}
                onChange={(e) => setComptrollerNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-[#7A0010]/20 rounded-xl focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] resize-none text-sm"
                placeholder="Add your comments or reasons for approval/rejection..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={handleReject}
            disabled={submitting || !comptrollerNotes.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-5 w-5" />
            {submitting ? "Rejecting..." : "Reject & Return to User"}
          </button>
          <button
            onClick={doApprove}
            disabled={submitting || !signature}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-5 w-5" />
            {submitting ? "Approving..." : "Approve & Send"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Approver Selection Modal */}
      {showApproverSelection && (
        <ApproverSelectionModal
          isOpen={showApproverSelection}
          onClose={() => setShowApproverSelection(false)}
          onSelect={(approverId, approverRole, returnReason) => {
            const returnToRequester = approverRole === "requester";
            proceedWithApproval(approverId, approverRole, returnToRequester, returnReason);
          }}
          title="Select Next Approver"
          description="Choose where to send this request after approval. You can send to HR or return to requester for payment confirmation."
          options={approverOptions}
          currentRole="comptroller"
          allowReturnToRequester={true}
          requesterId={fullRequest?.requester_id}
          requesterName={fullRequest?.requester_name || request.requester?.name}
          returnReasons={[
            { value: 'payment_required', label: 'Payment Confirmation Required' },
            { value: 'budget_change', label: 'Budget Change Required' },
            { value: 'other', label: 'Other' }
          ]}
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
              console.error("[ComptrollerReviewModal] Error fetching all users:", err);
              return [];
            }
          }}
        />
      )}
    </div>
  );
}
