// src/app/(protected)/admin/feedback/page.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { QrCode, MessageSquare, Calendar, MapPin, User } from "lucide-react";
import { useFeedback } from "@/components/admin/feedback/logic/useFeedback";
import { FeedbackRepo } from "@/lib/admin/feedback/store";
import FeedbackTable from "@/components/admin/feedback/ui/FeedbackTable.ui";
import FeedbackForm from "@/components/admin/feedback/ui/FeedbackForm.ui";
import TripQRCodeModal from "@/components/admin/feedback/TripQRCodeModal";
import type { Feedback } from "@/lib/admin/feedback/types";

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

export default function FeedbackPage() {
  const { rows, refresh } = useFeedback();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<Feedback | null>(null);
  const [completedTrips, setCompletedTrips] = React.useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"feedback" | "trips">("feedback");

  React.useEffect(() => {
    loadCompletedTrips();
  }, []);

  const loadCompletedTrips = async () => {
    try {
      const res = await fetch("/api/admin/completed-trips");
      const json = await res.json();
      if (json.ok) {
        setCompletedTrips(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load completed trips:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleGenerateQR = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-sm text-gray-600 mt-1">View feedback and generate QR codes for student feedback</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#7A0010] px-4 py-2 text-white hover:bg-[#9c2a3a] transition-colors font-medium"
        >
          Add Feedback
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "feedback"
                ? "border-[#7A0010] text-[#7A0010]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Feedback Submissions
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "trips"
                ? "border-[#7A0010] text-[#7A0010]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <QrCode className="h-4 w-4 inline mr-2" />
            Completed Trips ({completedTrips.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "feedback" ? (
        <>
          <FeedbackTable
            rows={rows}
            onView={(f) => setView(f)}
            onDelete={(ids) => {
              FeedbackRepo.removeMany(ids);
              refresh();
            }}
          />
          <FeedbackForm
            open={open}
            onClose={() => setOpen(false)}
            onSave={(data) => {
              FeedbackRepo.create(data);
              refresh();
            }}
          />
          {view && (
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/40"
              onClick={() => setView(null)}
            >
              <div
                className="max-w-md rounded bg-white p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold">Feedback details</h2>
                <p className="mt-2 text-sm">
                  <strong>User:</strong> {view.user}
                </p>
                <p className="mt-1 text-sm">{view.message}</p>
                <button
                  className="mt-4 rounded bg-[#7A0010] px-3 py-1 text-white"
                  onClick={() => setView(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {loadingTrips ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading completed trips...</p>
            </div>
          ) : completedTrips.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed trips yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all p-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#7A0010]">{trip.request_number}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="truncate">{trip.requester_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(trip.travel_end_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateQR(trip)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <QrCode className="h-4 w-4" />
                      Generate QR Code
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      <TripQRCodeModal
        trip={selectedTrip}
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedTrip(null);
        }}
      />
    </div>
  );
}
