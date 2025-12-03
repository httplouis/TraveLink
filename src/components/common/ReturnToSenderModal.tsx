"use client";
import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, AlertTriangle, ArrowLeft } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (returnReason: string, comments: string) => Promise<void>;
  isLoading?: boolean;
  requestNumber?: string;
};

const RETURN_REASONS = [
  { value: 'budget_change', label: 'Budget Change Required' },
  { value: 'driver_change', label: 'Driver/Vehicle Change Required' },
  { value: 'details_change', label: 'Request Details Need Revision' },
  { value: 'missing_info', label: 'Missing Information or Attachments' },
  { value: 'other', label: 'Other' }
];

export default function ReturnToSenderModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  requestNumber,
}: Props) {
  const [returnReason, setReturnReason] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReturnReason("");
      setComments("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!returnReason.trim()) {
      setError("Return reason is required");
      return;
    }

    if (comments.trim().length < 10) {
      setError("Please provide detailed comments (at least 10 characters)");
      return;
    }

    setError("");

    await onConfirm(returnReason.trim(), comments.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
                Return to Sender
              </Dialog.Title>
              <div className="text-sm text-gray-600">
                {requestNumber && `Request ${requestNumber} will be returned to the requester for revision. `}
                The requester will be notified and can edit the request while preserving existing signatures.
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => {
                  setReturnReason(e.target.value);
                  setError("");
                }}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm outline-none transition-colors ${
                  error && !returnReason
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#7a1f2a] focus:ring-2 focus:ring-[#7a1f2a]/20"
                }`}
                disabled={isLoading}
              >
                <option value="">Select a reason...</option>
                {RETURN_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value);
                  setError("");
                }}
                placeholder="Please provide detailed comments explaining what needs to be revised..."
                rows={4}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm outline-none transition-colors resize-none ${
                  error && comments.trim().length < 10
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-[#7a1f2a] focus:ring-2 focus:ring-[#7a1f2a]/20"
                }`}
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-600">{error}</p>
              )}
              <p className="mt-1.5 text-xs text-gray-500">
                Minimum 10 characters required. Be specific about what needs to be changed.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="h-10 rounded-lg border-2 border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !returnReason.trim() || comments.trim().length < 10}
              className="h-10 rounded-lg bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Returning..." : "Return to Sender"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

