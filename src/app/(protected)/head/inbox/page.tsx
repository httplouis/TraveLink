// src/app/(protected)/head/inbox/page.tsx
"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import HeadRequestModal from "@/components/head/HeadRequestModal";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import AdvancedFilters, { FilterState, defaultFilters, applyFilters } from "@/components/common/AdvancedFilters";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle, Clock, CheckCircle, History, Loader2 } from "lucide-react";

// Format time ago helper
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function HeadInboxPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-[#7A0019]" /></div>}>
      <HeadInboxContent />
    </Suspense>
  );
}

function HeadInboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [approvedItems, setApprovedItems] = React.useState<any[]>([]);
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");
  
  // Track if we've already handled the view parameter
  const viewParamHandledRef = React.useRef(false);
  
  // View mode toggle
  const [viewMode, setViewMode] = useViewMode("head_inbox_view", "cards");
  
  // Smart filters using AdvancedFilters component
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  
  // Track viewed requests (mark as read)
  const [viewedRequests, setViewedRequests] = React.useState<Set<string>>(new Set());
  
  // Load viewed requests from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('head_viewed_requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setViewedRequests(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse viewed requests', e);
      }
    }
  }, []);
  
  // Mark request as viewed when opened
  const markAsViewed = (requestId: string) => {
    const newViewed = new Set(viewedRequests);
    newViewed.add(requestId);
    setViewedRequests(newViewed);
    localStorage.setItem('head_viewed_requests', JSON.stringify(Array.from(newViewed)));
  };
  
  const logger = createLogger("HeadInbox");

  // Get current items based on active tab (defined early for use in useMemo)
  const items = activeTab === "pending" ? pendingItems : activeTab === "approved" ? approvedItems : historyItems;

  // Extract unique departments for filter
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    items.forEach(item => {
      const deptName = item.department?.name || item.department?.code;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts).sort();
  }, [items]);
  
  // Apply filters to items
  const filteredItems = React.useMemo(() => {
    return applyFilters(items, filters, {
      searchFields: ['request_number', 'purpose', 'destination'],
      dateField: 'travel_start_date',
    });
  }, [items, filters]);

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      logger.info("Loading pending head requests...");
      const res = await fetch("/api/head", { cache: "no-store" });
      if (!res.ok) {
        logger.error("API response not OK:", { status: res.status, statusText: res.statusText });
        setPendingItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        logger.error("API returned non-JSON response. Content-Type:", contentType);
        setPendingItems([]);
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setPendingItems(json.data ?? []);
        setLastUpdate(new Date());
        logger.success(`Loaded ${json.data?.length || 0} pending requests`);
      } else {
        logger.warn("Failed to load requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading pending requests:", error);
    }
  }, []);

  // Load approved requests (head has approved, now at later stages)
  const loadApproved = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?head_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setApprovedItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const approved = data.filter((req: any) => 
          req.head_approved_at && 
          !["approved", "rejected", "cancelled"].includes(req.status)
        );
        setApprovedItems(approved);
      }
    } catch (err) {
      logger.error("Failed to load approved requests:", err);
      setApprovedItems([]);
    }
  }, []);

  // Load history (final states)
  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?head_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setHistoryItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const history = data.filter((req: any) => 
          req.head_approved_at && 
          ["approved", "rejected", "cancelled"].includes(req.status)
        );
        setHistoryItems(history);
      }
    } catch (err) {
      logger.error("Failed to load history:", err);
      setHistoryItems([]);
    }
  }, []);

  // Initial load
  React.useEffect(() => { 
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadPending(), loadApproved(), loadHistory()]);
      setLoading(false);
    };
    loadAll();
  }, [loadPending, loadApproved, loadHistory]);

  // Handle ?view=requestId query parameter to auto-open a specific request
  React.useEffect(() => {
    const viewRequestId = searchParams?.get('view');
    const allItems = [...pendingItems, ...approvedItems, ...historyItems];
    
    // Only handle once per page load
    if (viewRequestId && !viewParamHandledRef.current) {
      // Check if we have any items loaded, or wait a bit for them to load
      if (allItems.length > 0 || !loading) {
        viewParamHandledRef.current = true;
        
        // Find the request in any of the lists
        const requestToView = allItems.find(r => r.id === viewRequestId);
        
        if (requestToView) {
          console.log('[HeadInbox] Auto-opening request from URL:', viewRequestId);
          setSelected(requestToView);
          markAsViewed(requestToView.id);
          
          // Clear the view parameter from URL
          const newUrl = pathname || '/head/inbox';
          router.replace(newUrl, { scroll: false });
        } else {
          // Request not in list - fetch it directly
          console.log('[HeadInbox] Request not in list, fetching directly:', viewRequestId);
          
          fetch(`/api/requests/${viewRequestId}`)
            .then(res => res.json())
            .then(data => {
              if (data.ok && data.data) {
                setSelected(data.data);
                markAsViewed(data.data.id);
                
                // Clear the view parameter from URL
                const newUrl = pathname || '/head/inbox';
                router.replace(newUrl, { scroll: false });
              }
            })
            .catch(err => {
              console.error('[HeadInbox] Failed to fetch request:', err);
            });
        }
      }
    }
  }, [searchParams, pendingItems, approvedItems, historyItems, loading, pathname, router]);

  // Real-time updates using Supabase Realtime
  React.useEffect(() => {
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    let channel: any = null;
    
    channel = supabase
      .channel("head-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          // Debounce: only trigger refetch after 500ms
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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeTab, loadPending, loadApproved, loadHistory]);

  function handleApproved(id: string) {
    // Optimistically remove from UI first
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    
    // Reload all lists to ensure fresh data
    setTimeout(() => {
      loadPending();
      loadApproved();
      loadHistory();
    }, 500);
  }

  function handleRejected(id: string) {
    // Optimistically remove from UI first
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    
    // Reload all lists to ensure fresh data
    setTimeout(() => {
      loadPending();
      loadApproved();
      loadHistory();
    }, 500);
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#7A0010]">
              Requests for Endorsement
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? 'request' : 'requests'} pending your review
            </p>
            {shouldShowPendingAlert(items.length) && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                getAlertSeverity(items.length) === 'danger'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : getAlertSeverity(items.length) === 'warning'
                  ? 'bg-orange-50 border border-orange-200 text-orange-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <span>{getAlertMessage(items.length, 'head')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={viewMode} onChange={setViewMode} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-medium" suppressHydrationWarning>
                Auto-refresh • {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-[#7A0010] text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending ({pendingItems.length})
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
          Approved ({approvedItems.length})
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
          History ({historyItems.length})
        </button>
      </div>

      {/* Smart Filters */}
      <div className="mb-6">
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          departments={departments}
          showRequestType={true}
          placeholder="Search by requester, department, purpose, or request number..."
        />
        {filteredItems.length !== items.length && (
          <div className="mt-2 text-sm text-slate-500">
            Showing {filteredItems.length} of {items.length} requests
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <RequestsTable
          requests={filteredItems.map(item => ({
            ...item,
            requester: {
              name: item.requester?.name || item.requester_name || "Unknown",
              email: item.requester?.email,
              position: item.requester?.position_title,
              profile_picture: item.requester?.profile_picture || item.requester?.avatar_url,
            },
          }))}
          onView={(item) => {
            setSelected(item);
            markAsViewed(item.id);
          }}
          showBudget={true}
          showDepartment={true}
          emptyMessage={items.length === 0 ? "No requests pending" : "No matching requests"}
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {items.length === 0 ? "No requests pending" : "No matching requests"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {items.length === 0 
              ? "When faculty submit requests, they will appear here for your approval."
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {items.length > 0 && (
            <button
              onClick={() => setFilters(defaultFilters)}
              className="mt-3 text-[#7A0010] hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            // Check if request is new (within last 24 hours AND not viewed yet)
            const createdAt = item.created_at ? new Date(item.created_at) : null;
            const now = new Date();
            const hoursSinceCreation = createdAt ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 999;
            const isNew = hoursSinceCreation < 24 && !viewedRequests.has(item.id);
            
            return (
              <RequestCardEnhanced
                key={item.id}
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
                  head_approved_at: item.head_approved_at,
                  admin_processed_at: item.admin_processed_at,
                  total_budget: item.total_budget,
                  comptroller_edited_budget: (item as any).comptroller_edited_budget,
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
                onView={() => {
                  setSelected(item);
                  markAsViewed(item.id);
                }}
                className={
                  isNew && !viewedRequests.has(item.id)
                    ? "border-green-300 bg-green-50/30"
                    : ""
                }
              />
            );
          })}
        </div>
      )}

      {selected && (
        <HeadRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
          viewOnly={false}
        />
      )}
    </div>
  );
}
