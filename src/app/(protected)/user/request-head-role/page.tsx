"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, FileText, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import SearchableSelect from "@/components/common/ui/SearchableSelect";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface HeadRoleRequest {
  id: string;
  user_id: string;
  department_id: string | null;
  department: Department | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_comments: string | null;
}

export default function RequestHeadRolePage() {
  const router = useRouter();
  const toast = useToast();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [myRequests, setMyRequests] = React.useState<HeadRoleRequest[]>([]);
  
  const [formData, setFormData] = React.useState({
    department_id: "",
    reason: "",
  });

  // Fetch departments
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments");
        const result = await response.json();
        if (result.ok && result.departments) {
          setDepartments(result.departments);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
    fetchMyRequests();
  }, []);

  // Fetch user's existing requests
  const fetchMyRequests = async () => {
    try {
      const response = await fetch("/api/head-role-requests");
      const result = await response.json();
      if (result.ok && result.data) {
        setMyRequests(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error("Reason required", "Please provide a reason for requesting head role");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/head-role-requests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: formData.department_id || null,
          reason: formData.reason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      toast.success("Request submitted", "Your head role request has been submitted. Superadmin will review it.");
      setFormData({ department_id: "", reason: "" });
      fetchMyRequests();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit", error.message || "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
    }
  };

  const hasPendingRequest = myRequests.some(r => r.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/user"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Head Role</h1>
          <p className="text-sm text-gray-600 mt-1">
            Request to become a department head. Superadmin will review your request.
          </p>
        </div>
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Requests</h2>
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                    {request.department ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{request.department.name}</span>
                        {request.department.code && (
                          <span className="text-gray-500">({request.department.code})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">General Head Request</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                    {request.review_comments && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        <span className="font-medium">Review comment:</span> {request.review_comments}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Form */}
      {!hasPendingRequest && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">New Head Role Request</h2>
              <p className="text-sm text-gray-600">Fill out the form below to request head role</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                  Select a specific department, or leave blank for a general head request
                </p>
              <SearchableSelect
                options={departments.map(dept => ({
                  value: dept.id,
                  label: `${dept.name}${dept.code ? ` (${dept.code})` : ""}`,
                }))}
                value={formData.department_id}
                onChange={(value) => setFormData({ ...formData, department_id: value })}
                placeholder="Select department (optional)"
                disabled={loading || submitting}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Explain why you want to become a department head
              </p>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="I would like to become a department head because..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                disabled={submitting}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !formData.reason.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
              <Link
                href="/user"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {hasPendingRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Pending Request</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You already have a pending head role request. Please wait for superadmin to review it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

