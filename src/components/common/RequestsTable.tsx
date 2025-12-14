"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Eye, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Download,
  ChevronUp,
  ChevronDown,
  Zap
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatLongDate } from "@/lib/datetime";
import { downloadRequestPDF } from "@/lib/utils/pdf-download";

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Check if requester is a head/executive (urgent detection)
const isUrgentRequester = (request: any): boolean => {
  const position = request.requester?.position?.toLowerCase() || "";
  const name = request.requester?.name?.toLowerCase() || request.requester_name?.toLowerCase() || "";
  
  // Check position titles that indicate head/executive
  const urgentPositions = [
    "head", "dean", "director", "chair", "chief", 
    "president", "vice president", "vp", "executive",
    "comptroller", "hr", "registrar"
  ];
  
  return urgentPositions.some(pos => position.includes(pos));
};

// Check if travel date is soon (within 3 days)
const isTravelSoon = (travelDate: string | undefined): boolean => {
  if (!travelDate) return false;
  const travel = new Date(travelDate);
  const now = new Date();
  const diffDays = Math.ceil((travel.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};

type SortField = "request_number" | "requester" | "destination" | "travel_date" | "budget" | "created_at" | "status";
type SortDirection = "asc" | "desc";

interface RequestsTableProps {
  requests: any[];
  onView: (request: any) => void;
  onDownload?: (request: any) => void;
  showBudget?: boolean;
  showDepartment?: boolean;
  emptyMessage?: string;
}

export default function RequestsTable({
  requests,
  onView,
  onDownload,
  showBudget = true,
  showDepartment = true,
  emptyMessage = "No requests found",
}: RequestsTableProps) {
  const [sortField, setSortField] = React.useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRequests = React.useMemo(() => {
    return [...requests].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "request_number":
          aVal = a.request_number || "";
          bVal = b.request_number || "";
          break;
        case "requester":
          aVal = a.requester?.name || a.requester_name || "";
          bVal = b.requester?.name || b.requester_name || "";
          break;
        case "destination":
          aVal = a.destination || "";
          bVal = b.destination || "";
          break;
        case "travel_date":
          aVal = new Date(a.travel_start_date || 0).getTime();
          bVal = new Date(b.travel_start_date || 0).getTime();
          break;
        case "budget":
          aVal = a.comptroller_edited_budget || a.total_budget || 0;
          bVal = b.comptroller_edited_budget || b.total_budget || 0;
          break;
        case "created_at":
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [requests, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />;
  };

  const ThButton = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:text-[#7A0010] transition-colors ${className}`}
    >
      {children}
      <SortIcon field={field} />
    </button>
  );

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <ThButton field="request_number">Request #</ThButton>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <ThButton field="requester">Requester</ThButton>
              </th>
              {showDepartment && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden lg:table-cell">
                  Department
                </th>
              )}
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <ThButton field="destination">Destination</ThButton>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                <ThButton field="travel_date">Travel Date</ThButton>
              </th>
              {showBudget && (
                <th className="px-4 py-3 text-right font-semibold text-gray-700 hidden md:table-cell">
                  <ThButton field="budget" className="justify-end">Budget</ThButton>
                </th>
              )}
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                <ThButton field="status" className="justify-center">Status</ThButton>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRequests.map((req, index) => {
              const isUrgent = isUrgentRequester(req);
              const travelSoon = isTravelSoon(req.travel_start_date);
              const budget = req.comptroller_edited_budget || req.total_budget || 0;
              
              return (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`hover:bg-gray-50 transition-colors ${
                    isUrgent ? "bg-red-50/50" : travelSoon ? "bg-amber-50/50" : ""
                  }`}
                >
                  {/* Request Number */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold" title="Head/Executive Request">
                          <Zap className="h-3 w-3" />
                          URGENT
                        </span>
                      )}
                      {travelSoon && !isUrgent && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium" title="Travel date is soon">
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                      )}
                      <span className="font-mono font-semibold text-gray-900">
                        {req.request_number || "—"}
                      </span>
                    </div>
                  </td>
                  
                  {/* Requester */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 truncate max-w-[150px]">
                        {req.requester?.name || req.requester_name || "Unknown"}
                      </span>
                      {req.requester?.position && (
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {req.requester.position}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Department */}
                  {showDepartment && (
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600 truncate max-w-[120px] block">
                        {req.department?.name || req.department?.code || "—"}
                      </span>
                    </td>
                  )}
                  
                  {/* Destination */}
                  <td className="px-4 py-3">
                    <span className="text-gray-900 truncate max-w-[150px] block">
                      {req.destination || "—"}
                    </span>
                  </td>
                  
                  {/* Travel Date */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className={`text-sm ${travelSoon ? "text-amber-700 font-semibold" : "text-gray-900"}`}>
                        {req.travel_start_date ? formatLongDate(req.travel_start_date) : "—"}
                      </span>
                      {req.travel_end_date && req.travel_end_date !== req.travel_start_date && (
                        <span className="text-xs text-gray-500">
                          to {formatLongDate(req.travel_end_date)}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Budget */}
                  {showBudget && (
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {budget > 0 ? (
                        <span className="font-semibold text-green-700">
                          {formatCurrency(budget)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No budget</span>
                      )}
                    </td>
                  )}
                  
                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(req)}
                        className="p-2 text-[#7A0010] hover:bg-[#7A0010]/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (onDownload) {
                            onDownload(req);
                          } else {
                            downloadRequestPDF(req.id, req.request_number);
                          }
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
        <span>Showing {sortedRequests.length} request{sortedRequests.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
              <Zap className="h-3 w-3" />
            </span>
            <span className="text-xs">Head/Exec Request</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
              <AlertTriangle className="h-3 w-3" />
            </span>
            <span className="text-xs">Travel Soon</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
