"use client";
import * as React from "react";
import { format } from "date-fns";
import { 
  calculatePendingDays, 
  isPendingLongTime, 
  getUrgencyBadge, 
  getInternationalBadge,
  calculateDaysUntilTravel 
} from "@/lib/utils/request-utils";
import type { RequestForCalculation } from "@/lib/utils/request-utils";
import { Eye, Clock, AlertCircle } from "lucide-react";

interface Request extends RequestForCalculation {
  request_number?: string;
  title?: string;
  purpose?: string;
  destination?: string;
  requester?: {
    name?: string;
    email?: string;
  };
  requester_name?: string;
  department?: {
    name?: string;
    code?: string;
  };
  total_budget?: number;
}

interface Props {
  requests: Request[];
  onView: (request: Request) => void;
}

export default function InboxTable({ requests, onView }: Props) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "₱0.00";
    return `₱${Number(amount).toLocaleString("en-PH", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      returned: { label: "Returned", color: "bg-amber-100 text-amber-800" },
      pending_head: { label: "Pending Head", color: "bg-blue-100 text-blue-800" },
      pending_admin: { label: "Pending Admin", color: "bg-purple-100 text-purple-800" },
      pending_comptroller: { label: "Pending Comptroller", color: "bg-indigo-100 text-indigo-800" },
      pending_hr: { label: "Pending HR", color: "bg-pink-100 text-pink-800" },
      pending_exec: { label: "Pending Executive", color: "bg-orange-100 text-orange-800" },
      approved: { label: "Approved", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No requests found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Request #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Title / Purpose
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Requester
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Destination
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Travel Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Budget
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Urgency
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => {
            const urgencyBadge = getUrgencyBadge(request);
            const intlBadge = getInternationalBadge(request);
            const daysUntil = calculateDaysUntilTravel(request);
            const pendingDays = calculatePendingDays(request);

            return (
              <tr
                key={request.id}
                className={`hover:bg-gray-50 transition-colors ${
                  request.is_urgent || (daysUntil !== null && daysUntil < 14 && daysUntil >= 0)
                    ? "bg-red-50/30"
                    : isPendingLongTime(request)
                    ? "bg-yellow-50/30"
                    : ""
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {request.request_number || `#${request.id.slice(0, 8)}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={request.title || request.purpose}>
                    {request.title || request.purpose || "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {request.requester?.name || request.requester_name || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-xs" title={request.destination}>
                      {request.destination || "—"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${intlBadge.color}`}>
                      {intlBadge.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex flex-col">
                    <span>{formatDate(request.travel_start_date)}</span>
                    {request.travel_end_date && request.travel_end_date !== request.travel_start_date && (
                      <span className="text-xs text-gray-500">
                        to {formatDate(request.travel_end_date)}
                      </span>
                    )}
                    {daysUntil !== null && daysUntil < 14 && daysUntil >= 0 && (
                      <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {daysUntil} day{daysUntil !== 1 ? "s" : ""} left
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatCurrency(request.total_budget)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${urgencyBadge.color}`}>
                    {urgencyBadge.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {isPendingLongTime(request) && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{pendingDays} day{pendingDays !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => onView(request)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#7a1f2a] text-white rounded hover:bg-[#5c000c] transition-colors text-xs font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

