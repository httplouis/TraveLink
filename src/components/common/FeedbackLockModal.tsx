// src/components/common/FeedbackLockModal.tsx
/**
 * Feedback Lock Modal - Forces user to provide feedback before continuing
 * This modal appears when a trip is completed and feedback is required
 */

"use client";

import React from "react";
import { AlertCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackLockModalProps {
  open: boolean;
  requestId: string;
  requestNumber?: string;
  message?: string;
  onClose?: () => void; // Only allow close after feedback is provided
}

export default function FeedbackLockModal({
  open,
  requestId,
  requestNumber,
  message,
  onClose
}: FeedbackLockModalProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header - Cannot be closed */}
          <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-6 py-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Feedback Required</h2>
              <p className="text-white/90 text-sm mt-0.5">
                Your trip has been completed. Please provide feedback to continue.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    {message || `Please provide feedback for your completed trip${requestNumber ? ` (${requestNumber})` : ''}.`}
                  </p>
                  <p className="text-xs text-blue-700">
                    Your feedback helps us improve our transport services. This step is required before you can continue using the system.
                  </p>
                  <p className="text-xs text-blue-800 font-semibold mt-2">
                    → Click "Provide Feedback Now" button below to proceed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Request Number:</strong> {requestNumber || "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                Your feedback will be anonymous and will help improve future trips.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-sm text-gray-600 text-center">
                <strong className="text-[#7A0010]">Click the button below</strong> to provide your feedback and continue using the system.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  console.log('[FeedbackLockModal] Navigating to feedback page');
                  window.location.href = `/user/feedback?request_id=${requestId}&locked=true`;
                }}
                className="px-8 py-4 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white font-semibold rounded-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3 text-lg relative z-10 cursor-pointer"
              >
                <MessageSquare className="h-5 w-5" />
                Provide Feedback Now
                <span className="ml-2 animate-pulse">→</span>
              </button>
            </div>
          </div>

          {/* Note: Modal cannot be closed until feedback is provided */}
          <div className="absolute top-4 right-4">
            <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
              Required
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

