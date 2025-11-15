// src/app/(protected)/super-admin/roles/page.tsx
"use client";

import * as React from "react";
import { Shield, Search, Clock, UserCheck, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";

interface RoleGrant {
  id: string;
  user_id: string;
  role: string;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  reason: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  granted_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  revoked_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SuperAdminRolesPage() {
  const toast = useToast();
  const [grants, setGrants] = React.useState<RoleGrant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterRole, setFilterRole] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<"all" | "active" | "revoked">("all");

  React.useEffect(() => {
    fetchRoleGrants();

    // Real-time subscription for role_grants table
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("super-admin-role-grants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "role_grants",
        },
        () => {
          fetchRoleGrants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRoleGrants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/super-admin/role-grants");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch role grants");
      }

      setGrants(data.data || []);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load role grants");
    } finally {
      setLoading(false);
    }
  };

  const filteredGrants = grants.filter((grant) => {
    const matchesSearch =
      grant.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grant.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || grant.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !grant.revoked_at) ||
      (filterStatus === "revoked" && grant.revoked_at);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "head":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "hr":
        return "bg-green-100 text-green-800 border-green-200";
      case "vp":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "exec":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Assignments</h1>
        <p className="mt-2 text-gray-600">
          View audit history of role grants and revocations. This is different from User Management which directly edits user roles.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="head">Head</option>
          <option value="hr">HR</option>
          <option value="vp">VP</option>
          <option value="exec">Executive</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "revoked")}
          className="px-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {/* Role Grants Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[120px]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[150px]">Granted By</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[180px]">Granted At</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[150px]">Revoked By</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[180px]">Revoked At</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">Reason</th>
                <th className="px-6 py-4 text-center text-sm font-bold min-w-[100px] sticky right-0 bg-gradient-to-r from-purple-600 to-purple-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGrants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No role grants found
                  </td>
                </tr>
              ) : (
                filteredGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{grant.user?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{grant.user?.email || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 text-xs font-semibold ${getRoleBadgeColor(
                          grant.role
                        )}`}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {grant.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {grant.granted_by_user?.name || "System"}
                      </div>
                      {grant.granted_by_user?.email && (
                        <div className="text-xs text-gray-500">{grant.granted_by_user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {new Date(grant.granted_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {grant.revoked_by_user ? (
                        <div className="text-sm text-gray-700">
                          {grant.revoked_by_user.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {grant.revoked_at ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {new Date(grant.revoked_at).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-[200px] truncate" title={grant.reason || ""}>
                        {grant.reason || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 sticky right-0 bg-white z-10">
                      {grant.revoked_at ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-800 border-2 border-red-200">
                          <X className="h-3.5 w-3.5" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border-2 border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">About Role Assignments</h3>
            <p className="text-sm text-purple-800 leading-relaxed">
              This page shows the <strong>audit history</strong> of role grants and revocations. 
              When you change a user's role in <strong>User Management</strong>, it automatically creates 
              an entry here for tracking purposes.
            </p>
            <p className="text-sm text-purple-800 mt-2">
              <strong>Difference:</strong> User Management directly edits user roles. Role Assignments 
              shows the history/audit trail of all role changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
