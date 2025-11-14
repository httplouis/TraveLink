"use client";

import * as React from "react";
import { Inbox, Search, FileText, Calendar, MapPin, CheckCircle, History, Clock } from "lucide-react";
import UserRequestModal from "@/components/user/UserRequestModal";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";

type Request = {
  id: string;
  request_number?: string;
  purpose?: string;
  destination?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  requester_signature?: string;
  is_representative?: boolean;
  submitted_by_name?: string;
  expense_breakdown?: any[];
  total_budget?: number;
  created_at?: string;
};

export default function UserInboxPage() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [historyRequests, setHistoryRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");
  const toast = useToast();

  React.useEffect(() => {
    document.title = "My Inbox - TraviLink";
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    
    // Initial load
    loadRequests();
    
    // Set up real-time subscription instead of polling
    const supabase = createSupabaseClient();
    console.log("[UserInbox] Setting up real-time subscription...");
    
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    // Get current user profile for matching
    let currentUserId: string | null = null;
    let currentUserName: string | null = null;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("users")
          .select("id, name")
          .eq("auth_user_id", user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              currentUserId = profile.id;
              currentUserName = profile.name;
            }
          });
      }
    });
    
    const channel = supabase
      .channel("user-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          if (!isMounted || showModal) return; // Don't update if modal is open
          
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          const newRequesterId = payload.new?.requester_id;
          const newRequesterName = payload.new?.requester_name;
          const isRepresentative = payload.new?.is_representative;
          
          // Check if this request is for the current user
          const isForCurrentUser = 
            (newRequesterId && currentUserId && newRequesterId === currentUserId) ||
            (newRequesterName && currentUserName && 
             newRequesterName.toLowerCase().includes(currentUserName.toLowerCase()));
          
          // Only react to changes that affect user inbox
          // For INSERT events with pending_requester_signature, always refresh
          // For UPDATE events, check if it's for current user
          const shouldRefresh = 
            payload.eventType === "INSERT" && 
            newStatus === "pending_requester_signature" && 
            isRepresentative;
          
          const shouldRefreshUpdate = 
            payload.eventType === "UPDATE" &&
            (newStatus === "pending_requester_signature" || oldStatus === "pending_requester_signature") &&
            isRepresentative &&
            isForCurrentUser;
          
          if (shouldRefresh || shouldRefreshUpdate) {
            console.log("[UserInbox] 🔄 Real-time change detected:", {
              eventType: payload.eventType,
              status: newStatus,
              requester_id: newRequesterId,
              requester_name: newRequesterName,
              is_representative: isRepresentative,
              current_user_id: currentUserId,
              current_user_name: currentUserName
            });
            
            // Debounce: only trigger refetch after 500ms
            if (mutateTimeout) clearTimeout(mutateTimeout);
            mutateTimeout = setTimeout(() => {
              if (isMounted && !showModal) {
                console.log("[UserInbox] ⚡ Refreshing inbox");
                loadRequests();
              }
            }, 500);
          }
        }
      )
      .subscribe((status: string) => {
        console.log("[UserInbox] Subscription status:", status);
      });

    // Cleanup
    return () => {
      isMounted = false;
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, [showModal]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/inbox", { cache: "no-store" });
      const data = await res.json();
      
      if (data.ok && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        console.error("Failed to load requests:", data);
        toast({
          kind: "error",
          title: "Load failed",
          message: data.error || "Could not load requests.",
        });
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
      toast({
        kind: "error",
        title: "Load failed",
        message: "Could not load requests.",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleReviewClick = (req: Request) => {
    setSelectedRequest(req);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRequest(null);
    loadRequests(); // Refresh list
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/user/inbox/history", { cache: "no-store" });
      const data = await res.json();
      
      if (data.ok && Array.isArray(data.data)) {
        setHistoryRequests(data.data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSigned = () => {
    loadRequests(); // Refresh list after signing
    if (activeTab === "history") {
      loadHistory(); // Also refresh history
    }
  };

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-PH", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  }

  // Load history when switching to history tab and set up real-time
  React.useEffect(() => {
    if (activeTab === "history") {
      if (historyRequests.length === 0) {
        loadHistory();
      }
      
      // Set up real-time subscription for history
      let isMounted = true;
      const supabase = createSupabaseClient();
      let mutateTimeout: NodeJS.Timeout | null = null;
      
      const channel = supabase
        .channel("user-inbox-history-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "requests",
          },
          (payload: any) => {
            if (!isMounted || activeTab !== "history") return;
            
            // If requester_signature was just added, refresh history
            if (payload.new?.requester_signature && !payload.old?.requester_signature) {
              console.log("[UserInbox History] 🔄 New signature detected, refreshing history");
              if (mutateTimeout) clearTimeout(mutateTimeout);
              mutateTimeout = setTimeout(() => {
                if (isMounted && activeTab === "history") {
                  loadHistory();
                }
              }, 500);
            }
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        if (mutateTimeout) clearTimeout(mutateTimeout);
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab]);

  const displayRequests = activeTab === "pending" ? requests : historyRequests;
  const isLoading = activeTab === "pending" ? loading : historyLoading;

  if (isLoading) {
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="h-6 w-6 text-[#7A0010]" />
              My Inbox
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === "pending" 
                ? "Requests pending your signature"
                : "Signed requests history"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`
              px-4 py-2 font-medium text-sm transition-colors border-b-2
              ${activeTab === "pending"
                ? "border-[#7A0010] text-[#7A0010]"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Pending ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`
              px-4 py-2 font-medium text-sm transition-colors border-b-2
              ${activeTab === "history"
                ? "border-[#7A0010] text-[#7A0010]"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <History className="h-4 w-4 inline mr-2" />
            History ({historyRequests.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by request number, purpose, or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#7A0010] focus:outline-none"
          />
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {displayRequests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchQuery 
                  ? "No requests match your search" 
                  : activeTab === "pending"
                    ? "No pending requests"
                    : "No signed requests yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery 
                  ? "Try a different search term" 
                  : activeTab === "pending"
                    ? "Requests submitted on your behalf will appear here"
                    : "Requests you've signed will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayRequests
                .filter(req => {
                  const query = searchQuery.toLowerCase();
                  return req.request_number?.toLowerCase().includes(query) ||
                         req.purpose?.toLowerCase().includes(query) ||
                         req.destination?.toLowerCase().includes(query) ||
                         req.submitted_by_name?.toLowerCase().includes(query);
                })
                .map((req) => (
                <div
                  key={req.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleReviewClick(req)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {req.request_number || `Request ${req.id.slice(0, 8)}`}
                          </span>
                        </div>
                        {req.is_representative && req.submitted_by_name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Submitted by {req.submitted_by_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {req.purpose || "No purpose specified"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{req.destination || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(req.travel_start_date)} - {formatDate(req.travel_end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {activeTab === "pending" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(req);
                          }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white text-sm font-semibold hover:shadow-md transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Review & Sign
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500">
                          {req.requester_signature && (
                            <div className="text-green-600 font-medium">✓ Signed</div>
                          )}
                          <div className="mt-1">
                            {req.requester_signed_at 
                              ? new Date(req.requester_signed_at).toLocaleDateString()
                              : "—"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <UserRequestModal
          request={selectedRequest}
          onClose={handleModalClose}
          onSigned={handleSigned}
        />
      )}
    </>
  );
}

