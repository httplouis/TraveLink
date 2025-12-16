// src/components/user/request/SubmitConfirmationDialog.tsx
"use client";

import React from "react";
import { CheckCircle, XCircle, ArrowRight, AlertCircle } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requesterName: string;
  department: string;
  purpose: string;
  destination: string;
  travelDate: string;
  returnDate: string;
  approvalPath: string[];
  firstReceiver: string;
  isSubmitting?: boolean;
  headName?: string; // Department head name for display
  selectedApproverName?: string; // Selected approver name (for head requesters who selected admin/VP)
  isSeminar?: boolean; // Whether this is a seminar application
};

/**
 * Confirmation dialog before submitting a request
 * Shows request summary and approval routing path
 */
export default function SubmitConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  requesterName,
  department,
  purpose,
  destination,
  travelDate,
  returnDate,
  approvalPath,
  firstReceiver,
  isSubmitting = false,
  headName,
  selectedApproverName,
  isSeminar = false,
}: Props) {
  if (!isOpen) return null;

  const getApproverLabel = (role: string) => {
    const labels: Record<string, string> = {
      DEPT_HEAD: "Department Head",
      TM: "Transportation Management",
      ADMIN: "Transportation Management",
      COMPTROLLER: "Comptroller",
      HRD: "Human Resources",
      VP: "Vice President",
      "VP/COO": "VP/COO",
      "PRESIDENT/COO": "President / COO",
      PRESIDENT: "President",
      OSAS_ADMIN: "OSAS Admin",
      "TM(close-out)": "Transportation Management",
    };
    return labels[role] || role;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Confirm Request Submission
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Please review your request details before submitting
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Request Summary */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Request Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Requester:</span>
                <span className="font-medium text-gray-900">{requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-900">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span className="font-medium text-gray-900 text-right max-w-xs truncate">
                  {purpose}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Destination:</span>
                <span className="font-medium text-gray-900 text-right max-w-xs truncate">
                  {destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Travel Period:</span>
                <span className="font-medium text-gray-900">
                  {travelDate} → {returnDate}
                </span>
              </div>
            </div>
          </div>

          {/* Approval Routing */}
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Approval Routing Path
            </h3>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  FIRST
                </span>
                <span className="text-sm font-medium text-blue-900">
                  {selectedApproverName && selectedApproverName.trim() !== ""
                    ? `${selectedApproverName} - ${getApproverLabel(firstReceiver)}`
                    : firstReceiver === "DEPT_HEAD" && headName && headName.trim() !== ""
                    ? `${headName} - ${getApproverLabel(firstReceiver)}`
                    : getApproverLabel(firstReceiver)}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                {selectedApproverName && selectedApproverName.trim() !== ""
                  ? `Your request will be sent to ${selectedApproverName} (${getApproverLabel(firstReceiver)}) first for approval`
                  : firstReceiver === "DEPT_HEAD" && headName && headName.trim() !== ""
                  ? `Your request will be sent to ${headName}${department ? ` (${department})` : ''} first for approval`
                  : firstReceiver === "DEPT_HEAD"
                  ? `Your request will be sent to your department head${department ? ` (${department})` : ''} first for approval`
                  : `Your request will be sent to ${getApproverLabel(firstReceiver)} first for approval`}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {approvalPath.map((role, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-900">
                    {getApproverLabel(role)}
                  </span>
                  {idx < approvalPath.length - 1 && (
                    <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Once submitted, this request cannot be edited
              until it's been reviewed. Make sure all information is correct.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#7A0010] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#5A0010] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
