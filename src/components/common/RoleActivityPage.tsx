// src/components/common/RoleActivityPage.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, RefreshCw, Filter, ChevronDown, CheckCircle, XCircle,
  RotateCcw, Send, Edit, Eye, Truck, Clock, Calendar, FileText,
  X, MapPin, Users, Banknote,
} from "lucide-react";

interface ActivityItem {
  id: string;
  request_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  previous_status: string;
  new_status: string;
  comments: string;
  metadata: any;
  created_at: string;
  is_own_action?: boolean;
  request?: { id: string; request_number: string; purpose: string };
  actor?: { id: string; name: string; email: string };
}

interface RequestDetails {
  id: string;
  request_number: string;
  purpose: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
  total_budget: number;
  status: string;
  requester?: { name: string; email: string; department?: string | { id: string; name: string; code?: string } };
  department?: { id: string; name: string; code?: string };
  participants?: Array<{ name: string }>;
}

interface RoleActivityPageProps {
  /** The base path for viewing full request details (e.g., "/head/inbox", "/hr/inbox") */
  detailsBasePath: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  approved: <CheckCircle className="h-4 w-4 text-green-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  returned: <RotateCcw className="h-4 w-4 text-amber-600" />,
  resubmitted: <Send className="h-4 w-4 text-blue-600" />,
  submitted: <Send className="h-4 w-4 text-blue-600" />,
  budget_modified: <Edit className="h-4 w-4 text-purple-600" />,
  viewed: <Eye className="h-4 w-4 text-gray-600" />,
  assigned: <Truck className="h-4 w-4 text-teal-600" />,
  signed: <CheckCircle className="h-4 w-4 text-green-600" />,
  created: <FileText className="h-4 w-4 text-blue-600" />,
};

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved", rejected: "Rejected", returned: "Returned",
  resubmitted: "Resubmitted", submitted: "Submitted", budget_modified: "Budget Modified",
  viewed: "Viewed", assigned: "Assigned", signed: "Signed", created: "Created",
};

const ACTION_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800",
  returned: "bg-amber-100 text-amber-800", resubmitted: "bg-blue-100 text-blue-800",
  submitted: "bg-blue-100 text-blue-800", budget_modified: "bg-purple-100 text-purple-800",
  viewed: "bg-gray-100 text-gray-800", assigned: "bg-teal-100 text-teal-800",
  signed: "bg-green-100 text-green-800", created: "bg-blue-100 text-blue-800",
};

export default function RoleActivityPage({ detailsBasePath }: RoleActivityPageProps) {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [actionFilter, setActionFilter] = React.useState<string>("");
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<RequestDetails | null>(null);
  const [loadingRequest, setLoadingRequest] = React.useState(false);

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log("[RoleActivityPage] Component mounted with detailsBasePath:", detailsBasePath);
  }, [detailsBasePath]);

  const loadActivities = React.useCallback(async () => {
    setLoading(true);
    console.log("[RoleActivityPage] Loading activities...");
    try {
      const params = new URLSearchParams({ limit: pageSize.toString(), offset: ((page - 1) * pageSize).toString() });
      if (actionFilter) params.set("action_type", actionFilter);
      const url = `/api/activity?${params}`;
      console.log("[RoleActivityPage] Fetching from:", url);
      
      const res = await fetch(url, { 
        method: "GET",
        credentials: "include", 
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("[RoleActivityPage] Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[RoleActivityPage] HTTP error:", res.status, errorText);
        return;
      }
      
      const data = await res.json();
      console.log("[RoleActivityPage] FULL API response:", JSON.stringify(data, null, 2));
      console.log("[RoleActivityPage] API response summary:", { 
        ok: data.ok, 
        total: data.total, 
        dataLength: data.data?.length, 
        error: data.error,
        debug: data.debug 
      });
      
      if (data.ok) { 
        setActivities(data.data || []); 
        setTotal(data.total || 0); 
      } else {
        console.error("[RoleActivityPage] API returned error:", data.error);
      }
    } catch (error) { 
      console.error("[RoleActivityPage] Failed to load activities:", error); 
    }
    finally { setLoading(false); }
  }, [page, pageSize, actionFilter]);

  React.useEffect(() => { loadActivities(); }, [loadActivities]);

  const handleActivityClick = async (requestId: string) => {
    if (!requestId) return;
    setLoadingRequest(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.data) setSelectedRequest(data.data);
    } catch (error) { console.error("Failed to load request:", error); }
    finally { setLoadingRequest(false); }
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800",
      returned: "bg-amber-100 text-amber-800", rejected: "bg-red-100 text-red-800",
      completed: "bg-emerald-100 text-emerald-800", cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };
  const formatStatus = (status: string) => status ? status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Unknown";
  const actionTypes = ["approved", "rejected", "returned", "resubmitted", "submitted", "signed"];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] rounded-xl text-white"><History className="h-6 w-6" /></div>
            My Activity
          </h1>
          <p className="text-sm text-gray-600 mt-1">Track your actions and changes in the system</p>
        </div>
        <button onClick={loadActivities} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium min-w-[160px] justify-between">
              <span className="flex items-center gap-2"><Filter className="h-4 w-4 text-gray-500" />{actionFilter ? ACTION_LABELS[actionFilter] : "All Actions"}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showFilterDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button onClick={() => { setActionFilter(""); setShowFilterDropdown(false); setPage(1); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${!actionFilter ? "bg-gray-100 font-medium" : ""}`}>All Actions</button>
                {actionTypes.map((type) => (
                  <button key={type} onClick={() => { setActionFilter(type); setShowFilterDropdown(false); setPage(1); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${actionFilter === type ? "bg-gray-100 font-medium" : ""}`}>
                    {ACTION_ICONS[type]}{ACTION_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500">{total} total {total === 1 ? "activity" : "activities"}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Clock className="h-10 w-10 text-gray-300 mx-auto mb-3 animate-pulse" /><p className="text-gray-500">Loading activities...</p></div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center"><History className="h-10 w-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No activity yet</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity, index) => (
              <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} 
                onClick={() => activity.request_id && handleActivityClick(activity.request_id)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${ACTION_COLORS[activity.action]?.split(" ")[0] || "bg-gray-100"}`}>{ACTION_ICONS[activity.action] || <Clock className="h-4 w-4 text-gray-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[activity.action] || "bg-gray-100 text-gray-800"}`}>{ACTION_LABELS[activity.action] || activity.action}</span>
                      {activity.is_own_action ? (
                        <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded">by you as {activity.actor_role}</span>
                      ) : (
                        <span className="text-xs text-blue-600 px-2 py-0.5 bg-blue-50 rounded">by {activity.actor?.name || activity.actor_role}</span>
                      )}
                    </div>
                    {activity.request && <p className="text-sm text-gray-600 mt-1 group-hover:text-[#7A0010]">Request: <span className="font-medium">{activity.request.request_number}</span>{activity.request.purpose && <span className="text-gray-400"> - {activity.request.purpose.slice(0, 50)}...</span>}</p>}
                    {activity.comments && <p className="text-sm text-gray-500 mt-1 italic">"{activity.comments}"</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(activity.created_at)}</span>
                      <span>{formatTimeAgo(activity.created_at)}</span>
                      <span className="text-gray-500 opacity-0 group-hover:opacity-100 flex items-center gap-1"><Eye className="h-3 w-3" />View Summary</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} – {Math.min(page * pageSize, total)} of {total}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600 min-w-[100px] text-center">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      <AnimatePresence>
        {(selectedRequest || loadingRequest) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !loadingRequest && setSelectedRequest(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
              {loadingRequest ? (
                <div className="p-12 text-center"><Clock className="h-10 w-10 text-gray-300 mx-auto mb-3 animate-pulse" /><p className="text-gray-500">Loading request details...</p></div>
              ) : selectedRequest && (
                <>
                  <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedRequest.request_number}</h2>
                        <p className="text-white/80 mt-1">{selectedRequest.purpose}</p>
                      </div>
                      <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white/20 rounded-lg"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="mt-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>{formatStatus(selectedRequest.status)}</span></div>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Requester Info */}
                      {selectedRequest.requester && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg"><Users className="h-5 w-5 text-amber-600" /></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Requester</p>
                            <p className="font-medium text-gray-900">{selectedRequest.requester.name}</p>
                            <p className="text-sm text-gray-500">{selectedRequest.requester.email}</p>
                            {selectedRequest.department && (
                              <p className="text-sm text-gray-500">{typeof selectedRequest.department === "object" ? selectedRequest.department.name : selectedRequest.department}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Destination */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><MapPin className="h-5 w-5 text-blue-600" /></div>
                        <div><p className="text-xs text-gray-500 uppercase">Destination</p><p className="font-medium text-gray-900">{selectedRequest.destination || "—"}</p></div>
                      </div>
                      
                      {/* Travel Start Date */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Travel Start</p>
                          <p className="font-medium text-gray-900">{selectedRequest.travel_start_date ? new Date(selectedRequest.travel_start_date).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                        </div>
                      </div>
                      
                      {/* Travel End Date */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Travel End</p>
                          <p className="font-medium text-gray-900">{selectedRequest.travel_end_date ? new Date(selectedRequest.travel_end_date).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                        </div>
                      </div>
                      
                      {/* Total Budget */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><Banknote className="h-5 w-5 text-green-600" /></div>
                        <div><p className="text-xs text-gray-500 uppercase">Total Budget</p><p className="font-medium text-gray-900">{formatCurrency(selectedRequest.total_budget)}</p></div>
                      </div>
                      
                      {/* Participants */}
                      {selectedRequest.participants && selectedRequest.participants.length > 0 && (
                        <div className="flex items-start gap-3 md:col-span-2">
                          <div className="p-2 bg-teal-100 rounded-lg"><Users className="h-5 w-5 text-teal-600" /></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase">Participants ({selectedRequest.participants.length})</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedRequest.participants.map((p, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">{p.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4">
                    {/* View-only notice */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" />
                        <span>This is a read-only view from Activity History. No actions can be taken here.</span>
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg">Close</button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
