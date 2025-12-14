"use client";

import React from "react";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import HRRequestModal from "@/components/hr/HRRequestModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import RequestsTable from "@/components/common/RequestsTable";
import ViewToggle, { useViewMode } from "@/components/common/ViewToggle";
import { Eye } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";
import { shouldShowPendingAlert, getAlertSeverity, getAlertMessage } from "@/lib/notifications/pending-alerts";
import { AlertCircle } from "lucide-react";

export default function HRInboxContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = useViewMode("hr_inbox_view", "cards");

  const logger = createLogger("HRInbox");

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      logger.info("Loading HR requests...");
      const res = await fetch("/api/hr/inbox", { cache: "no-store" });
      if (!res.ok) {
        logger.error("API response not OK:", { status: res.status, statusText: res.statusText });
        setItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        logger.error("API returned non-JSON response. Content-Type:", contentType);
        setItems([]);
        return;
      }
      const json = await res.json();
      if (json.ok) {
        logger.debug("HR Inbox - Full Response:", { count: json.data?.length || 0 });
        if (json.data && json.data.length > 0) {
          logger.debug("HR Inbox - First Item:", { id: json.data[0].id, status: json.data[0].status });
        }
        setItems(json.data ?? []);
        setLastUpdate(new Date());
        logger.success(`Loaded ${json.data?.length || 0} HR requests`);
      } else {
        logger.warn("Failed to load HR requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading HR requests:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  // Initial load
  React.useEffect(() => {
    load();
  }, []);

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
        (payload: any) => {
          // Only react to relevant status changes
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          const relevantStatuses = ['pending_hr', 'approved', 'rejected'];
          
          if (relevantStatuses.includes(newStatus) || relevantStatuses.includes(oldStatus)) {
            // Debounce: only trigger refetch after 500ms
            if (mutateTimeout) clearTimeout(mutateTimeout);
            mutateTimeout = setTimeout(() => {
              load(false); // Silent refresh
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  function handleApproved(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => load(false), 500);
  }

  function handleRejected(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => load(false), 500);
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
              {items.length} {items.length === 1 ? 'request' : 'requests'} awaiting HR review
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
                <span>{getAlertMessage(items.length, 'hr')}</span>
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
