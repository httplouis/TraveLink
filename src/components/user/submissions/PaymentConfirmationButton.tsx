// src/components/user/submissions/PaymentConfirmationButton.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

type Props = {
  requestId: string;
  requestNumber: string;
  totalBudget: number;
  editedBudget?: number;
  onConfirmed?: () => void;
};

export default function PaymentConfirmationButton({
  requestId,
  requestNumber,
  totalBudget,
  editedBudget,
  onConfirmed,
}: Props) {
  const toast = useToast();
  const [showModal, setShowModal] = React.useState(false);
  const [paymentNotes, setPaymentNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (!paymentNotes.trim()) {
      toast({ message: "Please add payment confirmation notes", kind: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          paymentNotes: paymentNotes.trim(),
        }),
      });

      const json = await res.json();

      if (json.ok) {
        toast({
          message: "✅ Payment confirmed successfully! Comptroller has been notified.",
          kind: "success",
        });
        setShowModal(false);
        setPaymentNotes("");
        if (onConfirmed) {
          onConfirmed();
        }
      } else {
        toast({ message: json.error || "Failed to confirm payment", kind: "error" });
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      toast({ message: "Failed to confirm payment. Please try again.", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const finalBudget = editedBudget || totalBudget;

  return (
    <>
      {/* Payment Confirmation Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-4"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">₱</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-bold text-amber-900">Payment Confirmation Required</h3>
            </div>
            <p className="text-sm text-amber-800 mb-4">
              The comptroller has reviewed your budget and requires payment confirmation before proceeding to HR.
            </p>
            
            {/* Budget Display */}
            <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Total Budget</div>
                  {editedBudget && editedBudget !== totalBudget ? (
                    <div>
                      <div className="text-sm text-gray-400 line-through">₱{totalBudget.toLocaleString()}</div>
                      <div className="text-xl font-bold text-amber-700">₱{editedBudget.toLocaleString()}</div>
                      <div className="text-xs text-amber-600 mt-1">Budget adjusted by comptroller</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-gray-900">₱{totalBudget.toLocaleString()}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600 mb-1">Amount to Pay</div>
                  <div className="text-2xl font-bold text-[#7A0010]">₱{finalBudget.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <CheckCircle className="h-5 w-5" />
              Confirm Payment
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please confirm that you have made the payment for request <strong>{requestNumber}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Confirmation Notes <span className="text-red-600">*</span>
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g., Payment made via bank transfer, reference number: XXX, date: YYYY-MM-DD"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include payment method, reference number, and date if applicable.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPaymentNotes("");
                }}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting || !paymentNotes.trim()}
                className="px-6 py-2 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

