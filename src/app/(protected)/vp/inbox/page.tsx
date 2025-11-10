"use client";

import React from "react";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import TrackingModal from "@/components/common/TrackingModal";
import VPRequestModal from "@/components/vp/VPRequestModal";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function VPInbox() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);

  // Set page title
  React.useEffect(() => {
    document.title = "VP Inbox - TraviLink";
  }, []);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  
  const loadInbox = () => {
    fetch("/api/vp/inbox")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setItems(data.data || []);
        }
      })
      .catch(() => {
        setItems([]);
      });
  };

  React.useEffect(() => {
    fetch("/api/vp/inbox")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setItems(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => {
        // Mock data for development
        setItems([
          {
            id: "1",
            request_number: "TO-2025-001",
            requester_name: "Dr. John Smith",
            department: { name: "CNAHS", code: "CNAHS" },
            purpose: "Medical conference in Manila",
            travel_start_date: "2025-11-15",
            total_budget: 25000,
            status: "pending_exec",
            requester: {
              profile_picture: null,
              position_title: "Dean",
            },
          },
          {
            id: "2",
            request_number: "TO-2025-002",
            requester_name: "Prof. Maria Santos",
            department: { name: "CBA", code: "CBA" },
            purpose: "Business summit in Cebu",
            travel_start_date: "2025-11-20",
            total_budget: 18500,
            status: "pending_exec",
            requester: {
              profile_picture: null,
              position_title: "Professor",
            },
          },
        ]);
        setLoading(false);
      });
  }, []);

  // Auto-refresh every 30 seconds
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      loadInbox();
    }, 30000); // 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Review Queue</h1>
        <p className="text-gray-600 mt-1">
          {items.length} {items.length === 1 ? 'request' : 'requests'} requiring VP approval
        </p>
      </div>

      {/* Inbox List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pending reviews
          </h3>
          <p className="text-gray-500">
            All executive-level requests have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              onClick={() => setSelected(item)}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                    {item.request_number}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(item.travel_start_date).toLocaleDateString()}
                  </span>
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
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <StatusBadge status="pending_exec" size="md" showIcon={true} />
                <span className="text-lg font-bold text-[#7a0019]">
                  ₱{item.total_budget?.toLocaleString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#7a0019] hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Track
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* VP Request Modal */}
      {selected && (
        <VPRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={(id) => {
            setItems(items.filter(item => item.id !== id));
            setSelected(null);
            loadInbox();
          }}
          onRejected={(id) => {
            setItems(items.filter(item => item.id !== id));
            setSelected(null);
            loadInbox();
          }}
        />
      )}

      {/* Tracking Modal */}
      {trackingRequest && (
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingRequest(null);
          }}
          requestId={trackingRequest.id}
        />
      )}
    </motion.div>
  );
}
