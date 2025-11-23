"use client";

import * as React from "react";
import { Shield, Building2, User, CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";
import { useToast } from "@/components/common/ui/Toast";
import { SkeletonTable } from "@/components/common/ui/Skeleton";
import { createSupabaseClient } from "@/lib/supabase/client";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  department: Department | null;
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
  user: User;
  reviewer: User | null;
}

export default function HeadRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = React.useState<HeadRoleRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [reviewComments, setReviewComments] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    fetchRequests();
    
    // Real-time subscription
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("head-role-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "head_role_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/head-role-requests");
      const result = await response.json();
      if (result.ok && result.data) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      toast.error("Error", "Failed to load head role requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (processingId) return;
    
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/head-role-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          comments: reviewComments[requestId] || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to approve request");
      }

      toast.success("Request approved", "User has been granted head role");
      setReviewComments({ ...reviewComments, [requestId]: "" });
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve", error.message || "Please try again");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (processingId) return;
    
    if (!reviewComments[requestId]?.trim()) {
      toast.error("Comment required", "Please provide a reason for rejection");
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/head-role-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          comments: reviewComments[requestId].trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to reject request");
      }

      toast.success("Request rejected", "Request has been rejected");
      setReviewComments({ ...reviewComments, [requestId]: "" });
      fetchRequests();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject", error.message || "Please try again");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  if (loading) {
    return <SkeletonTable rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Head Role Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and approve/reject requests from users to become department heads
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Requests</div>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{requests.length}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-yellow-800">Pending</div>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-900">{pendingCount}</div>
          {pendingCount > 0 && (
            <div className="mt-2 text-xs text-yellow-700 font-medium">Requires attention</div>
          )}
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-green-800">Approved</div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{approvedCount}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-300 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-red-800">Rejected</div>
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-900">{rejectedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-medium"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg">No head role requests found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Requests will appear here when users submit them"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all border-l-4 border-transparent hover:border-purple-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-base">{request.user.name}</div>
                        <div className="text-sm text-gray-500">{request.user.email}</div>
                      </div>
                    </div>

                    {/* Department */}
                    {request.department ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{request.department.name}</span>
                        {request.department.code && (
                          <span className="text-gray-500">({request.department.code})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">General Head Request</span>
                      </div>
                    )}

                    {/* Reason */}
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Reason</div>
                      <p className="text-sm text-gray-700 bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 leading-relaxed">{request.reason}</p>
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center flex-wrap gap-3 mt-4">
                      {request.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-300 px-3.5 py-1.5 text-xs font-semibold text-yellow-800 shadow-sm">
                          <Clock className="h-3.5 w-3.5" />
                          Pending Review
                        </span>
                      )}
                      {request.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-100 to-green-50 border border-green-300 px-3.5 py-1.5 text-xs font-semibold text-green-800 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approved
                        </span>
                      )}
                      {request.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 border border-red-300 px-3.5 py-1.5 text-xs font-semibold text-red-800 shadow-sm">
                          <XCircle className="h-3.5 w-3.5" />
                          Rejected
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">Requested:</span>
                        <span>{new Date(request.requested_at).toLocaleString()}</span>
                      </div>
                      {request.reviewed_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-medium">Reviewed:</span>
                          <span>{new Date(request.reviewed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Review Comments */}
                    {request.review_comments && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-sm">
                        <span className="font-semibold text-blue-900">Review Comment:</span>
                        <p className="text-gray-700 mt-1 leading-relaxed">{request.review_comments}</p>
                      </div>
                    )}

                    {/* Review Form (for pending requests) */}
                    {request.status === "pending" && (
                      <div className="mt-5 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Review Comment <span className="text-gray-500 font-normal text-xs">(Required for rejection)</span>
                        </label>
                        <textarea
                          value={reviewComments[request.id] || ""}
                          onChange={(e) => setReviewComments({ ...reviewComments, [request.id]: e.target.value })}
                          placeholder="Add comments about this request..."
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none text-sm transition-all"
                        />
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {processingId === request.id ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id || !reviewComments[request.id]?.trim()}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            {processingId === request.id ? (
                              <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

