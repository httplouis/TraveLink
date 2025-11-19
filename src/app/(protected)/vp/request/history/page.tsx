"use client";

import React from "react";
import { History, CheckCircle, XCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import TrackingModal from "@/components/common/TrackingModal";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function VPHistoryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);

  // Set page title
  React.useEffect(() => {
    document.title = "VP History - Travelink";
  }, []);

  React.useEffect(() => {
    fetch("/api/vp/history")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          console.log("[VP History] Raw data:", data.data);
          if (data.data && data.data.length > 0) {
            console.log("[VP History] First item vp_approved_at:", data.data[0].vp_approved_at);
            console.log("[VP History] First item exec_approved_at:", data.data[0].exec_approved_at);
          }
          setItems(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, []);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    
    // Ensure the date string is treated as UTC if no timezone specified
    let isoString = dateStr;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      // If no timezone info, assume it's UTC and add Z
      isoString = dateStr + 'Z';
    }
    
    console.log("[formatDateTime] Input:", dateStr, "→ ISO:", isoString);
    
    const date = new Date(isoString);
    const formatted = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila"
    });
    
    console.log("[formatDateTime] Formatted:", formatted);
    return formatted;
  };

  const handleViewTracking = (item: any) => {
    setTrackingRequest(item);
    setShowTrackingModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval History</h1>
          <p className="text-gray-600 mt-1">
            {items.length} {items.length === 1 ? 'request' : 'requests'} reviewed by VP
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a0019] to-[#9a0020] text-white rounded-lg text-sm font-medium shadow-lg">
          <History className="h-4 w-4" />
          VP History
        </div>
      </div>

      {/* History List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No approval history
          </h3>
          <p className="text-gray-500">
            Requests you approve or reject will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              onClick={() => handleViewTracking(item)}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-[#7a0019] cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                    {item.request_number}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    {formatDateTime(item.vp_approved_at || item.rejected_at)}
                  </span>
                  {item.status === 'rejected' && item.rejection_stage === 'vp' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      <XCircle className="h-3 w-3" />
                      Rejected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                </div>

                <PersonDisplay
                  name={item.requester_name}
                  position={item.requester?.position_title}
                  department={item.department?.name}
                  profilePicture={item.requester?.profile_picture}
                  size="sm"
                />

                <p className="text-sm text-slate-600 line-clamp-1 mt-2">
                  {item.purpose}
                </p>

                {item.vp_comments && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-500">Your comments:</p>
                    <p className="text-sm text-slate-700">{item.vp_comments}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <StatusBadge status={item.status} size="md" showIcon={true} />
                <span className="text-lg font-bold text-[#7a0019]">
                  ₱{item.total_budget?.toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTracking(item);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#7a0019] hover:bg-[#7a0019] hover:text-white border border-[#7a0019] rounded transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      {trackingRequest && (
        <TrackingModal
          isOpen={showTrackingModal}
          requestId={trackingRequest.id}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingRequest(null);
          }}
        />
      )}
    </motion.div>
  );
}
