// src/app/(protected)/super-admin/users/page.tsx
"use client";

import * as React from "react";
import { Search, Shield, Building2, Mail, Phone, Edit2, Save, X, UserCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  phone_number?: string;
  position_title?: string;
  is_head?: boolean;
  is_admin?: boolean;
  is_vp?: boolean;
  is_president?: boolean;
  is_hr?: boolean;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const ROLE_OPTIONS = [
  { value: "faculty", label: "Faculty / Staff", icon: UserCheck },
  { value: "head", label: "Department Head", icon: Shield },
  { value: "admin", label: "Administrator", icon: Shield },
  { value: "comptroller", label: "Comptroller", icon: Shield },
  { value: "hr", label: "HR Officer", icon: Shield },
  { value: "vp", label: "Vice President", icon: Shield },
  { value: "president", label: "President / COO", icon: Shield },
];

export default function SuperAdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState<Partial<User & { department_id: string }>>({});

  React.useEffect(() => {
    fetchUsers();
    fetchDepartments();

    // Real-time subscription for users table
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("super-admin-users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.data || []);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();
      if (data.ok && data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({
      role: user.role,
      department_id: user.department_id || "",
      is_head: user.is_head || false,
      is_admin: user.is_admin || false,
      is_vp: user.is_vp || false,
      is_president: user.is_president || false,
      is_hr: user.is_hr || false,
    });
  };

  const handleSave = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      // Note: The main API already handles role grants and department_heads mappings
      // No need to call /api/rbac/grant-role separately

      toast.success("User updated", "Role and permissions have been updated successfully");
      setEditingId(null);
      setEditData({});
      fetchUsers();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update user");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.department?.name.toLowerCase().includes(query) ||
      user.department?.code.toLowerCase().includes(query)
    );
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "head":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "comptroller":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "hr":
        return "bg-green-100 text-green-800 border-green-200";
      case "vp":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "president":
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage user roles, permissions, and department assignments. You can assign any CCMS student account as a department head.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, role, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[280px]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[220px]">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[160px]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[240px]">Permissions</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[120px]">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold min-w-[120px] sticky right-0 bg-gradient-to-r from-purple-600 to-purple-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {user.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select
                          value={editData.department_id || ""}
                          onChange={(e) => setEditData({ ...editData, department_id: e.target.value })}
                          className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                          <option value="">No department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      ) : (
                        user.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.department.name}</div>
                              <div className="text-xs text-gray-500">{user.department.code}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No department</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select
                          value={editData.role || "faculty"}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border-2 text-xs font-semibold ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_head || false}
                              onChange={(e) => setEditData({ ...editData, is_head: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Department Head</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_admin || false}
                              onChange={(e) => setEditData({ ...editData, is_admin: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Super Admin</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_hr || false}
                              onChange={(e) => setEditData({ ...editData, is_hr: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>HR Officer</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_vp || false}
                              onChange={(e) => setEditData({ ...editData, is_vp: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Vice President</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_president || false}
                              onChange={(e) => setEditData({ ...editData, is_president: e.target.checked })}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>President / COO</span>
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {user.is_head && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Head
                            </span>
                          )}
                          {user.is_admin && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Super Admin
                            </span>
                          )}
                          {user.is_hr && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              HR
                            </span>
                          )}
                          {user.is_vp && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              VP
                            </span>
                          )}
                          {user.is_president && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              President
                            </span>
                          )}
                          {!user.is_head &&
                            !user.is_admin &&
                            !user.is_hr &&
                            !user.is_vp &&
                            !user.is_president && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium text-gray-500">
                                No special permissions
                              </span>
                            )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === user.id ? (
                          <>
                            <button
                              onClick={() => handleSave(user.id)}
                              className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
          <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Assigning Head Role</h3>
            <p className="text-sm text-purple-800 leading-relaxed">
              To make a CCMS student account a department head:
            </p>
            <ol className="list-decimal list-inside text-sm text-purple-800 mt-2 space-y-1">
              <li>Find the user in the table above</li>
              <li>Click the Edit button (pencil icon)</li>
              <li>Select their department from the dropdown</li>
              <li>Check the "Department Head" checkbox</li>
              <li>Optionally set their role to "Department Head"</li>
              <li>Click Save to apply changes</li>
            </ol>
            <p className="text-sm text-purple-800 mt-3">
              <strong>Note:</strong> The system will automatically create the department head mapping when you save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

