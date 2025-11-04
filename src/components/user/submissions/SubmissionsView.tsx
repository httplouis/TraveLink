"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, CheckCircle, XCircle, AlertCircle, MapPin, Calendar } from "lucide-react";
import { WorkflowEngine } from "@/lib/workflow/engine";

type Request = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  created_at: string;
  has_budget: boolean;
  total_budget: number;
  department: {
    code: string;
    name: string;
  };
};

type HistoryItem = {
  id: string;
  action: string;
  actor: {
    name: string;
    email: string;
  };
  previous_status: string;
  new_status: string;
  comments: string;
  created_at: string;
};

export default function SubmissionsView() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/requests/my-submissions");
      const json = await res.json();
      
      if (json.ok) {
        setRequests(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function viewTracking(request: Request) {
    setSelectedRequest(request);
    setShowModal(true);
    
    // Fetch history
    try {
      const res = await fetch(`/api/requests/${request.id}/history`);
      const json = await res.json();
      
      if (json.ok) {
        setHistory(json.data.history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }

  function getStatusColor(status: string) {
    if (status === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (status === "rejected" || status === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    if (status.startsWith("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  }

  function getStatusIcon(status: string) {
    if (status === "approved") return <CheckCircle className="h-4 w-4" />;
    if (status === "rejected" || status === "cancelled") return <XCircle className="h-4 w-4" />;
    if (status.startsWith("pending")) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading your submissions...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-gray-500 mb-4">No submissions yet</div>
        <a
          href="/user/request"
          className="rounded-lg bg-[#7A0010] px-4 py-2 text-white hover:bg-[#5A0010] transition-colors"
        >
          Create Request
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{req.request_number}</div>
                <div className="text-sm text-gray-600 mt-0.5">{req.title || req.purpose}</div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${getStatusColor(req.status)}`}>
                {getStatusIcon(req.status)}
                {WorkflowEngine.getStatusLabel(req.status as any)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{req.destination || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{new Date(req.travel_start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{req.department.code}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-gray-500">
                Submitted: {new Date(req.created_at).toLocaleString()}
              </div>
              <button
                onClick={() => viewTracking(req)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View Tracking
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold">{selectedRequest.request_number}</div>
                    <div className="text-white/90 mt-1">{selectedRequest.title || selectedRequest.purpose}</div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                <div className="text-sm font-semibold text-gray-900 mb-4">Request Timeline</div>
                
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tracking history available yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            item.action === "approved" ? "bg-green-100 text-green-600" :
                            item.action === "rejected" ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {getStatusIcon(item.new_status)}
                          </div>
                          {index < history.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <div className="font-medium text-gray-900">
                            {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.actor.name || item.actor.email}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {WorkflowEngine.getStatusLabel(item.previous_status as any)} → {WorkflowEngine.getStatusLabel(item.new_status as any)}
                          </div>
                          {item.comments && (
                            <div className="mt-2 text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {item.comments}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(item.created_at).toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-[#7A0010] px-4 py-2 text-white hover:bg-[#5A0010] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
