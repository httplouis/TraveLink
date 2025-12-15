"use client";

import React from "react";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import HRRequestModal from "@/components/hr/HRRequestModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import { Eye, Clock, CheckCircle, History } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle } from "lucide-react";

export default function HRInboxContainer() {
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [approvedItems, setApprovedItems] = React.useState<any[]>([]);
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = useViewMode("hr_inbox_view", "cards");
  const [activeTab, setActiveTab] = React.useState<"pending" | "approved" | "history">("pending");

  const logger = createLogger("HRInbox");

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      logger.info("Loading pending HR requests...");
      const res = await fetch("/api/hr/inbox", { cache: "no-store" });
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
        logger.success(`Loaded ${json.data?.length || 0} pending HR requests`);
      } else {
        logger.warn("Failed to load HR requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading pending HR requests:", error);
    }
  }, []);

  // Load approved requests (HR has approved, now at later stages)
  const loadApproved = React.useCallback(async () => {
    try {
      const res = await fetch("/api/requests/list?hr_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setApprovedItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const approved = data.filter((req: any) => 
          req.hr_approved_at && 
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
      const res = await fetch("/api/requests/list?hr_approved=true", { cache: "no-store" });
      if (!res.ok) {
        setHistoryItems([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const history = data.filter((req: any) => 
          req.hr_approved_at && 
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

  // Real-time updates using Supabase Realtime
  React.useEffect(() => {
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("hr-inbox-changes")
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
  }, [activeTab, loadPending, loadApproved, loadHistory]);

  // Get current items based on active tab
  const items = activeTab === "pending" ? pendingItems : activeTab === "approved" ? approvedItems : historyItems;

  function handleApproved(id: string) {
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => {
      loadPending();
      loadApproved();
      loadHistory();
    }, 500);
  }

  function handleRejected(id: string) {
    setPendingItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
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
              HR Approval Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {pendingItems.length} {pendingItems.length === 1 ? 'request' : 'requests'} awaiting HR review
            </p>
            {activeTab === "pending" && shouldShowPendingAlert(pendingItems.length) && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                getAlertSeverity(pendingItems.length) === 'danger'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : getAlertSeverity(pendingItems.length) === 'warning'
                  ? 'bg-orange-50 border border-orange-200 text-orange-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <span>{getAlertMessage(pendingItems.length, 'hr')}</span>
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <RequestsTable
          requests={items.map(item => ({
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
          emptyMessage="No requests pending HR review"
        />
      ) : items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No requests pending
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Requests approved by Comptroller will appear here for HR review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
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
                  comptroller_approved_at: item.comptroller_approved_at,
                  hr_approved_at: item.hr_approved_at,
                  admin_processed_at: item.admin_processed_at,
                  head_approved_at: item.head_approved_at,
                  total_budget: item.total_budget,
                  comptroller_edited_budget: item.comptroller_edited_budget,
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
                }}
                showActions={true}
                onView={() => setSelected(item)}
              />
            );
          })}
        </div>
      )}

      {selected && (
        <HRRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}
