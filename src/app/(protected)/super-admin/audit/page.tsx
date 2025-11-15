// src/app/(protected)/super-admin/audit/page.tsx
"use client";

import * as React from "react";
import { FileText, Search, Clock, User, Activity, Filter, Download } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SuperAdminAuditPage() {
  const toast = useToast();
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterAction, setFilterAction] = React.useState<string>("all");
  const [filterEntity, setFilterEntity] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const itemsPerPage = 50;

  React.useEffect(() => {
    fetchAuditLogs();

    // Real-time subscription for audit_logs table
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("super-admin-audit-logs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_logs",
        },
        (payload) => {
          console.log('[SuperAdminAudit] 🔔 Real-time update received:', payload.eventType);
          fetchAuditLogs();
        }
      )
      .subscribe((status) => {
        console.log('[SuperAdminAudit] 📡 Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterAction, filterEntity]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(filterAction !== "all" && { action: filterAction }),
        ...(filterEntity !== "all" && { entity_type: filterEntity }),
      });

      console.log('[SuperAdminAudit] Fetching audit logs with params:', params.toString());
      const response = await fetch(`/api/super-admin/audit-logs?${params}`, {
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();

      console.log('[SuperAdminAudit] API Response:', {
        ok: data.ok,
        count: data.data?.length || 0,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
      });

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch audit logs");
      }

      setLogs(data.data || []);
      setTotalPages(data.totalPages || 1);
      
      if (data.data && data.data.length > 0) {
        console.log('[SuperAdminAudit] ✅ Loaded', data.data.length, 'audit logs');
      } else {
        console.log('[SuperAdminAudit] ⚠️ No audit logs found');
      }
    } catch (err: any) {
      console.error('[SuperAdminAudit] ❌ Error fetching audit logs:', err);
      toast.error("Error", err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entity_type?.toLowerCase().includes(query) ||
      log.user?.name.toLowerCase().includes(query) ||
      log.user?.email.toLowerCase().includes(query) ||
      JSON.stringify(log.old_value || {}).toLowerCase().includes(query) ||
      JSON.stringify(log.new_value || {}).toLowerCase().includes(query)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("create") || action.includes("grant")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (action.includes("update") || action.includes("edit")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (action.includes("delete") || action.includes("revoke")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.includes("approve")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (action.includes("reject") || action.includes("deny")) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatJsonValue = (value: any) => {
    if (!value) return "—";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Old Value", "New Value", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          log.user?.email || "System",
          log.action,
          log.entity_type || "",
          log.entity_id || "",
          JSON.stringify(log.old_value || {}).replace(/"/g, '""'),
          JSON.stringify(log.new_value || {}).replace(/"/g, '""'),
          log.ip_address || "",
        ].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export", "Audit logs exported successfully");
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">
            View system activity and changes. Track all user actions and system modifications.
          </p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
        >
          <Download className="h-5 w-5" />
          <span className="font-semibold">Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, user, entity, or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="grant">Grant</option>
          <option value="revoke">Revoke</option>
        </select>
        <select
          value={filterEntity}
          onChange={(e) => {
            setFilterEntity(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        >
          <option value="all">All Entities</option>
          <option value="users">Users</option>
          <option value="requests">Requests</option>
          <option value="role_grants">Role Grants</option>
          <option value="departments">Departments</option>
          <option value="vehicles">Vehicles</option>
          <option value="drivers">Drivers</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[180px]">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[150px]">Action</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[150px]">Entity Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[120px]">Entity ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">Old Value</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">New Value</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[150px]">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-gray-900">{log.user.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{log.user.email}</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Activity className="h-4 w-4" />
                          System
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 text-xs font-semibold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 font-medium">
                        {log.entity_type || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {log.entity_id ? log.entity_id.substring(0, 8) + "..." : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-[200px]">
                        {log.old_value ? (
                          <details className="cursor-pointer">
                            <summary className="text-purple-600 hover:text-purple-700 font-medium">
                              View old value
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded border text-xs overflow-auto max-h-32">
                              {formatJsonValue(log.old_value)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-[200px]">
                        {log.new_value ? (
                          <details className="cursor-pointer">
                            <summary className="text-purple-600 hover:text-purple-700 font-medium">
                              View new value
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded border text-xs overflow-auto max-h-32">
                              {formatJsonValue(log.new_value)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {log.ip_address || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">About Audit Logs</h3>
            <p className="text-sm text-purple-800 leading-relaxed">
              This page shows a complete audit trail of all system activities, including user actions, 
              role changes, request approvals, and system modifications. All changes are logged with 
              timestamps, user information, and before/after values for full traceability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
