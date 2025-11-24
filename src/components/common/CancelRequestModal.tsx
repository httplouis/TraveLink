"use client";
import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, AlertTriangle, Lock } from "lucide-react";
import PasswordConfirmDialog from "./PasswordConfirmDialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, password?: string) => Promise<void>;
  isAdmin: boolean;
  isLoading?: boolean;
  requestNumber?: string;
};

export default function CancelRequestModal({
  open,
  onClose,
  onConfirm,
  isAdmin,
  isLoading = false,
  requestNumber,
}: Props) {
  const [reason, setReason] = React.useState("");
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError("");
      setShowPasswordDialog(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Cancellation reason is required");
      return;
    }

    if (reason.trim().length < 10) {
      setError("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    setError("");

    // If admin, show password dialog first
    if (isAdmin) {
      setShowPasswordDialog(true);
    } else {
      // Requester can proceed directly
      await onConfirm(reason.trim());
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    setShowPasswordDialog(false);
    await onConfirm(reason.trim(), password);
  };

  return (
    <>
      <Dialog open={open && !showPasswordDialog} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
                  Cancel Request
                </Dialog.Title>
                <div className="text-sm text-gray-600">
                  {requestNumber && `Request ${requestNumber} will be cancelled. `}
                  This action cannot be undone.
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="Please provide a detailed reason for cancelling this request..."
                rows={4}
                className={`w-full rounded-lg border-2 px-4 py-2.5 text-sm outline-none transition-colors resize-none ${
                  error
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
                Minimum 10 characters required
              </p>
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
                disabled={isLoading || !reason.trim()}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Processing..." : "Cancel Request"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {isAdmin && (
        <PasswordConfirmDialog
          open={showPasswordDialog}
          title="Confirm Cancellation"
          message="Enter your password to confirm cancellation of this request."
          confirmLabel="Confirm Cancellation"
          cancelLabel="Go Back"
          onConfirm={handlePasswordConfirm}
          onCancel={() => setShowPasswordDialog(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

