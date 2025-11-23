"use client";

import React from "react";
import { History, CheckCircle, XCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import TrackingModal from "@/components/common/TrackingModal";
import { cardVariants, staggerContainer } from "@/lib/animations";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import HeadRequestModal from "@/components/head/HeadRequestModal";

export default function HeadHistoryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Set page title
  React.useEffect(() => {
    document.title = "Head History - Travelink";
  }, []);

  const logger = createLogger("HeadHistory");

  React.useEffect(() => {
    logger.info("Loading head history...");
    setLoading(true);
    fetch("/api/head/history", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.ok) {
          setItems(json.data || []);
          logger.success(`Loaded ${json.data?.length || 0} history items`);
        } else {
          logger.error("Failed to load history:", json.error);
          setItems([]);
        }
      })
      .catch((err) => {
        logger.error("Error loading history:", err);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter items by search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const requester = (item.requester?.name || item.requester_name || item.requester?.email || "").toLowerCase();
      const department = (item.department?.name || item.department?.code || "").toLowerCase();
      const purpose = (item.purpose || "").toLowerCase();
      const requestNumber = (item.request_number || "").toLowerCase();
      
      return requester.includes(query) || 
             department.includes(query) || 
             purpose.includes(query) ||
             requestNumber.includes(query);
    });
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#7A0010] rounded-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#7A0010]">Request History</h1>
          </div>
          <p className="text-slate-600">
            View all requests you have reviewed, approved, or rejected
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by requester, department, purpose, or request number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRequestCard key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
            <History className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              {searchQuery ? "No matching requests" : "No history yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery
                ? "Try adjusting your search criteria."
                : "When you approve or reject requests, they will appear here."}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filteredItems.map((item, index) => (
              <motion.div key={item.id} variants={cardVariants}>
                <RequestCardEnhanced
                  request={{
                    id: item.id,
                    request_number: item.request_number || "—",
                    file_code: item.file_code,
                    title: item.title,
                    purpose: item.purpose || "No purpose indicated",
                    destination: item.destination,
                    travel_start_date: item.travel_start_date,
                    travel_end_date: item.travel_end_date,
                    status: item.status,
                    created_at: item.created_at,
                    total_budget: item.total_budget,
                    request_type: item.request_type,
                    requester_name: item.requester?.name || item.requester_name,
                    requester: {
                      name: item.requester?.name || item.requester_name || "Unknown",
                      email: item.requester?.email,
                      profile_picture: item.requester?.profile_picture || item.requester?.avatar_url,
                      department: item.department?.name || item.department?.code,
                      position: item.requester?.position_title,
                    },
                    department: item.department,
                  }}
                  showActions={true}
                  onView={() => setSelected(item)}
                  onTrack={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Request Detail Modal */}
        {selected && (
          <HeadRequestModal
            request={selected}
            onClose={() => setSelected(null)}
            onApproved={() => {
              setSelected(null);
              // Reload history
              fetch("/api/head/history", { cache: "no-store" })
                .then((res) => res.json())
                .then((json) => {
                  if (json.ok) {
                    setItems(json.data || []);
                  }
                });
            }}
            onRejected={() => {
              setSelected(null);
              // Reload history
              fetch("/api/head/history", { cache: "no-store" })
                .then((res) => res.json())
                .then((json) => {
                  if (json.ok) {
                    setItems(json.data || []);
                  }
                });
            }}
            viewOnly={true}
          />
        )}

        {/* Tracking Modal */}
        {showTrackingModal && trackingRequest && (
          <TrackingModal
            requestId={trackingRequest.id}
            requestNumber={trackingRequest.request_number}
            onClose={() => {
              setShowTrackingModal(false);
              setTrackingRequest(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

