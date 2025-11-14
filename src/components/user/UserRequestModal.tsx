"use client";

import * as React from "react";
import { X, CheckCircle, Calendar, MapPin, DollarSign, FileText, User, Users, Building2, Car, UserCheck, Clock, History } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/Toast";

type Props = {
  request: any;
  onClose: () => void;
  onSigned: () => void;
};

type HistoryEntry = {
  id: string;
  action: string;
  actor_role: string;
  comments?: string;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
  metadata?: any;
};

function peso(n?: number | null) {
  if (!n) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-PH", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

export default function UserRequestModal({
  request,
  onClose,
  onSigned,
}: Props) {
  const toast = useToast();
  const [signature, setSignature] = React.useState<string>(request.requester_signature || "");
  const [submitting, setSubmitting] = React.useState(false);
  const [fullRequestData, setFullRequestData] = React.useState<any>(null);
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [loadingDetails, setLoadingDetails] = React.useState(true);

  const expenseBreakdown = request.expense_breakdown || fullRequestData?.expense_breakdown || [];
  const totalBudget = request.total_budget || fullRequestData?.total_budget || 0;

  // Fetch full request details and history when modal opens
  React.useEffect(() => {
    async function fetchFullDetails() {
      try {
        setLoadingDetails(true);
        const res = await fetch(`/api/requests/${request.id}/history`);
        const data = await res.json();
        
        if (data.ok) {
          setFullRequestData(data.data.request);
          setHistory(data.data.history || []);
        }
      } catch (err) {
        console.error("Failed to load full details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }
    
    if (request.id) {
      fetchFullDetails();
    }
  }, [request.id]);

  const requestData = fullRequestData || request;

  async function handleSign() {
    if (!signature || signature.trim() === "") {
      toast({
        kind: "error",
        title: "Signature required",
        message: "Please provide your signature to approve this request.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/user/inbox/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          signature: signature,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to sign request");
      }

      toast({
        kind: "success",
        title: "Request signed",
        message: "Your request has been signed and forwarded to your department head.",
      });

      onSigned();
      onClose();
    } catch (err: any) {
      toast({
        kind: "error",
        title: "Sign failed",
        message: err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Details & Signature
            </h2>
            <p className="text-sm text-white/80 mt-1">
              Request #{requestData.request_number || request.id?.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A0010] border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading full details...</p>
            </div>
          ) : (
            <>
              {/* Representative Submission Notice */}
              {requestData.is_representative && requestData.submitted_by_name && (
                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900">
                        This request was submitted on your behalf
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Submitted by: <span className="font-medium">{requestData.submitted_by_name}</span>
                        {requestData.submitted_by?.email && (
                          <span className="text-purple-600 ml-2">({requestData.submitted_by.email})</span>
                        )}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Submitted on: {formatDateTime(requestData.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Purpose
                  </label>
                  <p className="text-sm font-medium text-gray-900">{requestData.purpose || "—"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Destination
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{requestData.destination || "—"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Departure Date
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(requestData.travel_start_date)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Return Date
                  </label>
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(requestData.travel_end_date)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Department
                  </label>
                  <div className="text-sm text-gray-900">
                    {requestData.department?.name || requestData.department?.code || "—"}
                    {requestData.department?.code && (
                      <span className="text-gray-500 ml-2">({requestData.department.code})</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Requester
                  </label>
                  <div className="text-sm text-gray-900">
                    {requestData.requester?.name || requestData.requester_name || "—"}
                    {requestData.requester?.email && (
                      <span className="text-gray-500 text-xs block mt-0.5">{requestData.requester.email}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {(requestData.needs_vehicle || requestData.vehicle_mode === "institutional" || requestData.preferred_vehicle) && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-blue-900">Vehicle Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800 font-medium">Vehicle Mode:</span>
                      <span className="text-blue-900">{requestData.vehicle_mode || "Not specified"}</span>
                    </div>
                    {requestData.preferred_vehicle && (
                      <div className="flex justify-between">
                        <span className="text-blue-800 font-medium">Preferred Vehicle:</span>
                        <span className="text-blue-900">
                          {requestData.preferred_vehicle.vehicle_name || requestData.preferred_vehicle.plate_number || "—"}
                          {requestData.preferred_vehicle.plate_number && (
                            <span className="text-blue-700 ml-1">({requestData.preferred_vehicle.plate_number})</span>
                          )}
                        </span>
                      </div>
                    )}
                    {requestData.preferred_driver && (
                      <div className="flex justify-between">
                        <span className="text-blue-800 font-medium">Preferred Driver:</span>
                        <span className="text-blue-900">{requestData.preferred_driver.name || "—"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Budget Breakdown */}
              {expenseBreakdown.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">Budget Breakdown</h3>
                  </div>
                  <div className="space-y-2">
                    {expenseBreakdown.map((expense: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-sm bg-white rounded p-2">
                        <div>
                          <div className="font-medium text-gray-900">{expense.item}</div>
                          {expense.description && expense.description !== expense.item && (
                            <div className="text-xs text-gray-500 mt-0.5">{expense.description}</div>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900">{peso(expense.amount)}</div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold text-gray-900">
                      <span>Total Budget</span>
                      <span className="text-[#7A0010]">{peso(totalBudget)}</span>
                    </div>
                  </div>
                  {requestData.cost_justification && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Cost Justification</p>
                      <p className="text-sm text-gray-800">{requestData.cost_justification}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Request History */}
              {history.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">Request History</h3>
                  </div>
                  <div className="space-y-3">
                    {history.map((entry, idx) => (
                      <div key={entry.id || idx} className="flex items-start gap-3 bg-white rounded p-3 border border-gray-200">
                        <div className="mt-0.5">
                          {entry.action === "requester_signed" || entry.action === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : entry.action === "rejected" ? (
                            <X className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 capitalize">
                                {entry.action.replace(/_/g, " ")}
                              </p>
                              {entry.actor && (
                                <p className="text-xs text-gray-600 mt-0.5">
                                  by {entry.actor.name || entry.actor.email}
                                  {entry.actor_role && (
                                    <span className="text-gray-500 ml-1">({entry.actor_role})</span>
                                  )}
                                </p>
                              )}
                              {entry.comments && (
                                <p className="text-xs text-gray-700 mt-1 italic">"{entry.comments}"</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDateTime(entry.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Section */}
              {!requestData.requester_signature && (
                <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Your Signature <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-600">
                      Please sign to approve this request. After signing, it will be forwarded to your department head.
                    </p>
                  </div>
                  <SignaturePad
                    height={160}
                    value={signature || null}
                    onSave={(dataUrl) => setSignature(dataUrl)}
                    onClear={() => setSignature("")}
                    hideSaveButton
                  />
                </div>
              )}

              {/* Already Signed Notice */}
              {requestData.requester_signature && (
                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-bold text-green-900">Already Signed</h3>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <img 
                      src={requestData.requester_signature} 
                      alt="Requester Signature" 
                      className="max-h-32 mx-auto"
                    />
                  </div>
                  {requestData.requester_signed_at && (
                    <p className="text-xs text-green-700 mt-2 text-center">
                      Signed on: {formatDateTime(requestData.requester_signed_at)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!requestData.requester_signature && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSign}
              disabled={submitting || !signature || loadingDetails}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Sign & Forward
                </>
              )}
            </button>
          </div>
        )}
        {requestData.requester_signature && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
