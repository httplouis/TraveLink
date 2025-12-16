"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ExecRequestModal from "@/components/exec/ExecRequestModal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import AdvancedFilters, { FilterState, defaultFilters, applyFilters } from "@/components/common/AdvancedFilters";
import { Eye, Search, FileText, Clock, CheckCircle, History } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";

export default function ExecInboxContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [approvedItems, setApprovedItems] = React.useState<any[]>([]);
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>(defaultFilters);
  const [viewMode, setViewMode] = useViewMode("exec_inbox_view", "cards");
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");

  const logger = createLogger("ExecInbox");
  
  // Track if we've already handled the view parameter
  const viewParamHandledRef = React.useRef(false);

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      const res = await fetch("/api/exec/inbox", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setPendingItems(json.data ?? []);
      }
    } catch (error) {
      logger.error("Error loading pending exec requests:", error);
    }
  }, []);

  // Load approved requests (Exec has approved, now at later stages)
  const loadApproved = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?exec_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setApprovedItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const approved = data.filter((req: any) => 
          req.exec_approved_at && 
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
      const res = await fetch("/api/requests/list?exec_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setHistoryItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const history = data.filter((req: any) => 
          req.exec_approved_at && 
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
          const newUrl = pathname || '/exec/inbox';
          router.replace(newUrl, { scroll: false });
        } else {
          // Request not in any list - try to fetch it directly
          logger.info('Request not in any list, fetching directly:', viewRequestId);
          
          fetch(`/api/requests/${viewRequestId}`)
            .then(res => res.json())
            .then(data => {
              if (data.ok && data.data) {
                setSelected(data.data);
                const newUrl = pathname || '/exec/inbox';
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
      .channel("exec-inbox-changes")
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

    // Cleanup
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            {filters.searchQuery || filters.department !== 'all'
              ? "Try adjusting your search or filter criteria."
              : "Requests approved by HR will appear here for final executive approval"}
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
                    total_budget: item.total_budget,
                    request_type: item.request_type,
                    requester_name: item.requester_name || item.requester?.name,
                    requester: {
                      name: item.requester_name || item.requester?.name || "Unknown",
                      email: item.requester?.email,
                      profile_picture: item.requester?.profile_picture,
                      department: item.department?.name || item.department?.code,
                      position: item.requester?.position_title,
                    },
                    department: item.department,
                    submitted_by_name: item.submitted_by_name || item.submitted_by?.name,
                    is_representative: item.is_representative,
                  }}
                  showActions={true}
                  onView={() => setSelected(item)}
                  onTrack={() => {
                    setTrackingRequest(item);
                    setShowTrackingModal(true);
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {selected && (
        <ExecRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}

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
    </div>
  );
}
