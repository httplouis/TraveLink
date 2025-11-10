// src/components/comptroller/ComptrollerReviewModal.tsx
"use client";

import React from "react";
import { X, DollarSign, Edit2, Check, XCircle, FileText, Calendar, User, MapPin, Building2 } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

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

  React.useEffect(() => {
    loadFullRequest();
  }, [request.id]);

  const loadFullRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${request.id}`);
      const json = await res.json();
      
      if (json.ok && json.data) {
        setFullRequest(json.data);
        // Initialize edited expenses from original
        if (json.data.expense_breakdown) {
          setEditedExpenses(json.data.expense_breakdown.map((exp: any) => ({
            item: exp.item,
            amount: exp.amount
          })));
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

  const handleApprove = async () => {
    console.log("[Comptroller] ========== APPROVE BUTTON CLICKED ==========");
    console.log("[Comptroller] Has signature:", !!signature);
    
    if (!signature) {
      console.log("[Comptroller] No signature - showing error toast");
      toast({ message: "Please provide your signature", kind: "error" });
      return;
    }

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
        }),
      });

      const json = await res.json();
      
      console.log("[Comptroller Approve] API Response:", json);
      
      if (json.ok) {
        console.log("[Comptroller Approve] Showing success toast...");
        toast({ message: "✅ Request approved and sent to HR for review", kind: "success" });
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{request.request_number}</h2>
            <p className="text-white/90 text-sm">Budget Review & Approval</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                  <Calendar className="h-4 w-4 text-[#7A0010]" />
                  Date Submitted
                </div>
                <div className="text-base text-gray-900">
                  {fullRequest?.created_at ? new Date(fullRequest.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—"}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                  <User className="h-4 w-4 text-[#7A0010]" />
                  Requesting Person
                </div>
                <div className="text-base text-gray-900">{fullRequest?.requester_name || request.requester?.name || "—"}</div>
              </div>
            </div>
            {fullRequest?.submitted_by_name && fullRequest.submitted_by_name !== (fullRequest?.requester_name || request.requester?.name) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <span className="font-semibold">Submitted on behalf by:</span> {fullRequest.submitted_by_name}
                </div>
              </div>
            )}
            
            {/* Requester Signature */}
            {fullRequest?.requester_signature && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Requester Digital Signature</div>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                  <img
                    src={fullRequest.requester_signature}
                    alt="Requester Signature"
                    className="max-h-32 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Travel Details */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#7A0010]" />
                <h3 className="font-semibold text-gray-900">Travel Order Details</h3>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                  <Building2 className="h-4 w-4 text-[#7A0010]" />
                  Department
                </div>
                <div className="text-base text-gray-900">{request.department?.name || "—"}</div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                    <MapPin className="h-4 w-4 text-[#7A0010]" />
                    Destination
                  </div>
                  <div className="text-base text-gray-900">{fullRequest?.destination || "—"}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                    <User className="h-4 w-4 text-[#7A0010]" />
                    Participants
                  </div>
                  <div className="text-base text-gray-900">
                    {(() => {
                      try {
                        if (!fullRequest?.participants) return "—";
                        const participants = typeof fullRequest.participants === 'string' 
                          ? JSON.parse(fullRequest.participants) 
                          : fullRequest.participants;
                        return Array.isArray(participants) ? participants.length : "—";
                      } catch {
                        return "—";
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                    <Calendar className="h-4 w-4 text-[#7A0010]" />
                    Departure Date
                  </div>
                  <div className="text-base text-gray-900">
                    {fullRequest?.travel_start_date ? new Date(fullRequest.travel_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—"}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                    <Calendar className="h-4 w-4 text-[#7A0010]" />
                    Return Date
                  </div>
                  <div className="text-base text-gray-900">
                    {fullRequest?.travel_end_date ? new Date(fullRequest.travel_end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                  <FileText className="h-4 w-4 text-[#7A0010]" />
                  Purpose of Travel
                </div>
                <div className="text-base text-gray-900">{request.purpose}</div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {fullRequest?.vehicle_mode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <svg className="h-4 w-4 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transportation Mode
              </div>
              <div className="text-base text-gray-900">
                {fullRequest.vehicle_mode === "owned" ? "Personal Vehicle (Owned)" :
                 fullRequest.vehicle_mode === "rental" ? "Rental Vehicle" :
                 fullRequest.vehicle_mode === "none" ? "No Vehicle Required" : "School Service"}
              </div>
              {fullRequest.vehicle_mode === "owned" && (
                <div className="text-sm text-gray-600 mt-2">
                  Requester will use their own vehicle - no assignment needed
                </div>
              )}
            </div>
          )}

          {/* Approval History */}
          {(fullRequest?.head_approved_at || fullRequest?.admin_approved_at) && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Approval History</h3>
              <div className="space-y-3">
                {fullRequest.head_approved_at && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">Department Head</div>
                      <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {fullRequest.head_approver?.name || "Department Head"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(fullRequest.head_approved_at).toLocaleString()}
                    </div>
                    {fullRequest.head_signature && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">Digital Signature</div>
                        <img 
                          src={fullRequest.head_signature} 
                          alt="Department Head Signature" 
                          className="h-16 border border-gray-300 rounded bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                {fullRequest.admin_approved_at && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-gray-900">Admin</div>
                      <span className="text-xs text-green-600 font-medium">✓ Approved</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {fullRequest.admin_approver?.name || "Admin"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(fullRequest.admin_approved_at).toLocaleString()}
                    </div>
                    {fullRequest.admin_signature && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">Digital Signature</div>
                        <img 
                          src={fullRequest.admin_signature} 
                          alt="Admin Signature" 
                          className="h-16 border border-gray-300 rounded bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget Breakdown - MAIN FOCUS */}
          <div className="relative">
            <div className="absolute -left-6 -right-6 h-full bg-amber-50 -z-10"></div>
            <div className="border-2 border-[#7A0010] rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <FileText className="h-6 w-6" />
                  <div>
                    <div className="font-bold text-lg">Budget Breakdown</div>
                    <div className="text-xs text-white/80">Review and edit if necessary</div>
                  </div>
                </div>
                {!editingBudget && (
                  <button
                    onClick={() => setEditingBudget(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-[#7A0010] hover:bg-white/90 rounded-lg transition-colors font-semibold shadow-md"
                  >
                    <Edit2 className="h-5 w-5" />
                    Edit Budget
                  </button>
                )}
              </div>

            <div className="p-4 space-y-2">
              {editedExpenses.map((expense, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">{expense.item}</span>
                  {editingBudget ? (
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleExpenseEdit(index, e.target.value)}
                      className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">₱{expense.amount.toLocaleString()}</span>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total Budget</span>
                <div className="text-right">
                  {calculatedTotal !== request.total_budget && (
                    <div className="text-sm text-gray-500 line-through">
                      ₱{request.total_budget.toLocaleString()}
                    </div>
                  )}
                  <div className={`text-2xl font-bold ${calculatedTotal !== request.total_budget ? 'text-[#7A0010]' : 'text-gray-900'}`}>
                    ₱{calculatedTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {editingBudget && (
                <button
                  onClick={() => setEditingBudget(false)}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  Save Budget Changes
                </button>
              )}
            </div>
            </div>
          </div>

          {/* Comptroller Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <Edit2 className="h-4 w-4 text-[#7A0010]" />
              Comptroller Notes
            </label>
            <textarea
              value={comptrollerNotes}
              onChange={(e) => setComptrollerNotes(e.target.value)}
              placeholder="Add your comments or reasons for approval/rejection..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Signature */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <Edit2 className="h-4 w-4 text-[#7A0010]" />
              Signature (Required for Approval)
            </label>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignaturePad
                height={180}
                value={signature}
                onSave={setSignature}
                onClear={() => setSignature(null)}
                hideSaveButton
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={submitting || !comptrollerNotes.trim()}
            className="flex items-center gap-2 px-6 py-2.5 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <XCircle className="h-5 w-5" />
            Reject & Return to User
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting || !signature}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Check className="h-5 w-5" />
            Approve & Send to HR
          </button>
        </div>
      </div>
    </div>
  );
}
