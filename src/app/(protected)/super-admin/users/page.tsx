// src/app/(protected)/super-admin/users/page.tsx
"use client";

import * as React from "react";
import { Search, Shield, Building2, Mail, Phone, Edit2, Save, X, UserCheck, CheckCircle2, Trash2, Filter } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import PasswordConfirmDialog from "@/components/common/PasswordConfirmDialog";
import SearchableSelect from "@/components/common/ui/SearchableSelect";
import { SkeletonTable } from "@/components/common/ui/Skeleton";

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
  
  // Filter states
  const [filters, setFilters] = React.useState<{
    department: string;
    role: string;
    permission: string;
    status: string;
  }>({
    department: "",
    role: "",
    permission: "",
    status: "",
  });
  const [activeFilterDropdown, setActiveFilterDropdown] = React.useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    action: "save" | "delete" | null;
    userId?: string;
    userName?: string;
  }>({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [isProcessing, setIsProcessing] = React.useState(false);

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFilterDropdown && !(event.target as Element).closest('th.relative')) {
        setActiveFilterDropdown(null);
      }
    };

    if (activeFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeFilterDropdown]);

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

  const handleSave = async (userId: string, password: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      toast.success("User updated", "Role and permissions have been updated successfully");
      setEditingId(null);
      setEditData({});
      setConfirmDialog({ open: false, title: "", message: "", action: null });
      fetchUsers();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update user");
      throw err; // Re-throw to show error in dialog
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClick = (userId: string, user: User) => {
    // Check if there are any changes
    const hasChanges = 
      editData.role !== user.role ||
      editData.department_id !== (user.department_id || "") ||
      editData.is_head !== (user.is_head || false) ||
      editData.is_admin !== (user.is_admin || false) ||
      editData.is_vp !== (user.is_vp || false) ||
      editData.is_president !== (user.is_president || false) ||
      editData.is_hr !== (user.is_hr || false);

    if (!hasChanges) {
      handleCancel();
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Confirm Changes",
      message: `Are you sure you want to update ${user.name}? This will change their role, permissions, or department assignment.`,
      action: "save",
      userId,
      userName: user.name,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (userId: string, userName: string, password: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted", `${userName} has been deleted successfully`);
      setConfirmDialog({ open: false, title: "", message: "", action: null });
      fetchUsers();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete user");
      throw err; // Re-throw to show error in dialog
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete ${userName}? This action cannot be undone and will permanently remove this user from the system.`,
      action: "delete",
      userId,
      userName,
    });
  };

  const filteredUsers = users.filter((user) => {
    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.department?.name.toLowerCase().includes(query) ||
      user.department?.code.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    
    // Department filter
    if (filters.department && user.department_id !== filters.department) {
      return false;
    }
    
    // Role filter
    if (filters.role && user.role !== filters.role) {
      return false;
    }
    
    // Permission filter
    if (filters.permission) {
      switch (filters.permission) {
        case "head":
          if (!user.is_head) return false;
          break;
        case "admin":
          // Regular admin: is_admin = true but NOT super admin
          if (!user.is_admin || (user as any).is_super_admin) return false;
          break;
        case "super_admin":
          // Super admin: is_admin = true AND is_super_admin = true
          if (!user.is_admin || !(user as any).is_super_admin) return false;
          break;
        case "hr":
          if (!user.is_hr) return false;
          break;
        case "vp":
          if (!user.is_vp) return false;
          break;
        case "president":
          if (!user.is_president) return false;
          break;
        case "none":
          if (user.is_head || user.is_admin || user.is_hr || user.is_vp || user.is_president) return false;
          break;
      }
    }
    
    // Status filter
    if (filters.status && user.status !== filters.status) {
      return false;
    }
    
    return true;
  });
  
  // Get unique values for filter options
  // Use ALL departments from the departments state, not just those with users
  const uniqueDepartments = React.useMemo(() => {
    // Return all departments from the departments state
    return departments;
  }, [departments]);
  
  const uniqueRoles = React.useMemo(() => {
    const roles = new Set(users.map((u) => u.role));
    return Array.from(roles);
  }, [users]);
  
  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set(users.map((u) => u.status));
    return Array.from(statuses);
  }, [users]);
  
  const clearFilter = (filterKey: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [filterKey]: "" }));
    setActiveFilterDropdown(null);
  };
  
  const setFilter = (filterKey: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
    setActiveFilterDropdown(null);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage user roles, permissions, and department assignments. You can assign any CCMS student account as a department head.
          </p>
        </div>
      </div>

      {/* Search and Active Filters */}
      <div className="space-y-3">
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
        {/* Active Filters Display */}
        {(filters.department || filters.role || filters.permission || filters.status) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {filters.department && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                Department: {uniqueDepartments.find((d) => d.id === filters.department)?.name || "Unknown"}
                <button
                  onClick={() => clearFilter("department")}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                Role: {ROLE_OPTIONS.find((r) => r.value === filters.role)?.label || filters.role}
                <button
                  onClick={() => clearFilter("role")}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.permission && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                Permission: {filters.permission === "none" ? "None" : filters.permission === "super_admin" ? "Super Admin" : filters.permission.charAt(0).toUpperCase() + filters.permission.slice(1)}
                <button
                  onClick={() => clearFilter("permission")}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                <button
                  onClick={() => clearFilter("status")}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setFilters({ department: "", role: "", permission: "", status: "" });
                setActiveFilterDropdown(null);
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full min-w-[1200px] relative">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[280px]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[220px] relative z-20">
                  <div className="flex items-center gap-2">
                    <span>Department</span>
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === "department" ? null : "department")}
                      className="relative p-1 hover:bg-purple-500 rounded transition-colors"
                      title="Filter by department"
                    >
                      <Filter className={`h-4 w-4 ${filters.department ? "text-yellow-300" : ""}`} />
                      {filters.department && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-300 rounded-full"></span>
                      )}
                    </button>
                  </div>
                  {activeFilterDropdown === "department" && (
                    <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl z-[9999] min-w-[250px] max-h-[300px] overflow-y-auto">
                      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Filter by Department</span>
                        {filters.department && (
                          <button
                            onClick={() => clearFilter("department")}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => setFilter("department", "")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            !filters.department ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          All Departments
                        </button>
                        {uniqueDepartments.map((dept) => (
                          <button
                            key={dept.id}
                            onClick={() => setFilter("department", dept.id)}
                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                              filters.department === dept.id ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            {dept.name} ({dept.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[160px] relative z-20">
                  <div className="flex items-center gap-2">
                    <span>Role</span>
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === "role" ? null : "role")}
                      className="relative p-1 hover:bg-purple-500 rounded transition-colors"
                      title="Filter by role"
                    >
                      <Filter className={`h-4 w-4 ${filters.role ? "text-yellow-300" : ""}`} />
                      {filters.role && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-300 rounded-full"></span>
                      )}
                    </button>
                  </div>
                  {activeFilterDropdown === "role" && (
                    <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl z-[9999] min-w-[200px]">
                      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Filter by Role</span>
                        {filters.role && (
                          <button
                            onClick={() => clearFilter("role")}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => setFilter("role", "")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            !filters.role ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          All Roles
                        </button>
                        {ROLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setFilter("role", opt.value)}
                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                              filters.role === opt.value ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[240px] relative z-20">
                  <div className="flex items-center gap-2">
                    <span>Permissions</span>
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === "permission" ? null : "permission")}
                      className="relative p-1 hover:bg-purple-500 rounded transition-colors"
                      title="Filter by permissions"
                    >
                      <Filter className={`h-4 w-4 ${filters.permission ? "text-yellow-300" : ""}`} />
                      {filters.permission && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-300 rounded-full"></span>
                      )}
                    </button>
                  </div>
                  {activeFilterDropdown === "permission" && (
                    <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl z-[9999] min-w-[200px]">
                      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Filter by Permission</span>
                        {filters.permission && (
                          <button
                            onClick={() => clearFilter("permission")}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => setFilter("permission", "")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            !filters.permission ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          All Permissions
                        </button>
                        <button
                          onClick={() => setFilter("permission", "head")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "head" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          Department Head
                        </button>
                        <button
                          onClick={() => setFilter("permission", "admin")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "admin" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          Admin
                        </button>
                        <button
                          onClick={() => setFilter("permission", "super_admin")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "super_admin" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          Super Admin
                        </button>
                        <button
                          onClick={() => setFilter("permission", "hr")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "hr" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          HR Officer
                        </button>
                        <button
                          onClick={() => setFilter("permission", "vp")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "vp" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          Vice President
                        </button>
                        <button
                          onClick={() => setFilter("permission", "president")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "president" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          President / COO
                        </button>
                        <button
                          onClick={() => setFilter("permission", "none")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            filters.permission === "none" ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          No Special Permissions
                        </button>
                      </div>
                    </div>
                  )}
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[120px] relative z-20">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <button
                      onClick={() => setActiveFilterDropdown(activeFilterDropdown === "status" ? null : "status")}
                      className="relative p-1 hover:bg-purple-500 rounded transition-colors"
                      title="Filter by status"
                    >
                      <Filter className={`h-4 w-4 ${filters.status ? "text-yellow-300" : ""}`} />
                      {filters.status && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-300 rounded-full"></span>
                      )}
                    </button>
                  </div>
                  {activeFilterDropdown === "status" && (
                    <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-2xl z-[9999] min-w-[150px]">
                      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Filter by Status</span>
                        {filters.status && (
                          <button
                            onClick={() => clearFilter("status")}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => setFilter("status", "")}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                            !filters.status ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                          }`}
                        >
                          All Statuses
                        </button>
                        {uniqueStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilter("status", status)}
                            className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                              filters.status === status ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold min-w-[120px] sticky right-0 bg-gradient-to-r from-purple-600 to-purple-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-48 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
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
                    <td className="px-6 py-4 relative z-30">
                      {editingId === user.id ? (
                        <div className="relative z-[9999]">
                          <SearchableSelect
                            options={[
                              { value: "", label: "No department" },
                              ...departments.map((dept) => ({
                                value: dept.id,
                                label: dept.name,
                                code: dept.code,
                              })),
                            ]}
                            value={editData.department_id || ""}
                            onChange={(value) => {
                              setEditData({ ...editData, department_id: value });
                            }}
                            placeholder="Search department..."
                            emptyMessage="No departments found"
                            className="min-w-[250px]"
                          />
                        </div>
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
                          onChange={(e) => {
                            const selectedRole = e.target.value;
                            // Automatically sync checkboxes based on selected role
                            const newEditData: any = { ...editData, role: selectedRole };
                            
                            // Clear all permission flags first
                            newEditData.is_head = false;
                            newEditData.is_admin = false;
                            newEditData.is_hr = false;
                            newEditData.is_vp = false;
                            newEditData.is_president = false;
                            
                            // Set the appropriate flag based on role
                            if (selectedRole === "head") {
                              newEditData.is_head = true;
                            } else if (selectedRole === "admin") {
                              newEditData.is_admin = true;
                            } else if (selectedRole === "hr") {
                              newEditData.is_hr = true;
                            } else if (selectedRole === "vp") {
                              newEditData.is_vp = true;
                            } else if (selectedRole === "president") {
                              newEditData.is_president = true;
                            }
                            
                            setEditData(newEditData);
                          }}
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
                        <span className="text-sm text-gray-500 italic">
                          Permissions auto-set by role
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {user.is_head && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Head
                            </span>
                          )}
                          {user.is_admin && (user as any).is_super_admin && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Super Admin
                            </span>
                          )}
                          {user.is_admin && !(user as any).is_super_admin && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              Admin
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
                              onClick={() => handleSaveClick(user.id, user)}
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
                          <>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id, user.name)}
                              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
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

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={
          confirmDialog.action === "delete" 
            ? "Delete User" 
            : "Confirm Changes"
        }
        cancelLabel="Cancel"
        isLoading={isProcessing}
        onCancel={() => {
          setConfirmDialog({ open: false, title: "", message: "", action: null });
          setIsProcessing(false);
        }}
        onConfirm={async (password) => {
          try {
            if (confirmDialog.action === "delete" && confirmDialog.userId && confirmDialog.userName) {
              await handleDelete(confirmDialog.userId, confirmDialog.userName, password);
            } else if (confirmDialog.action === "save" && confirmDialog.userId) {
              await handleSave(confirmDialog.userId, password);
            }
          } catch (err) {
            // Error already shown in toast
          }
        }}
      />
    </div>
  );
}

