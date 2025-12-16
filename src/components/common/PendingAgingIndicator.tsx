"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, AlertCircle, CheckCircle, ChevronRight, Flame } from "lucide-react";

interface PendingRequest {
  id: string;
  request_number?: string;
  purpose?: string;
  requester_name?: string;
  submitted_at: string;
  status: string;
  days_pending: number;
  priority?: "low" | "medium" | "high" | "urgent";
}

interface PendingAgingIndicatorProps {
  role?: string;
  maxItems?: number;
  onRequestClick?: (request: PendingRequest) => void;
}

export default function PendingAgingIndicator({ role, maxItems = 5, onRequestClick }: PendingAgingIndicatorProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ urgent: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    loadPendingRequests();
  }, [role]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      // Use the appropriate inbox endpoint based on role
      const endpoint = role === "admin" ? "/api/admin/inbox" : 
                       role ? `/api/${role}/inbox` : 
                       "/api/requests?status=pending";
      const res = await fetch(endpoint, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Filter to only pending statuses
          const allData = data.data || [];
          const pendingStatuses = [
            "pending_head", "pending_admin", "pending_comptroller", 
            "pending_hr", "pending_exec", "pending_vp", "pending_president",
            "head_approved", "admin_processed"
          ];
          
          const pendingOnly = allData.filter((r: any) => 
            pendingStatuses.some(s => r.status?.includes(s) || r.status === s)
          );
          
          const pendingList = pendingOnly.map((r: any) => {
            const submittedAt = new Date(r.submitted_at || r.created_at);
            const now = new Date();
            const daysPending = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
            
            let priority: "low" | "medium" | "high" | "urgent" = "low";
            if (daysPending >= 7) priority = "urgent";
            else if (daysPending >= 5) priority = "high";
            else if (daysPending >= 3) priority = "medium";

            return {
              ...r,
              request_number: r.request_number,
              requester_name: r.requester_name || r.requester?.name || "Unknown",
              days_pending: daysPending,
              priority,
            };
          });

          // Sort by days pending (oldest first)
          pendingList.sort((a: PendingRequest, b: PendingRequest) => b.days_pending - a.days_pending);
          setRequests(pendingList);

          // Calculate stats
          const urgent = pendingList.filter((r: PendingRequest) => r.priority === "urgent").length;
          const high = pendingList.filter((r: PendingRequest) => r.priority === "high").length;
          const medium = pendingList.filter((r: PendingRequest) => r.priority === "medium").length;
          const low = pendingList.filter((r: PendingRequest) => r.priority === "low").length;
          setStats({ urgent, high, medium, low });
        }
      }
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          icon: <Flame className="h-4 w-4" />,
          label: "Urgent",
        };
      case "high":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-200",
          icon: <AlertTriangle className="h-4 w-4" />,
          label: "High",
        };
      case "medium":
        return {
          color: "text-amber-600",
          bgColor: "bg-amber-100",
          borderColor: "border-amber-200",
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Medium",
        };
      default:
        return {
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Normal",
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">All Caught Up!</h3>
            <p className="text-sm text-gray-500">No pending requests</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pending Requests</h3>
              <p className="text-white/70 text-sm">{requests.length} awaiting action</p>
            </div>
          </div>
          {stats.urgent > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 animate-pulse">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-bold">{stats.urgent} urgent</span>
            </div>
          )}
        </div>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 border-b border-gray-100">
        {[
          { key: "urgent", label: "Urgent", count: stats.urgent, color: "text-red-600" },
          { key: "high", label: "High", count: stats.high, color: "text-orange-600" },
          { key: "medium", label: "Medium", count: stats.medium, color: "text-amber-600" },
          { key: "low", label: "Normal", count: stats.low, color: "text-green-600" },
        ].map((item) => (
          <div key={item.key} className="text-center">
            <span className={`text-xl font-bold ${item.color}`}>{item.count}</span>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Request List */}
      <div className="p-4">
        <div className="space-y-2">
          {requests.slice(0, maxItems).map((request, index) => {
            const config = getPriorityConfig(request.priority || "low");
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onRequestClick?.(request)}
                className={`flex items-center gap-3 p-3 rounded-xl border ${config.borderColor} hover:shadow-sm transition-all ${
                  onRequestClick ? "cursor-pointer" : ""
                }`}
              >
                {/* Priority Icon */}
                <div className={`h-10 w-10 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center`}>
                  {config.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {request.request_number || request.id.slice(0, 8)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${config.bgColor} ${config.color}`}>
                      {request.days_pending}d
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {request.requester_name || "Unknown"} • {request.purpose?.slice(0, 30) || "No purpose"}...
                  </p>
                </div>

                {onRequestClick && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </motion.div>
            );
          })}
        </div>

        {requests.length > maxItems && (
          <a 
            href={role ? `/${role}/inbox` : "/admin/inbox"} 
            className="w-full mt-3 py-2 text-sm text-[#7a0019] hover:text-[#5a0010] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
          >
            View all {requests.length} pending
            <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
