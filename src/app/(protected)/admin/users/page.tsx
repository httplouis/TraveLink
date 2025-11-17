// src/app/(protected)/admin/users/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Shield, UserCheck, Building2, Mail, Phone, Edit2, Save, X, Lock } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";

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
  is_comptroller?: boolean;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  type?: string;
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

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState<Partial<User>>({});
  const [accessDenied, setAccessDenied] = React.useState(false);

  React.useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();
      if (response.ok && data.ok) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

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
      // Check if it's an access denied error
      if (err.message?.includes("Super Admin") || err.message?.includes("Forbidden")) {
        setAccessDenied(true);
        toast.error("Access Denied", "Only Super Administrators can manage users. Please contact your system administrator.");
      } else {
        toast.error("Error", err.message || "Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({
      role: user.role,
      department_id: user.department_id || user.department?.id || undefined, // PRESERVE department_id
      is_head: user.is_head || false,
      is_admin: user.is_admin || false,
      is_vp: user.is_vp || false,
      is_president: user.is_president || false,
      is_hr: user.is_hr || false,
      is_comptroller: user.is_comptroller || false,
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A0010] border-t-transparent" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only <strong>Super Administrators</strong> can access User Management.
          </p>
          <p className="text-sm text-gray-500">
            If you need access, please contact your system administrator.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2 rounded-lg bg-[#7A0010] text-white hover:bg-[#5A0010] transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage user roles and permissions. All users default to Faculty/Staff upon registration.
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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Permissions</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold">Actions</th>
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
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5A0010] flex items-center justify-center text-white font-bold">
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
                          onChange={(e) => setEditData({ ...editData, department_id: e.target.value || null })}
                          className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none min-w-[200px]"
                        >
                          <option value="">No department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      ) : user.department ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.department.name}</div>
                            <div className="text-xs text-gray-500">{user.department.code}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No department</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === user.id ? (
                        <select
                          value={editData.role || "faculty"}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 outline-none"
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
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                            />
                            <span>Department Head</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_admin || false}
                              onChange={(e) => setEditData({ ...editData, is_admin: e.target.checked })}
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                            />
                            <span>Administrator</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_comptroller || false}
                              onChange={(e) => setEditData({ ...editData, is_comptroller: e.target.checked })}
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                            />
                            <span>Comptroller</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_hr || false}
                              onChange={(e) => setEditData({ ...editData, is_hr: e.target.checked })}
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                            />
                            <span>HR Officer</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_vp || false}
                              onChange={(e) => setEditData({ ...editData, is_vp: e.target.checked })}
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
                            />
                            <span>Vice President</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editData.is_president || false}
                              onChange={(e) => setEditData({ ...editData, is_president: e.target.checked })}
                              className="rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
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
                              Admin
                            </span>
                          )}
                          {user.is_comptroller && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              Comptroller
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
                            !user.is_comptroller &&
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === user.id ? (
                          <>
                            <button
                              onClick={() => handleSave(user.id)}
                              className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
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
                            className="p-2 rounded-lg bg-[#7A0010] text-white hover:bg-[#5A0010] transition-colors"
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
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Role Assignment Policy</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              All users register as <strong>Faculty/Staff</strong> by default. Only administrators can assign
              special roles (Department Head, Admin, Comptroller, HR, VP, President). This ensures proper
              access control and security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

