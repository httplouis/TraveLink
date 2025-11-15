// src/app/(protected)/super-admin/departments/page.tsx
"use client";

import * as React from "react";
import { Building2, Plus, Edit2, Trash2, Search, Save, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { createSupabaseClient } from "@/lib/supabase/client";

interface Department {
  id: string;
  name: string;
  code: string;
  type?: string;
  parent_department_id?: string;
  parent?: {
    id: string;
    name: string;
    code: string;
  };
  created_at?: string;
}

export default function SuperAdminDepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    code: "",
    type: "academic",
    parent_department_id: "",
  });

  React.useEffect(() => {
    fetchDepartments();

    // Real-time subscription for departments table
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("super-admin-departments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "departments",
        },
        () => {
          fetchDepartments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/departments");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch departments");
      }

      // Map parent departments
      const departmentsMap = new Map(
        (data.departments || []).map((d: Department) => [d.id, d])
      );

      const departmentsWithParents = (data.departments || []).map((dept: Department) => ({
        ...dept,
        parent: dept.parent_department_id ? departmentsMap.get(dept.parent_department_id) || null : null,
      }));

      setDepartments(departmentsWithParents);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.code) {
        toast.error("Validation Error", "Name and code are required");
        return;
      }

      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
          type: formData.type,
          parent_department_id: formData.parent_department_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create department");
      }

      toast.success("Department Created", "Department has been created successfully");
      setShowCreateModal(false);
      setFormData({ name: "", code: "", type: "academic", parent_department_id: "" });
      fetchDepartments();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to create department");
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code,
      type: dept.type || "academic",
      parent_department_id: dept.parent_department_id || "",
    });
  };

  const handleUpdate = async (deptId: string) => {
    try {
      if (!formData.name || !formData.code) {
        toast.error("Validation Error", "Name and code are required");
        return;
      }

      const response = await fetch(`/api/departments/${deptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code.toUpperCase(),
          type: formData.type,
          parent_department_id: formData.parent_department_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update department");
      }

      toast.success("Department Updated", "Department has been updated successfully");
      setEditingId(null);
      setFormData({ name: "", code: "", type: "academic", parent_department_id: "" });
      fetchDepartments();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to update department");
    }
  };

  const handleDelete = async (deptId: string, deptName: string) => {
    if (!confirm(`Are you sure you want to delete "${deptName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${deptId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete department");
      }

      toast.success("Department Deleted", "Department has been deleted successfully");
      fetchDepartments();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to delete department");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowCreateModal(false);
    setFormData({ name: "", code: "", type: "academic", parent_department_id: "" });
  };

  const filteredDepartments = departments.filter((dept) => {
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      dept.type?.toLowerCase().includes(query) ||
      dept.parent?.name.toLowerCase().includes(query)
    );
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="mt-2 text-gray-600">
            Create and manage departments. Departments can have parent-child relationships.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Create Department</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, code, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
        />
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">Code</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[300px]">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[120px]">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold min-w-[200px]">Parent Department</th>
                <th className="px-6 py-4 text-center text-sm font-bold min-w-[120px] sticky right-0 bg-gradient-to-r from-purple-600 to-purple-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {editingId === dept.id ? (
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                          placeholder="e.g., CCMS"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-100 text-purple-800 border-2 border-purple-200 text-sm font-semibold">
                          <Building2 className="h-4 w-4" />
                          {dept.code}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === dept.id ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                          placeholder="Department name"
                        />
                      ) : (
                        <div className="font-semibold text-gray-900">{dept.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === dept.id ? (
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                          <option value="academic">Academic</option>
                          <option value="office">Office</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                          {dept.type || "academic"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === dept.id ? (
                        <select
                          value={formData.parent_department_id}
                          onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
                          className="w-full rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                        >
                          <option value="">No parent</option>
                          {departments
                            .filter((d) => d.id !== dept.id)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.code} - {d.name}
                              </option>
                            ))}
                        </select>
                      ) : dept.parent ? (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{dept.parent.code}</span> - {dept.parent.name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No parent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === dept.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(dept.id)}
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
                              onClick={() => handleEdit(dept)}
                              className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
                              title="Edit department"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(dept.id, dept.name)}
                              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                              title="Delete department"
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Create Department</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., CCMS"
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., College of Computing and Multimedia Studies"
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    <option value="academic">Academic</option>
                    <option value="office">Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Department</label>
                  <select
                    value={formData.parent_department_id}
                    onChange={(e) => setFormData({ ...formData, parent_department_id: e.target.value })}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    <option value="">No parent</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold"
                >
                  Create Department
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
