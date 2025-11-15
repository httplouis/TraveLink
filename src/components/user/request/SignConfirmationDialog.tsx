"use client";

import * as React from "react";
import { CheckCircle, X, User, Building2, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";

interface Approver {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  department?: string;
  departmentCode?: string;
  position?: string;
}

interface SignConfirmationDialogProps {
  open: boolean;
  requestId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SignConfirmationDialog({
  open,
  requestId,
  onConfirm,
  onCancel,
}: SignConfirmationDialogProps) {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [nextStatusLabel, setNextStatusLabel] = React.useState<string>("");
  const [approvers, setApprovers] = React.useState<Approver[]>([]);
  const [message, setMessage] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && requestId) {
      fetchNextApprovers();
    }
  }, [open, requestId]);

  async function fetchNextApprovers() {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[SignConfirmationDialog] Fetching next approvers for request:", requestId);
      
      const response = await fetch(`/api/requests/${requestId}/next-approvers`);
      const data = await response.json();
      
      console.log("[SignConfirmationDialog] API Response:", {
        ok: response.ok,
        status: response.status,
        dataOk: data.ok,
        data: data.data,
        error: data.error,
      });
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch next approvers");
      }
      
      console.log("[SignConfirmationDialog] Setting approvers:", {
        nextStatusLabel: data.data.nextStatusLabel,
        approversCount: data.data.approvers?.length || 0,
        approvers: data.data.approvers,
        message: data.data.message,
      });
      
      setNextStatusLabel(data.data.nextStatusLabel);
      setApprovers(data.data.approvers || []);
      setMessage(data.data.message || "");
    } catch (err: any) {
      console.error("[SignConfirmationDialog] Error:", err);
      setError(err.message || "Failed to load approver information");
      toast.error("Error", "Could not load approver information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-purple-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Confirm Sign & Forward</h2>
              <p className="text-sm text-white/90 mt-0.5">
                Review who will receive this request after you sign
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
              <p className="text-sm text-gray-600">Loading approver information...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error Loading Approvers</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Next Status Info */}
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-900">Next Approval Stage</h3>
                </div>
                <p className="text-sm text-blue-800">
                  After signing, this request will be forwarded to: <span className="font-semibold">{nextStatusLabel}</span>
                </p>
              </div>

              {/* Approvers List */}
              {approvers.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-bold text-gray-900">
                      {approvers.length === 1 ? "Approver" : "Approvers"}
                    </h3>
                  </div>
                  
                  {approvers.map((approver) => (
                    <div
                      key={approver.id}
                      className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {approver.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900">{approver.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                                  {approver.roleLabel}
                                </span>
                                {approver.departmentCode && (
                                  <span className="text-xs text-gray-500">
                                    {approver.departmentCode}
                                  </span>
                                )}
                              </div>
                              {approver.position && (
                                <p className="text-xs text-gray-600 mt-0.5">{approver.position}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{approver.email}</span>
                              </div>
                              {approver.department && (
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                  <Building2 className="h-3 w-3" />
                                  <span>{approver.department}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">No Approver Found</p>
                      <p className="text-xs text-yellow-800 mt-1">
                        {message || "No department head is assigned for this department. Please contact your administrator before signing."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Message */}
              {message && approvers.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-700">{message}</p>
                </div>
              )}

              {/* Note */}
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-xs text-purple-800">
                  <strong>Note:</strong> After signing, the request will be automatically routed to the appropriate approver based on your department. If the request is returned for revision, you will be notified.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (approvers.length === 0 && !error)}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm & Sign
          </button>
        </div>
      </div>
    </div>
  );
}

