"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Inbox, Search, FileText, Calendar, MapPin, CheckCircle, History, Clock } from "lucide-react";
import UserRequestModal from "@/components/user/UserRequestModal";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";

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

function UserInboxPageContent() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [historyRequests, setHistoryRequests] = React.useState<Request[]>([]);
  const [historyCount, setHistoryCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");
  const toast = useToast();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    document.title = "My Inbox - Travelink";
  }, []);

  // Fetch history count on mount
  React.useEffect(() => {
    const fetchHistoryCount = async () => {
      try {
        const res = await fetch("/api/user/inbox/history/count", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setHistoryCount(data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch history count:", err);
      }
    };

    fetchHistoryCount();
  }, []);

  // Handle view parameter from notification click - FAST loading
  React.useEffect(() => {
    const viewId = searchParams?.get('view');
    if (viewId && !showModal) {
      // If requests are already loaded, open immediately
      if (requests.length > 0) {
        const requestToView = requests.find(r => r.id === viewId);
        if (requestToView) {
          setSelectedRequest(requestToView);
          setShowModal(true);
          // Clean up URL immediately
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/user/inbox');
          }
        }
      } 
      // If requests are still loading, wait for them
      else if (!loading) {
        // Requests finished loading but not found - might need to fetch specific request
        const fetchSpecificRequest = async () => {
          try {
            const res = await fetch(`/api/user/inbox?limit=100`, { cache: "no-store" });
            const data = await res.json();
            if (data.ok && data.data) {
              const requestToView = data.data.find((r: Request) => r.id === viewId);
              if (requestToView) {
                setSelectedRequest(requestToView);
                setShowModal(true);
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, '', '/user/inbox');
                }
              }
            }
          } catch (err) {
            console.error('[UserInbox] Failed to fetch specific request:', err);
          }
        };
        fetchSpecificRequest();
      }
    }
  }, [requests, searchParams, showModal, loading]);

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
        setHistoryCount(data.data.length); // Update count when history is loaded
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSigned = () => {
    loadRequests(); // Refresh list after signing
    
    // Refresh history count
    fetch("/api/user/inbox/history/count", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setHistoryCount(data.count || 0);
        }
      })
      .catch(err => console.error("Failed to refresh history count:", err));
    
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
                if (isMounted) {
                  // Refresh history count
                  fetch("/api/user/inbox/history/count", { cache: "no-store" })
                    .then(res => res.json())
                    .then(data => {
                      if (data.ok && isMounted) {
                        setHistoryCount(data.count || 0);
                      }
                    })
                    .catch(err => console.error("Failed to refresh history count:", err));
                  
                  if (activeTab === "history") {
                    loadHistory();
                  }
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

  const logger = createLogger("UserInbox");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            <div className="h-5 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b border-gray-200">
          <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-t animate-shimmer bg-[length:200%_100%]" />
          <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-t animate-shimmer bg-[length:200%_100%]" />
        </div>
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
            History ({historyCount})
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
        {displayRequests.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm text-center py-12">
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
          <div className="space-y-4">
            {displayRequests
              .filter(req => {
                const query = searchQuery.toLowerCase();
                return req.request_number?.toLowerCase().includes(query) ||
                       req.purpose?.toLowerCase().includes(query) ||
                       req.destination?.toLowerCase().includes(query) ||
                       req.submitted_by_name?.toLowerCase().includes(query);
              })
              .map((req) => (
                <RequestCardEnhanced
                  key={req.id}
                  request={{
                    id: req.id,
                    request_number: req.request_number || `Request ${req.id.slice(0, 8)}`,
                    file_code: (req as any).file_code,
                    title: (req as any).title,
                    purpose: req.purpose || "No purpose specified",
                    destination: req.destination,
                    travel_start_date: req.travel_start_date,
                    travel_end_date: req.travel_end_date,
                    status: req.status,
                    created_at: req.created_at,
                    total_budget: (req as any).total_budget,
                    request_type: (req as any).request_type,
                    requester_name: (req as any).requester_name,
                    requester: {
                      name: (req as any).requester_name || "Unknown",
                      email: (req as any).requester?.email,
                      profile_picture: (req as any).requester?.profile_picture,
                      department: (req as any).department?.name,
                      position: (req as any).requester?.position_title,
                    },
                    department: (req as any).department,
                    submitted_by_name: req.submitted_by_name,
                    is_representative: req.is_representative,
                    requester_signed_at: (req as any).requester_signed_at,
                    requester_signature: (req as any).requester_signature,
                  }}
                  showActions={true}
                  onView={() => handleReviewClick(req)}
                  onApprove={activeTab === "pending" ? () => handleReviewClick(req) : undefined}
                />
              ))}
          </div>
        )}
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

export default function UserInboxPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <UserInboxPageContent />
    </Suspense>
  );
}

