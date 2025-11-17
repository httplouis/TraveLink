"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import type { RequestData } from "@/components/common/RequestDetailsView";

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

  // Load pending requests
  const loadPending = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/inbox");
      const result = await response.json();
      
      if (result.ok && result.data) {
        setItems(result.data || []);
      }
    } catch (error) {
      console.error("[Admin Inbox] Error loading pending:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load history
  const loadHistory = React.useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) return;

      // Get requests that admin has processed
      const { data: requests } = await supabase
        .from("requests")
        .select(`
          *,
          requester:users!requests_requester_id_fkey(id, email, name),
          department:departments!requests_department_id_fkey(id, name, code),
          head_approver:users!requests_head_approved_by_fkey(id, email, name),
          admin_approver:users!requests_admin_processed_by_fkey(id, email, name)
        `)
        .or(`admin_processed_by.eq.${profile.id},admin_approved_by.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (requests) {
        setHistoryItems(requests || []);
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
        <div className="text-center py-8">Loading...</div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No requests found</div>
      ) : (
        <div className="space-y-2">
          {currentItems.map((req) => (
            <div
              key={req.id}
              onClick={() => handleViewDetails(req)}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                !viewedIds.has(req.id) ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{req.request_number || req.id}</h3>
                  <p className="text-sm text-gray-600">{req.purpose}</p>
                  <p className="text-xs text-gray-500">
                    {req.department?.name || req.department?.code || "Unknown"} • {req.requester?.name || "Unknown"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    req.status === "pending_admin" || req.status === "head_approved"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {req.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

