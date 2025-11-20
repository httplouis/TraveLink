// src/app/(protected)/comptroller/inbox/page.tsx
"use client";

import React from "react";
import { Search, Clock, User, Building2, MapPin, Calendar, DollarSign, FileText } from "lucide-react";
import ComptrollerReviewModal from "@/components/comptroller/ComptrollerReviewModal";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import { motion } from "framer-motion";
import PageTitle from "@/components/common/PageTitle";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";

type Request = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  total_budget: number;
  comptroller_edited_budget?: number;
  travel_start_date: string;
  created_at: string;
  status: string;
  requester?: {
    name: string;
    email: string;
  };
  department?: {
    code: string;
    name: string;
  };
};

export default function ComptrollerInboxPage() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  // Set page title
  React.useEffect(() => {
    document.title = "TraviLink | Comptroller";
  }, []);

  React.useEffect(() => {
    // Only load once on mount - no auto-reload
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const logger = createLogger("ComptrollerInbox");
    try {
      setLoading(true);
      logger.info("Loading comptroller requests...");
      
      // Get current user's ID for filtering
      const profileRes = await fetch("/api/profile", { cache: "no-store" });
      let comptrollerId = null;
      if (profileRes.ok) {
        const contentType = profileRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const profileData = await profileRes.json();
          comptrollerId = profileData?.ok ? profileData.data?.id : null;
        }
      }
      
      // Fetch requests with comptroller_id filter if available
      // IMPORTANT: Show ALL requests with status="pending_comptroller" regardless of assignment
      // This allows any comptroller to see and process requests
      const url = `/api/requests/list?status=pending_comptroller${comptrollerId ? `&comptroller_id=${comptrollerId}` : ''}`;
      
      logger.debug("Fetching requests from:", url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        logger.error("API response not OK:", res.status, res.statusText);
        setRequests([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        logger.error("API returned non-JSON response. Content-Type:", contentType);
        setRequests([]);
        return;
      }
      const data = await res.json();
      
      logger.debug("Received data:", { isArray: Array.isArray(data), count: Array.isArray(data) ? data.length : 0 });
      
      if (Array.isArray(data)) {
        // Filter to only show requests that are actually pending comptroller review
        const pendingRequests = data.filter((req: any) => {
          const status = req.status;
          return status === "pending_comptroller";
        });
        logger.success(`Filtered to ${pendingRequests.length} pending requests`);
        setRequests(pendingRequests);
      } else {
        logger.error("Invalid response format:", data);
        setRequests([]);
      }
    } catch (err) {
      logger.error("Failed to load requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requests.filter(req => 
      req.request_number?.toLowerCase().includes(query) ||
      req.requester?.name?.toLowerCase().includes(query) ||
      req.department?.name?.toLowerCase().includes(query) ||
      req.purpose?.toLowerCase().includes(query)
    );
  }, [requests, searchQuery]);

  const handleReviewClick = (req: Request) => {
    setSelectedRequest(req);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRequest(null);
    // Only refresh if modal was actually showing (to avoid unnecessary refreshes)
    if (showModal) {
      loadRequests(); // Refresh list without page reload
    }
  };

  const logger = createLogger("ComptrollerInbox");

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageTitle title="Budget Review Queue • Comptroller" />
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            <div className="h-5 w-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
          <div className="h-20 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer bg-[length:200%_100%]" />
        </div>
        {/* Search Skeleton */}
        <div className="h-12 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
        {/* Request Cards Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Budget Review Queue • Comptroller" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Review Queue</h1>
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Requests pending comptroller approval
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{filteredRequests.length}</div>
            <div className="text-xs text-white/80">pending reviews</div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="🔍 Search by request number, requester, department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] shadow-sm text-sm"
        />
      </motion.div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Reviews</h3>
            <p className="text-gray-500">All budget requests have been reviewed!</p>
          </motion.div>
        ) : (
          filteredRequests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <RequestCardEnhanced
                request={{
                  id: req.id,
                  request_number: req.request_number || "—",
                  file_code: req.file_code,
                  title: req.title,
                  purpose: req.purpose || "No purpose indicated",
                  destination: req.destination,
                  travel_start_date: req.travel_start_date,
                  travel_end_date: req.travel_end_date,
                  status: req.status,
                  created_at: req.created_at,
                  total_budget: req.total_budget,
                  request_type: req.request_type,
                  requester_name: req.requester_name || req.requester?.name,
                  requester: {
                    name: req.requester_name || req.requester?.name || "Unknown",
                    email: req.requester?.email,
                    profile_picture: req.requester?.profile_picture,
                    department: req.department?.name || req.department?.code,
                    position: req.requester?.position_title,
                  },
                  department: req.department,
                }}
                showActions={true}
                onView={() => handleReviewClick(req)}
                className="border-blue-200 bg-blue-50/20"
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <ComptrollerReviewModal
          request={selectedRequest}
          onClose={handleModalClose}
        />
      )}
      </div>
    </>
  );
}
