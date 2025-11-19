"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import type { RequestData } from "@/components/common/RequestDetailsView";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";

type Request = {
  id: string;
  request_number: string;
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  status: string;
  requester: { id: string; name: string; email: string };
  department: { id: string; name: string; code: string };
  head_approver?: { id: string; name: string; email: string };
  admin_approver?: { id: string; name: string; email: string };
  created_at: string;
  updated_at: string;
  request_type?: string;
  seminar_data?: any;
  destination_geo?: { lat: number; lng: number };
};

export default function AdminInboxPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Request[]>([]);
  const [historyItems, setHistoryItems] = React.useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = React.useState<RequestData | null>(null);
  const [activeTab, setActiveTab] = React.useState<"pending" | "history">("pending");
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewedIds, setViewedIds] = React.useState<Set<string>>(new Set());

  const logger = createLogger("AdminInbox");

  // Load pending requests - Admin can see ALL pending requests
  const loadPending = React.useCallback(async () => {
    try {
      logger.info("Loading pending requests...");
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      logger.debug("Pending requests response:", { ok: result.ok, count: result.data?.length || 0 });
      
      if (result.ok && result.data) {
        // First, filter out drafts and pending_head (admin should only see head-approved requests)
        const headApprovedRequests = result.data.filter((r: any) => {
          // Exclude drafts - these are not submitted yet
          if (r.status === 'draft') {
            return false;
          }
          
          // Check if head has already approved FIRST (before excluding pending_head)
          // This handles multi-department requests where status might still be pending_head
          // but one or more heads have already approved
          const headApproved = !!(r.head_approved_at || r.head_signature || r.parent_head_approved_at || r.parent_head_signature);
          
          // Parse workflow_metadata if it's a string (JSONB from database)
          let workflowMetadata: any = {};
          if (r.workflow_metadata) {
            if (typeof r.workflow_metadata === 'string') {
              try {
                workflowMetadata = JSON.parse(r.workflow_metadata);
              } catch (e) {
                console.warn(`[Admin Inbox Client] Failed to parse workflow_metadata for ${r.request_number || r.id}:`, e);
                workflowMetadata = {};
              }
            } else {
              workflowMetadata = r.workflow_metadata;
            }
          }
          
          // Also check if head sent this to admin (via workflow_metadata)
          // OR if requester is head and status is pending_head/pending_admin (head requester can send directly to admin)
          const sentToAdmin = workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id;
          const isHeadRequester = r.requester_is_head === true;
          
          // SPECIAL CASE: Head requester with next_approver_role = 'admin' should be visible to admin
          // This handles cases where head submits and selects admin during submission
          // Even if head hasn't "approved" yet (because they're the requester), they've selected admin
          const headRequesterSentToAdmin = isHeadRequester && sentToAdmin && (r.status === 'pending_head' || r.status === 'pending_admin');
          
          // Debug logging for TO-2025-155
          if (r.request_number === 'TO-2025-155') {
            console.log(`[Admin Inbox Client] 🔍 DEBUG TO-2025-155:`, {
              status: r.status,
              requester_is_head: r.requester_is_head,
              headApproved,
              workflowMetadata,
              sentToAdmin,
              isHeadRequester,
              headRequesterSentToAdmin,
              shouldInclude: headApproved || sentToAdmin || headRequesterSentToAdmin
            });
          }
          
          // If head has approved, include it even if status is still pending_head
          // (this happens in multi-department requests where not all heads have approved yet)
          // OR if head explicitly sent it to admin
          // OR if head requester sent it to admin (special case)
          if (headApproved || sentToAdmin || headRequesterSentToAdmin) {
            if (r.request_number === 'TO-2025-155') {
              console.log(`[Admin Inbox Client] ✅ INCLUDING TO-2025-155`);
            }
            return true;
          }
          
          // Exclude pending_head - these are still waiting for head approval
          // Only exclude if head hasn't approved yet AND hasn't sent to admin AND not head requester
          if (r.status === 'pending_head') {
            if (r.request_number === 'TO-2025-155') {
              console.log(`[Admin Inbox Client] ❌ EXCLUDING TO-2025-155 - headApproved: ${headApproved}, sentToAdmin: ${sentToAdmin}, headRequesterSentToAdmin: ${headRequesterSentToAdmin}`);
            }
            return false;
          }
          
          // Include requests that are explicitly waiting for admin
          if (r.status === 'pending_admin') {
            return true;
          }
          
          // Include all other statuses after head approval
          return true;
        });
        
        // Filter for pending: all requests that are not in final state and admin hasn't acted yet
        // IMPORTANT: Include pending_head if head requester sent to admin (already filtered in previous step)
        const pendingRequests = headApprovedRequests.filter((r: any) => {
          const isPending = [
            "pending_admin",
            "pending_comptroller",
            "pending_hr",
            "pending_exec",
            "pending_hr_ack"
          ].includes(r.status);
          
          // SPECIAL CASE: Include pending_head if head requester sent to admin
          // This was already included in headApprovedRequests, so keep it here
          if (r.status === 'pending_head' && r.requester_is_head) {
            const workflowMetadata = (typeof r.workflow_metadata === 'string' 
              ? JSON.parse(r.workflow_metadata) 
              : r.workflow_metadata) || {};
            if (workflowMetadata.next_approver_role === 'admin' || workflowMetadata.next_admin_id) {
              if (r.request_number === 'TO-2025-155') {
                console.log(`[Admin Inbox Client] ✅ Keeping TO-2025-155 in pendingRequests (head requester sent to admin)`);
              }
              return true;
            }
          }
          
          // Also include requests that haven't been fully processed by admin
          return isPending || (!r.admin_approved_at && r.status !== "approved" && r.status !== "rejected" && r.status !== "completed");
        });
        
        setItems(pendingRequests || []);
        logger.success(`Loaded ${pendingRequests?.length || 0} pending requests`);
      } else {
        logger.warn("Failed to load pending requests:", result.error);
      }
    } catch (error) {
      logger.error("Error loading pending requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load history - Admin can see ALL requests
  const loadHistory = React.useCallback(async () => {
    try {
      // Use the same API endpoint to get all requests
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      
      if (result.ok && result.data) {
        // Filter for history: requests that are approved, rejected, completed, or admin already acted
        const historyRequests = result.data.filter((r: any) => {
          const adminActed = r.admin_approved_at || r.admin_approved_by || r.admin_processed_by;
          const isFinalState = ["approved", "rejected", "completed"].includes(r.status);
          const adminProcessed = adminActed && (
            r.status === "pending_comptroller" ||
            r.status === "pending_hr" ||
            r.status === "pending_exec"
          );
          return isFinalState || adminProcessed;
        });
        
        setHistoryItems(historyRequests || []);
      }
    } catch (error) {
      console.error("[Admin Inbox] Error loading history:", error);
    }
  }, []);

  React.useEffect(() => {
    loadPending();
    loadHistory();

    // Set up Supabase Realtime subscription for instant updates
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("admin-inbox-changes")
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
            if (activeTab === "pending") {
              loadPending();
            } else {
              loadHistory();
            }
          }, 500);
        }
      )
      .subscribe((status: string) => {
        console.log("[Admin Inbox] Realtime subscription status:", status);
      });

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === "pending") {
        loadPending();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
    };
  }, [loadPending, loadHistory, activeTab]);

  const markAsViewed = React.useCallback((id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_viewed_requests", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_viewed_requests");
      if (stored) {
        try {
          setViewedIds(new Set(JSON.parse(stored)));
        } catch {}
      }
    }
  }, []);

  const handleViewDetails = (req: Request) => {
    markAsViewed(req.id);
    
    // Parse seminar_data if it's a string
    let seminarData = req.seminar_data;
    if (typeof seminarData === "string") {
      try {
        seminarData = JSON.parse(seminarData);
      } catch {}
    }

    const requestData: RequestData = {
      id: req.id,
      request_number: req.request_number,
      purpose: req.purpose,
      destination: req.destination,
      department: req.department?.name || req.department?.code || "Unknown",
      travel_start_date: req.travel_start_date,
      travel_end_date: req.travel_end_date,
      date_requested: req.created_at,
      status: req.status,
      requester: req.requester?.name || "Unknown",
      requester_email: req.requester?.email || "",
      budget: 0, // Will be populated from expense_breakdown if available
      request_type: req.request_type || "travel_order",
      seminar_data: seminarData,
      destination_geo: req.destination_geo,
    };

    setSelectedRequest(requestData);
  };

  const currentItems = activeTab === "pending" ? items : historyItems;
  const uniqueDepartments = Array.from(new Set(currentItems.map((r) => r.department?.name || "Unknown")));

  if (selectedRequest) {
    return (
      <div className="p-4 md:p-6">
        <button
          onClick={() => setSelectedRequest(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back to Inbox
        </button>
        <RequestDetailsView request={selectedRequest} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Inbox</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "pending"
                ? "bg-[#7a1f2a] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg ${
              activeTab === "history"
                ? "bg-[#7a1f2a] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            History ({historyItems.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No requests found</div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((req) => (
            <RequestCardEnhanced
              key={req.id}
              request={{
                id: req.id,
                request_number: req.request_number || req.id,
                file_code: (req as any).file_code,
                title: (req as any).title,
                purpose: req.purpose || "No purpose specified",
                destination: (req as any).destination,
                travel_start_date: req.travel_start_date,
                travel_end_date: req.travel_end_date,
                status: req.status,
                created_at: req.created_at,
                total_budget: (req as any).total_budget,
                request_type: req.request_type,
                requester_name: req.requester?.name,
                requester: {
                  name: req.requester?.name || "Unknown",
                  email: req.requester?.email,
                  profile_picture: (req as any).requester?.profile_picture,
                  department: req.department?.name || req.department?.code,
                  position: (req as any).requester?.position_title,
                },
                department: req.department,
              }}
              showActions={true}
              onView={() => handleViewDetails(req)}
              className={!viewedIds.has(req.id) ? "border-blue-500 bg-blue-50/30" : ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}

