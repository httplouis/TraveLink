// src/components/admin/feedback/TripQRCodeModal.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Copy, Check, Calendar, MapPin, User } from "lucide-react";
import FeedbackQRCode from "@/components/common/FeedbackQRCode";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

type Trip = {
  id: string;
  request_number: string;
  requester_name: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  department?: {
    code: string;
    name: string;
  };
};

type Props = {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TripQRCodeModal({ trip, isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [feedbackLink, setFeedbackLink] = React.useState<{
    url: string;
    token: string;
    expiresAt: string;
    requestNumber: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen && trip) {
      generateFeedbackLink();
    } else {
      setFeedbackLink(null);
    }
  }, [isOpen, trip]);

  const generateFeedbackLink = async () => {
    if (!trip) return;

    setLoading(true);
    try {
      const res = await fetch("/api/feedback/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: trip.id,
          expiresInDays: 7,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        setFeedbackLink(json.data);
      } else {
        toast({ message: json.error || "Failed to generate feedback link", kind: "error" });
      }
    } catch (err) {
      console.error("Failed to generate feedback link:", err);
      toast({ message: "Failed to generate feedback link. Please try again.", kind: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !trip) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Generate Feedback QR Code</h2>
              <p className="text-white/90 text-sm">{trip.request_number}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
            {/* Trip Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <User className="h-4 w-4 text-[#7A0010]" />
                Requester
              </div>
              <div className="text-base text-gray-900">{trip.requester_name}</div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MapPin className="h-4 w-4 text-[#7A0010]" />
                Destination
              </div>
              <div className="text-base text-gray-900">{trip.destination}</div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Calendar className="h-4 w-4 text-[#7A0010]" />
                Travel Dates
              </div>
              <div className="text-base text-gray-900">
                {new Date(trip.travel_start_date).toLocaleDateString()} - {new Date(trip.travel_end_date).toLocaleDateString()}
              </div>

              {trip.department && (
                <>
                  <div className="text-sm font-semibold text-gray-900">Department</div>
                  <div className="text-base text-gray-900">{trip.department.name} ({trip.department.code})</div>
                </>
              )}
            </div>

            {/* QR Code */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
              </div>
            ) : feedbackLink ? (
              <FeedbackQRCode
                url={feedbackLink.url}
                requestNumber={feedbackLink.requestNumber}
                onCopy={() => {
                  toast({ message: "Link copied to clipboard!", kind: "success" });
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                Failed to generate feedback link
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

