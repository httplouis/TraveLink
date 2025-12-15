// src/app/(protected)/comptroller/inbox/page.tsx
"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Clock, User, Building2, MapPin, Calendar, FileText, CheckCircle, History, Loader2 } from "lucide-react";
import ComptrollerReviewModal from "@/components/comptroller/ComptrollerReviewModal";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import { motion } from "framer-motion";
import PageTitle from "@/components/common/PageTitle";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle } from "lucide-react";

type Request = {
  id: string;
  request_number: string;
  file_code?: string;
  title: string;
  purpose: string;
  destination?: string;
  total_budget: number;
  comptroller_edited_budget?: number;
  travel_start_date: string;
  travel_end_date?: string;
  created_at: string;
  admin_processed_at?: string;
  comptroller_approved_at?: string;
  status: string;
  request_type?: string;
  requester_name?: string;
  requester?: {
    name: string;
    email: string;
    position_title?: string;
    profile_picture?: string;
  };
  department?: {
    code: string;
    name: string;
  };
};

export default function ComptrollerInboxPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-[#7A0019]" /></div>}>
      <ComptrollerInboxContent />
    </Suspense>
  );
}

function ComptrollerInboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = React.useState<Request[]>([]);
  const [approvedRequests, setApprovedRequests] = React.useState<Request[]>([]);
  const [historyRequests, setHistoryRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [viewMode, setViewMode] = useViewMode("comptroller_inbox_view", "table");
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");

  const logger = createLogger("ComptrollerInbox");
  
  // Track if we've already handled the view parameter
  const viewParamHandledRef = React.useRef(false);

  // Set page title
  React.useEffect(() => {
    document.title = "TraviLink | Comptroller";
  }, []);
  
  // Handle ?view=requestId query parameter to auto-open a specific request
  React.useEffect(() => {
    const viewRequestId = searchParams?.get('view');
    
    // Only handle once per page load and if we have items loaded
    if (viewRequestId && !viewParamHandledRef.current && pendingRequests.length > 0) {
      viewParamHandledRef.current = true;
      
      // Find the request in pending items
      const requestToView = pendingRequests.find(r => r.id === viewRequestId);
      
      if (requestToView) {
        logger.info('Auto-opening request from URL:', viewRequestId);
        setSelectedRequest(requestToView);
        setShowModal(true);
        
        // Clear the view parameter from URL
        const newUrl = pathname || '/comptroller/inbox';
        router.replace(newUrl, { scroll: false });
      } else {
        // Request not in pending - try to fetch it directly
        logger.info('Request not in pending list, fetching directly:', viewRequestId);
        
        fetch(`/api/requests/${viewRequestId}`)
          .then(res => res.json())
          .then(data => {
            if (data.ok && data.data) {
              setSelectedRequest(data.data);
              setShowModal(true);
              const newUrl = pathname || '/comptroller/inbox';
              router.replace(newUrl, { scroll: false });
            }
          })
          .catch(err => {
            logger.error('Failed to fetch request:', err);
          });
      }
    }
  }, [searchParams, pendingRequests, pathname, router, logger]);

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?status=pending_comptroller", { cache: "no-store" });
      if (!res.ok) {
        setPendingRequests([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingRequests(data.filter((req: any) => req.status === "pending_comptroller"));
      }
    } catch (err) {
      logger.error("Failed to load pending requests:", err);
      setPendingRequests([]);
    }
  }, []);

  // Load approved requests (comptroller has approved, now at HR or later stages)
  const loadApproved = React.useCallback(async () => {
    try {
      // Get requests that comptroller has approved (have comptroller_approved_at)
      const res = await fetch("/api/requests/list?comptroller_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setApprovedRequests([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter to show requests that comptroller approved but are not yet final
        const approved = data.filter((req: any) => 
          req.comptroller_approved_at && 
          !["approved", "rejected", "cancelled"].includes(req.status)
        );
        setApprovedRequests(approved);
      }
    } catch (err) {
      logger.error("Failed to load approved requests:", err);
      setApprovedRequests([]);
    }
  }, []);

  // Load history (final states)
  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?comptroller_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setHistoryRequests([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter to show only final states
        const history = data.filter((req: any) => 
          req.comptroller_approved_at && 
          ["approved", "rejected", "cancelled"].includes(req.status)
        );
        setHistoryRequests(history);
      }
    } catch (err) {
      logger.error("Failed to load history:", err);
      setHistoryRequests([]);
    }
  }, []);

  React.useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadPending(), loadApproved(), loadHistory()]);
      setLoading(false);
    };
    loadAll();
    
    // Real-time updates using Supabase Realtime
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("comptroller-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          if (mutateTimeout) clearTimeout(mutateTimeout);
          mutateTimeout = setTimeout(() => {
            if (activeTab === "pending") loadPending();
            else if (activeTab === "approved") loadApproved();
            else loadHistory();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, [loadPending, loadApproved, loadHistory, activeTab]);

  // Get current items based on active tab
  const currentItems = activeTab === "pending" ? pendingRequests : activeTab === "approved" ? approvedRequests : historyRequests;

  const filteredRequests = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return currentItems.filter(req => 
      req.request_number?.toLowerCase().includes(query) ||
      req.requester?.name?.toLowerCase().includes(query) ||
      req.department?.name?.toLowerCase().includes(query) ||
      req.purpose?.toLowerCase().includes(query)
    );
  }, [currentItems, searchQuery]);

  const handleReviewClick = (req: Request) => {
    setSelectedRequest(req);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRequest(null);
    // Refresh all lists
    loadPending();
    loadApproved();
    loadHistory();
  };

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
          {activeTab === "pending" && shouldShowPendingAlert(pendingRequests.length) && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              getAlertSeverity(pendingRequests.length) === 'danger'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : getAlertSeverity(pendingRequests.length) === 'warning'
                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <span>{getAlertMessage(pendingRequests.length, 'comptroller')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <div className={`px-6 py-3 rounded-xl shadow-lg text-white ${
            activeTab === "pending" && shouldShowPendingAlert(pendingRequests.length)
              ? getAlertSeverity(pendingRequests.length) === 'danger'
                ? 'bg-gradient-to-br from-red-600 to-red-700'
                : getAlertSeverity(pendingRequests.length) === 'warning'
                ? 'bg-gradient-to-br from-orange-600 to-orange-700'
                : 'bg-gradient-to-br from-amber-600 to-amber-700'
              : 'bg-gradient-to-br from-[#7A0010] to-[#9c2a3a]'
          }`}>
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
            <div className="text-xs text-white/80">pending reviews</div>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-[#7A0010] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === "approved"
              ? "bg-[#7A0010] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          Approved ({approvedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-[#7A0010] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <History className="h-4 w-4" />
          History ({historyRequests.length})
        </button>
      </div>

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
      {viewMode === "table" ? (
        <RequestsTable
          requests={filteredRequests.map(req => ({
            ...req,
            requester: {
              name: req.requester_name || req.requester?.name || "Unknown",
              email: req.requester?.email,
              position: req.requester?.position_title,
              profile_picture: req.requester?.profile_picture,
            },
          }))}
          onView={handleReviewClick}
          showBudget={true}
          showDepartment={true}
          emptyMessage="All budget requests have been reviewed!"
        />
      ) : (
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
                    admin_processed_at: req.admin_processed_at,
                    comptroller_approved_at: req.comptroller_approved_at,
                    total_budget: req.total_budget,
                    request_type: req.request_type as "travel_order" | "seminar" | undefined,
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
      )}

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
