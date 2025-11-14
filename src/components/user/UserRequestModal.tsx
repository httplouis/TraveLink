"use client";

import * as React from "react";
import { X, CheckCircle, XCircle, Calendar, MapPin, DollarSign, FileText, User, Users } from "lucide-react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import { useToast } from "@/components/common/ui/Toast";

type Props = {
  request: any;
  onClose: () => void;
  onSigned: () => void;
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

export default function UserRequestModal({
  request,
  onClose,
  onSigned,
}: Props) {
  const toast = useToast();
  const [signature, setSignature] = React.useState<string>(request.requester_signature || "");
  const [submitting, setSubmitting] = React.useState(false);

  const expenseBreakdown = request.expense_breakdown || [];
  const totalBudget = request.total_budget || 0;

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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Sign Request</h2>
            <p className="text-sm text-white/80 mt-1">
              Request #{request.request_number || request.id?.slice(0, 8)}
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
          {/* Representative Submission Notice */}
          {request.is_representative && request.submitted_by_name && (
            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    This request was submitted on your behalf
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Submitted by: <span className="font-medium">{request.submitted_by_name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Request Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Purpose</label>
              <p className="text-sm font-medium text-gray-900">{request.purpose || "—"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Destination</label>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{request.destination || "—"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Departure Date</label>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(request.travel_start_date)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Return Date</label>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(request.travel_end_date)}</span>
              </div>
            </div>
          </div>

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
                  <span>Total</span>
                  <span className="text-[#7A0010]">{peso(totalBudget)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signature Section */}
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
        </div>

        {/* Footer */}
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
            disabled={submitting || !signature}
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
      </div>
    </div>
  );
}

