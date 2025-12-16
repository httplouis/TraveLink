"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import VPRequestModal from "@/components/vp/VPRequestModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import AdvancedFilters, { FilterState, defaultFilters, applyFilters } from "@/components/common/AdvancedFilters";
import { Eye, Search, FileText, Clock, CheckCircle, History } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle } from "lucide-react";

export default function VPInboxContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [approvedItems, setApprovedItems] = React.useState<any[]>([]);
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useViewMode("vp_inbox_view", "cards");
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");
  
  const logger = createLogger("VPInbox");
  
  // Track if we've already handled the view parameter
  const viewParamHandledRef = React.useRef(false);

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      logger.info("Loading pending VP requests...");
      const res = await fetch("/api/vp/inbox", { cache: "no-store" });
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
        logger.success(`Loaded ${json.data?.length || 0} pending VP requests`);
      } else {
        logger.warn("Failed to load VP requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading pending VP requests:", error);
    }
  }, []);

  // Load approved requests (VP has approved, now at later stages)
  const loadApproved = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?vp_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setApprovedItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const approved = data.filter((req: any) => 
          req.vp_approved_at && 
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
      const res = await fetch("/api/requests/list?vp_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setHistoryItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const history = data.filter((req: any) => 
          req.vp_approved_at && 
          ["approved", "rejected", "cancelled"].includes(req.status)
        );
        setHistoryItems(history);
      }
    } catch (err) {
      logger.error("Failed to load history:", err);
      setHistoryItems([]);
    }
  }, []);

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
          logger.info('Auto-opening request from URL:', viewRequestId);
          setSelected(requestToView);
          
          // Clear the view parameter from URL
          const newUrl = pathname || '/vp/inbox';
          router.replace(newUrl, { scroll: false });
        } else {
          // Request not in any list - try to fetch it directly
          logger.info('Request not in any list, fetching directly:', viewRequestId);
          
          fetch(`/api/requests/${viewRequestId}`)
            .then(res => res.json())
            .then(data => {
              if (data.ok && data.data) {
                setSelected(data.data);
                const newUrl = pathname || '/vp/inbox';
                router.replace(newUrl, { scroll: false });
              }
            })
            .catch(err => {
              logger.error('Failed to fetch request:', err);
            });
        }
      }
    }
  }, [searchParams, pendingItems, approvedItems, historyItems, loading, pathname, router, logger]);

  React.useEffect(() => {
    let isMounted = true;
    let mutateTimeout: NodeJS.Timeout | null = null;
    let channel: any = null;
    
    // Initial load
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadPending(), loadApproved(), loadHistory()]);
      setLoading(false);
    };
    loadAll();
    
    // Set up real-time subscription
    const supabase = createSupabaseClient();
    
    channel = supabase
      .channel("vp-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          if (!isMounted) return;
          
          if (mutateTimeout) clearTimeout(mutateTimeout);
          mutateTimeout = setTimeout(() => {
            if (isMounted) {
              if (activeTab === "pending") loadPending();
              else if (activeTab === "approved") loadApproved();
              else loadHistory();
            }
          }, 500);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (mutateTimeout) clearTimeout(mutateTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeTab, loadPending, loadApproved, loadHistory]);

  // Get current items based on active tab
  const items = activeTab === "pending" ? pendingItems : activeTab === "approved" ? approvedItems : historyItems;

  const handleApproved = (id: string) => {
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => {
      loadPending();
      loadApproved();
      loadHistory();
    }, 500);
  };

  const handleRejected = (id: string) => {
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => {
      loadPending();
      loadApproved();
      loadHistory();
    }, 500);
  };

  // Extract unique departments for filter
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    items.forEach(item => {
      const deptName = item.department?.name || item.department?.code;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts).sort();
  }, [items]);

  // Apply filters
  const filteredItems = React.useMemo(() => {
    return applyFilters(items, filters);
  }, [items, filters]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            <div className="h-5 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
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
    <div className="space-y-4">
      {/* Pending Alert */}
      {activeTab === "pending" && shouldShowPendingAlert(pendingItems.length) && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
          getAlertSeverity(pendingItems.length) === 'danger'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : getAlertSeverity(pendingItems.length) === 'warning'
            ? 'bg-orange-50 border border-orange-200 text-orange-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <span>{getAlertMessage(pendingItems.length, 'vp')}</span>
        </div>
      )}

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
      
      {/* Advanced Filters + View Toggle */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            placeholder="Search by request number, requester, purpose, destination..."
          />
        </div>
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>
      {filteredItems.length !== items.length && (
        <p className="text-sm text-gray-500">
          Showing {filteredItems.length} of {items.length} requests
        </p>
      )}

      {/* Request List */}
      {viewMode === "table" ? (
        <RequestsTable
          requests={filteredItems.map(item => ({
            ...item,
            requester: {
              name: item.requester_name || item.requester?.name || "Unknown",
              email: item.requester?.email,
              position: item.requester?.position_title,
              profile_picture: item.requester?.profile_picture,
            },
          }))}
          onView={setSelected}
          showBudget={true}
          showDepartment={true}
          emptyMessage={filters.searchQuery || filters.department !== 'all' ? "No matching requests" : "No pending requests"}
        />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filters.searchQuery || filters.department !== 'all' ? "No matching requests" : "No pending requests"}
          </h3>
          <p className="text-gray-500">
            {filters.searchQuery || filters.department !== 'all' ? "Try adjusting your search or filter criteria." : "Requests awaiting VP approval will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
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
                  hr_approved_at: item.hr_approved_at,
                  vp_approved_at: item.vp_approved_at,
                  vp2_approved_at: item.vp2_approved_at,
                  total_budget: item.total_budget,
                  comptroller_edited_budget: item.comptroller_edited_budget,
                    request_type: item.request_type,
                    requester_name: item.requester_name || item.requester?.name,
                    requester: {
                      name: item.requester_name || item.requester?.name || "Unknown",
                      email: item.requester?.email,
                      profile_picture: item.requester?.profile_picture,
                      department: item.department?.name,
                      position: item.requester?.position_title,
                    },
                    department: item.department,
                  }}
                  showActions={true}
                  onView={() => setSelected(item)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {selected && (
        <VPRequestModal
          request={selected}
          onClose={() => {
            setSelected(null);
            loadPending(); // Refresh list when modal closes
          }}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}

