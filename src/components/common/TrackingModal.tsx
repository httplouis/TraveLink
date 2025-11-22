"use client";

import React from "react";
import { X, MapPin, Calendar, Users as UsersIcon, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RequestStatusTracker from "./RequestStatusTracker";
import PersonDisplay from "./PersonDisplay";
import { modalVariants, modalOverlayVariants } from "@/lib/animations";

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export default function TrackingModal({ isOpen, onClose, requestId }: TrackingModalProps) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && requestId) {
      fetchTracking();
    }
  }, [isOpen, requestId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/requests/${requestId}/tracking`);
      const json = await res.json();
      
      if (!json.ok) {
        throw new Error(json.error || "Failed to fetch tracking data");
      }
      
      setData(json.data);
      console.log("[TrackingModal] Fetched data:", json.data);
      console.log("[TrackingModal] Approval data:", {
        head_approved_by: json.data.head_approved_by,
        head_approved_at: json.data.head_approved_at,
        admin_processed_by: json.data.admin_processed_by,
        admin_processed_at: json.data.admin_processed_at,
        comptroller_approved_by: json.data.comptroller_approved_by,
        comptroller_approved_at: json.data.comptroller_approved_at,
        hr_approved_by: json.data.hr_approved_by,
        hr_approved_at: json.data.hr_approved_at,
        exec_approved_by: json.data.exec_approved_by,
        exec_approved_at: json.data.exec_approved_at,
      });
    } catch (err: any) {
      console.error("Error fetching tracking:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    
    // Ensure the date string is treated as UTC if no timezone specified
    let isoString = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      isoString = dateStr + 'Z';
    }
    
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      timeZone: "Asia/Manila"
    }) + " at " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila"
    });
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.request_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#7a0019] to-[#9a0020]">
          <div>
            <h2 className="text-2xl font-bold text-white">Request Tracking</h2>
            {data && (
              <p className="text-white/80 text-sm mt-1">
                {data.request_number} - {data.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7a0019]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900">
              <p className="font-semibold">Error loading tracking data</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Request Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Requester</span>
                  </div>
                  <PersonDisplay
                    name={data.requester?.full_name || data.requester_name || "Unknown"}
                    position={data.requester?.position_title}
                    department={data.department?.name || data.department?.code}
                    profilePicture={data.requester?.profile_picture}
                    size="md"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Submitted</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(data.created_at)}
                  </p>
                </div>

                {data.has_budget && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <span className="text-base font-bold">₱</span>
                      <span className="text-xs font-medium uppercase">Budget</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {data.comptroller_edited_budget 
                        ? `₱${parseFloat(data.comptroller_edited_budget).toLocaleString()}`
                        : data.total_budget
                        ? `₱${parseFloat(data.total_budget).toLocaleString()}`
                        : "With budget requirement"}
                    </p>
                    {data.comptroller_edited_budget && (
                      <p className="text-xs text-gray-500">Verified by Comptroller</p>
                    )}
                  </div>
                )}

                {(data.assigned_vehicle || data.assigned_driver) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Assignment</span>
                    </div>
                    {data.assigned_vehicle && (
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">Vehicle:</span> {data.assigned_vehicle.model} ({data.assigned_vehicle.plate_number})
                      </p>
                    )}
                    {data.assigned_driver && (
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">Driver:</span> {data.assigned_driver.full_name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Multiple Requesters Section */}
              {data.has_multiple_requesters && data.requester_tracking && data.requester_tracking.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                    Additional Requesters ({data.requester_tracking.length})
                  </h3>
                  <div className="space-y-3">
                    {data.requester_tracking.map((requester: any, index: number) => (
                      <div
                        key={requester.id || index}
                        className="bg-white rounded-lg border border-blue-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{requester.name || 'Unknown'}</p>
                            {requester.department_name && (
                              <p className="text-sm text-gray-600 mt-1">{requester.department_name}</p>
                            )}
                            {requester.email && (
                              <p className="text-xs text-gray-500 mt-1">{requester.email}</p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              {requester.status === 'confirmed' && requester.confirmed_at && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Confirmed {new Date(requester.confirmed_at).toLocaleDateString()}
                                </span>
                              )}
                              {requester.status === 'declined' && requester.declined_at && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                  Declined {new Date(requester.declined_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {requester.signature && (
                            <img
                              src={requester.signature}
                              alt={`${requester.name}'s signature`}
                              className="h-12 w-32 rounded border border-gray-300 bg-white object-contain"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Timeline */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approval Timeline
                </h3>
                <RequestStatusTracker
                  status={data.status}
                  requesterIsHead={data.requester_is_head}
                  hasBudget={data.has_budget}
                  hasParentHead={data.has_parent_head}
                  requiresPresidentApproval={data.requires_president_approval}
                  bothVpsApproved={data.both_vps_approved || false}
                  adminSkipped={data.admin_skipped || false}
                  comptrollerSkipped={data.comptroller_skipped || false}
                  adminSkipReason={data.admin_skip_reason || null}
                  comptrollerSkipReason={data.comptroller_skip_reason || null}
                  headApprovedAt={data.head_approved_at}
                  headApprovedBy={data.head_approved_by}
                  parentHeadApprovedAt={data.parent_head_approved_at}
                  parentHeadApprovedBy={data.parent_head_approved_by}
                  adminProcessedAt={data.admin_processed_at}
                  adminProcessedBy={data.admin_processed_by}
                  comptrollerApprovedAt={data.comptroller_approved_at}
                  comptrollerApprovedBy={data.comptroller_approved_by}
                  hrApprovedAt={data.hr_approved_at}
                  hrApprovedBy={data.hr_approved_by}
                  vpApprovedAt={data.vp_approved_at}
                  vpApprovedBy={data.vp_approved_by}
                  vp2ApprovedAt={data.vp2_approved_at}
                  vp2ApprovedBy={data.vp2_approved_by}
                  presidentApprovedAt={data.president_approved_at}
                  presidentApprovedBy={data.president_approved_by}
                  execApprovedAt={data.exec_approved_at}
                  execApprovedBy={data.exec_approved_by}
                  rejectedAt={data.rejected_at}
                  rejectedBy={data.rejected_by}
                  rejectionStage={data.rejection_stage}
                />
              </div>

              {/* Comments Section */}
              {(data.head_comments || data.admin_comments || data.comptroller_comments || 
                data.hr_comments || data.vp_comments || data.vp2_comments || data.president_comments || data.exec_comments || data.rejection_reason) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Comments & Notes
                  </h3>
                  <div className="space-y-3">
                    {data.head_comments && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 uppercase mb-1">
                          Department Head
                        </p>
                        <p className="text-sm text-blue-900">{data.head_comments}</p>
                      </div>
                    )}
                    {data.admin_comments && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 uppercase mb-1">
                          Admin
                        </p>
                        <p className="text-sm text-purple-900">{data.admin_comments}</p>
                      </div>
                    )}
                    {data.comptroller_comments && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                        <p className="text-xs font-semibold text-green-900 uppercase mb-1">
                          Comptroller
                        </p>
                        <p className="text-sm text-green-900">{data.comptroller_comments}</p>
                      </div>
                    )}
                    {data.hr_comments && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                        <p className="text-xs font-semibold text-yellow-900 uppercase mb-1">
                          Human Resources
                        </p>
                        <p className="text-sm text-yellow-900">{data.hr_comments}</p>
                      </div>
                    )}
                    {data.vp_comments && (
                      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded">
                        <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">
                          Vice President
                        </p>
                        <p className="text-sm text-indigo-900">{data.vp_comments}</p>
                      </div>
                    )}
                    {data.vp2_comments && (
                      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded">
                        <p className="text-xs font-semibold text-indigo-900 uppercase mb-1">
                          Second Vice President
                        </p>
                        <p className="text-sm text-indigo-900">{data.vp2_comments}</p>
                      </div>
                    )}
                    {data.president_comments && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 uppercase mb-1">
                          President
                        </p>
                        <p className="text-sm text-purple-900">{data.president_comments}</p>
                      </div>
                    )}
                    {data.exec_comments && (
                      <div className="bg-pink-50 border-l-4 border-pink-500 p-3 rounded">
                        <p className="text-xs font-semibold text-pink-900 uppercase mb-1">
                          Executive
                        </p>
                        <p className="text-sm text-pink-900">{data.exec_comments}</p>
                      </div>
                    )}
                    {data.rejection_reason && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-xs font-semibold text-red-900 uppercase mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-900">{data.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-[#9a0020] transition-colors font-medium"
          >
            Close
          </button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
