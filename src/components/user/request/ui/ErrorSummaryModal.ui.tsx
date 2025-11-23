"use client";

import * as React from "react";
import { X, AlertCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Errors = Record<string, string>;

interface ErrorSummaryModalProps {
  errors: Errors;
  isOpen: boolean;
  onClose: () => void;
  onGoToField: (fieldKey: string) => void;
}

// Map error keys to human-readable field names
const FIELD_LABELS: Record<string, string> = {
  // Travel Order Fields
  "travelOrder.date": "Date",
  "travelOrder.requestingPerson": "Requesting Person",
  "travelOrder.department": "Department",
  "travelOrder.destination": "Destination",
  "travelOrder.departureDate": "Departure Date",
  "travelOrder.returnDate": "Return Date",
  "travelOrder.purposeOfTravel": "Purpose of Travel",
  "travelOrder.requesterSignature": "Requesting Person's Signature",
  "travelOrder.endorsedByHeadSignature": "Department Head Signature",
  "travelOrder.requesters": "Additional Requesters",
  "travelOrder.costs.justification": "Justification for Renting/Hiring",
  "travelOrder.headEndorsements": "Head Endorsements",
  
  // Seminar Application Fields
  "seminar.applicationDate": "Application Date",
  "seminar.title": "Seminar/Training Title",
  "seminar.dateFrom": "Departure Date",
  "seminar.dateTo": "End Date",
  "seminar.venue": "Venue",
  "seminar.modality": "Modality",
  "seminar.typeOfTraining": "Type of Training",
  "seminar.trainingCategory": "Training Category",
  "seminar.applicants": "Applicants",
  "seminar.breakdown": "Expense Breakdown",
  "seminar.requesterSignature": "Requesting Person's Signature",
};

// Helper to get field label with fallback
function getFieldLabel(fieldKey: string): string {
  // Handle nested field errors (e.g., seminar.applicants.0.name)
  if (fieldKey.includes('.')) {
    const parts = fieldKey.split('.');
    if (parts[0] === 'seminar' && parts[1] === 'applicants') {
      const index = parseInt(parts[2]);
      const field = parts[3];
      if (!isNaN(index)) {
        if (field === 'name') return `Applicant ${index + 1} - Name`;
        if (field === 'department') return `Applicant ${index + 1} - Department`;
      }
    }
    if (parts[0] === 'seminar' && parts[1] === 'breakdown') {
      const index = parseInt(parts[2]);
      const field = parts[3];
      if (!isNaN(index)) {
        if (field === 'label') return `Expense Item ${index + 1} - Name`;
        if (field === 'amount') return `Expense Item ${index + 1} - Amount`;
      }
    }
  }
  
  return FIELD_LABELS[fieldKey] || fieldKey.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function ErrorSummaryModal({
  errors,
  isOpen,
  onClose,
  onGoToField,
}: ErrorSummaryModalProps) {
  const errorEntries = Object.entries(errors);
  const errorCount = errorEntries.length;

  if (!isOpen || errorCount === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[2001] w-[min(90vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-red-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                  <AlertCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    {errorCount} {errorCount === 1 ? "Field Required" : "Fields Required"}
                  </h3>
                  <p className="text-xs text-red-700">
                    Please complete the following fields to submit
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-red-600 transition-all hover:bg-red-100 hover:text-red-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Error List */}
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <ul className="space-y-2">
                {errorEntries.map(([fieldKey, errorMessage], index) => {
                  const fieldLabel = getFieldLabel(fieldKey);
                  return (
                    <motion.li
                      key={fieldKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        onClick={() => {
                          onGoToField(fieldKey);
                          onClose();
                        }}
                        className="group w-full rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100/30 p-4 text-left transition-all hover:border-red-300 hover:from-red-100 hover:to-red-200 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {index + 1}
                              </span>
                              <span className="font-semibold text-red-900">
                                {fieldLabel}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-red-700">
                              {errorMessage}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-red-400 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-red-100 bg-red-50/50 px-6 py-3">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-red-700 hover:to-red-800 hover:shadow-lg"
              >
                Got it, I'll fix these
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

