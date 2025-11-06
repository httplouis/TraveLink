"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Eye, CheckCircle, XCircle, AlertCircle, MapPin, Calendar, FileText, User, Building2 } from "lucide-react";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { SkeletonRequestCard } from "@/components/common/ui/Skeleton";

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
  const [fullRequestData, setFullRequestData] = React.useState<any>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [loadingDetails, setLoadingDetails] = React.useState(false);

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
    setShowTrackingModal(true);
    setLoadingHistory(true);
    
    // Fetch history
    try {
      const res = await fetch(`/api/requests/${request.id}/history`);
      const json = await res.json();
      
      if (json.ok) {
        setHistory(json.data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function viewDetails(request: Request) {
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    // Fetch full request details
    try {
      const res = await fetch(`/api/requests/${request.id}`);
      const json = await res.json();
      
      if (json.ok) {
        setFullRequestData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch request details:", err);
    } finally {
      setLoadingDetails(false);
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
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRequestCard key={i} />
        ))}
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
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 hover:shadow-md hover:ring-2 hover:ring-[#7A0010]/20 transition-all cursor-pointer"
            onClick={() => viewDetails(req)}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewDetails(req);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewTracking(req);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Tracking
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTrackingModal && selectedRequest && (
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
                    onClick={() => setShowTrackingModal(false)}
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
                
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#7A0010] border-r-transparent"></div>
                    <div className="text-gray-500 mt-2">Loading timeline...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Always show creation event */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        {history.length > 0 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[20px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="font-medium text-gray-900">Created</div>
                        <div className="text-sm text-gray-600 mt-1">Request created and submitted</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Draft → {WorkflowEngine.getStatusLabel(selectedRequest.status as any)}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(selectedRequest.created_at).toLocaleString()}
                        </div>
                      </div>
                    </motion.div>

                    {/* History events - filter out "created" action to avoid duplicates */}
                    {history.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Waiting for approval...
                      </div>
                    ) : (
                      history.filter(item => item.action !== 'created').map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 1) * 0.1 }}
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
                            <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[20px]" />
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
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="rounded-lg bg-[#7A0010] px-4 py-2 text-white hover:bg-[#5A0010] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold">{selectedRequest.request_number}</div>
                    <div className="text-white/90 mt-1">{selectedRequest.title || selectedRequest.purpose}</div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="rounded-lg bg-white/20 p-2 hover:bg-white/30 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#7A0010] border-r-transparent"></div>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      {WorkflowEngine.getStatusLabel(selectedRequest.status as any)}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purpose</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                      {selectedRequest.purpose}
                    </div>
                  </div>

                  {/* Travel Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Destination</label>
                      <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedRequest.destination}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</label>
                      <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{selectedRequest.department.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Departure Date</label>
                      <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{new Date(selectedRequest.travel_start_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Return Date</label>
                      <div className="mt-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{new Date(selectedRequest.travel_end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  {selectedRequest.has_budget && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Budget</label>
                      <div className="mt-1 p-3 bg-green-50 rounded-lg text-lg font-semibold text-green-900">
                        ₱{selectedRequest.total_budget.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Requester Info */}
                  {fullRequestData && (
                    <div className="border-t pt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requesting Person</label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="font-semibold text-gray-900">{fullRequestData.requester_name || fullRequestData.requester?.name || 'N/A'}</span>
                        </div>
                        {fullRequestData.submitted_by_name && fullRequestData.is_representative && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">Submitted by: {fullRequestData.submitted_by_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expense Breakdown */}
                  {fullRequestData?.expense_breakdown && fullRequestData.expense_breakdown.length > 0 && (
                    <div className="border-t pt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Expense Breakdown</label>
                      <div className="space-y-2">
                        {fullRequestData.expense_breakdown.map((expense: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{expense.item}</div>
                              {expense.description && (
                                <div className="text-xs text-gray-500">{expense.description}</div>
                              )}
                            </div>
                            <div className="font-semibold text-gray-900">₱{expense.amount.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Preferences */}
                  {fullRequestData && (fullRequestData.preferred_driver_id || fullRequestData.preferred_vehicle_id) && (
                    <div className="border-t pt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Service Preferences</label>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-gray-600 mb-3">Suggestions from requester (Admin will make final assignment)</div>
                        <div className="space-y-2">
                          {fullRequestData.preferred_driver_id && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-700">Preferred Driver: <span className="font-medium">{fullRequestData.preferred_driver_name || 'Loading...'}</span></span>
                            </div>
                          )}
                          {fullRequestData.preferred_vehicle_id && (
                            <div className="flex items-center gap-2 text-sm">
                              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-gray-700">Preferred Vehicle: <span className="font-medium">{fullRequestData.preferred_vehicle_name || 'Loading...'}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signatures */}
                  {fullRequestData?.requester_signature && (
                    <div className="border-t pt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Requester Signature</label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <img src={fullRequestData.requester_signature} alt="Signature" className="h-20 object-contain" />
                      </div>
                    </div>
                  )}

                  {/* Submitted */}
                  <div className="border-t pt-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    viewTracking(selectedRequest);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Tracking
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
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
