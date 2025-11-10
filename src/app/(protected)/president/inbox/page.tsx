"use client";

import React from "react";
import { Eye, Shield } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import TrackingModal from "@/components/common/TrackingModal";
import PresidentRequestModal from "@/components/president/PresidentRequestModal";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function PresidentInbox() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  
  // Set page title
  React.useEffect(() => {
    document.title = "President Inbox - TraviLink";
  }, []);

  const loadInbox = () => {
    fetch("/api/president/inbox")
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
    // Initial load
    fetch("/api/president/inbox")
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
            request_number: "TO-2025-100",
            requester_name: "Dr. Carlos Remiendo",
            department: { name: "Finance", code: "FIN" },
            purpose: "International finance conference in Singapore",
            travel_start_date: "2025-12-01",
            total_budget: 85000,
            status: "pending_president",
            priority: "high",
            requester: {
              profile_picture: null,
              position_title: "Vice President for Finance",
            },
          },
          {
            id: "2",
            request_number: "TO-2025-101",
            requester_name: "Dr. Maria Avila",
            department: { name: "HR", code: "HR" },
            purpose: "HR Leadership summit in Bangkok",
            travel_start_date: "2025-11-25",
            total_budget: 65000,
            status: "pending_president",
            priority: "high",
            requester: {
              profile_picture: null,
              position_title: "HR Director",
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

  const highBudgetCount = items.filter(item => item.total_budget > 50000).length;

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
          <h1 className="text-3xl font-bold text-gray-900">Final Review Queue</h1>
          <p className="text-gray-600 mt-1">
            {items.length} {items.length === 1 ? 'request' : 'requests'} requiring presidential approval
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a0019] to-[#9a0020] text-white rounded-lg text-sm font-medium shadow-lg">
          <Shield className="h-4 w-4" />
          Final Authority
        </div>
      </div>

      {/* High Budget Banner */}
      {highBudgetCount > 0 && (
        <motion.div
          variants={cardVariants}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white font-bold">{highBudgetCount}</span>
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                High-Budget Requests Awaiting Final Approval
              </p>
              <p className="text-sm text-amber-700">
                These requests exceed ₱50,000 and require presidential review
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Inbox List */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pending final reviews
          </h3>
          <p className="text-gray-500">
            All requests have been reviewed and approved
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={cardVariants}
              onClick={() => setSelected(item)}
              className={`group flex w-full items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer ${
                item.total_budget > 50000 
                  ? 'border-amber-300 bg-amber-50/30' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  {item.total_budget > 50000 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
                      HIGH BUDGET
                    </span>
                  )}
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
                <StatusBadge status="pending_president" size="md" showIcon={true} />
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

      {/* President Request Modal */}
      {selected && (
        <PresidentRequestModal
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
