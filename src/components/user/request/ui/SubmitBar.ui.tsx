"use client";

import * as React from "react";
import { Send, AlertTriangle, Lightbulb } from "lucide-react";
import ErrorSummaryModal from "./ErrorSummaryModal.ui";

export default function SubmitBar({
  invalid,
  saving,
  submitting,
  onSaveDraft,
  onSubmit,
  headName,
  department,
  isHeadRequester,
  requestingPersonIsHead,
  isRepresentativeSubmission,
  requestingPersonName,
  vehicleMode,
  errors,
  onGoToField,
}: {
  invalid: boolean;
  saving: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  headName?: string;
  department?: string;
  isHeadRequester?: boolean;
  requestingPersonIsHead?: boolean | null;
  isRepresentativeSubmission?: boolean;
  requestingPersonName?: string;
  vehicleMode?: "owned" | "institutional" | "rent";
  errors?: Record<string, string>;
  onGoToField?: (fieldKey: string) => void;
}) {
  const [showErrorModal, setShowErrorModal] = React.useState(false);

  const handleReviewFields = () => {
    if (errors && Object.keys(errors).length > 0) {
      setShowErrorModal(true);
    } else {
      // Fallback: scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        (firstError as HTMLElement).focus();
      }
    }
  };
  // Determine button text based on role and requesting person
  // If representative submission (requesting person ≠ submitter), send to requesting person first
  // If requesting person is NOT a head, send to their department head first
  // If requesting person IS a head, can go directly to admin
  const submitButtonText = isRepresentativeSubmission
    ? `Send to ${requestingPersonName || "Requesting Person"}`
    : requestingPersonIsHead === true || isHeadRequester
    ? (vehicleMode === "institutional" ? "Send to Transport Manager" : "Send to Admin")
    : "Send to Department Head";
  
  // Determine helper text
  const helperRecipient = isRepresentativeSubmission
    ? requestingPersonName || "requesting person"
    : requestingPersonIsHead === true || isHeadRequester
    ? (vehicleMode === "institutional" ? "Transport Manager" : "Admin")
    : "department head";
  
  return (
    <div className="sticky bottom-3 z-30 mt-2 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ready to submit?</p>
          {isRepresentativeSubmission ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Send className="h-3.5 w-3.5" />
              Will be sent to: <span className="font-medium text-[#7A0010]">{requestingPersonName || "Requesting Person"}</span>
              <span className="text-gray-400 ml-1">(for signature and approval)</span>
            </p>
          ) : requestingPersonIsHead === true || isHeadRequester ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Send className="h-3.5 w-3.5" />
              Request will be sent to {helperRecipient}
            </p>
          ) : requestingPersonIsHead === false && headName && department ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Send className="h-3.5 w-3.5" />
              Will be sent to: <span className="font-medium text-[#7A0010]">{headName}</span> ({department})
              <span className="text-gray-400 ml-1">(for signature)</span>
            </p>
          ) : headName && department ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Send className="h-3.5 w-3.5" />
              Will be sent to: <span className="font-medium text-[#7A0010]">{headName}</span> ({department})
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Send className="h-3.5 w-3.5" />
              Your request will be sent to your department head
            </p>
          )}
        </div>
        {invalid && (
          <button
            onClick={handleReviewFields}
            className="flex items-center gap-1.5 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-all hover:border-amber-400 hover:from-amber-100 hover:to-amber-200 hover:shadow-md"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Review fields ({errors ? Object.keys(errors).length : "?"})
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save as Draft
            </span>
          )}
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting || invalid}
          className="flex-1 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Sending...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {submitButtonText}
            </span>
          )}
        </button>
      </div>
      
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
        <Lightbulb className="h-3.5 w-3.5" />
        Tip: Save as draft if you need to continue later
      </p>

      {/* Error Summary Modal */}
      {errors && onGoToField && (
        <ErrorSummaryModal
          errors={errors}
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          onGoToField={onGoToField}
        />
      )}
    </div>
  );
}
