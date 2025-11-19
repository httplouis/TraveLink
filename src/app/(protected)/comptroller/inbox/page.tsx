// src/app/(protected)/comptroller/inbox/page.tsx
"use client";

import React from "react";
import { Search, Clock, User, Building2, MapPin, Calendar, DollarSign, FileText } from "lucide-react";
import ComptrollerReviewModal from "@/components/comptroller/ComptrollerReviewModal";
import { motion } from "framer-motion";
import PageTitle from "@/components/common/PageTitle";
import { createSupabaseClient } from "@/lib/supabase/client";

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
    document.title = "Comptroller Inbox - Travelink";
  }, []);

  React.useEffect(() => {
    // Only load once on mount - no auto-reload
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Get current user's ID for filtering
      const profileRes = await fetch("/api/profile", { cache: "no-store" });
      const profileData = await profileRes.json();
      const comptrollerId = profileData?.ok ? profileData.data?.id : null;
      
      // Fetch requests with comptroller_id filter if available
      // IMPORTANT: Show ALL requests with status="pending_comptroller" regardless of assignment
      // This allows any comptroller to see and process requests
      const url = `/api/requests/list?status=pending_comptroller${comptrollerId ? `&comptroller_id=${comptrollerId}` : ''}`;
      
      console.log("[Comptroller Inbox] Fetching requests from:", url);
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      
      console.log("[Comptroller Inbox] Received data:", Array.isArray(data) ? `${data.length} requests` : "Not an array", data);
      
      if (Array.isArray(data)) {
        // Filter to only show requests that are actually pending comptroller review
        const pendingRequests = data.filter((req: any) => {
          const status = req.status;
          return status === "pending_comptroller";
        });
        console.log("[Comptroller Inbox] Filtered to", pendingRequests.length, "pending requests");
        setRequests(pendingRequests);
      } else {
        console.error("[Comptroller Inbox] Invalid response format:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error("[Comptroller Inbox] Failed to load requests:", err);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200"
              onClick={() => handleReviewClick(req)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">{req.request_number}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                            Pending Budget Review
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Requester</div>
                          <div className="text-sm font-semibold text-gray-900">{req.requester_name || req.requester?.name || "—"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Department</div>
                          <div className="text-sm font-semibold text-gray-900">{req.department?.code || "—"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Purpose</div>
                        <div className="text-sm text-gray-700 line-clamp-2">{req.purpose}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Budget & Action */}
                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 justify-end">
                        <DollarSign className="h-3 w-3" />
                        Requested Budget
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] bg-clip-text text-transparent">
                        ₱{req.total_budget?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReviewClick(req);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Review Budget
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Travel: {new Date(req.travel_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-[#7A0010] font-semibold">Click to review →</div>
                </div>
              </div>
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
