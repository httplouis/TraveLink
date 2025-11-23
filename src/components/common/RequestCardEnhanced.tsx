"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Banknote, 
  User, 
  FileText, 
  Eye, 
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Printer
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import PersonDisplay from "./PersonDisplay";
import { formatLongDate } from "@/lib/datetime";

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

interface RequestCardEnhancedProps {
  request: {
    id: string;
    request_number: string;
    file_code?: string;
    title?: string;
    purpose?: string;
    destination?: string;
    travel_start_date?: string;
    travel_end_date?: string;
    status: string;
    created_at?: string;
    comptroller_approved_at?: string;
    total_budget?: number;
    comptroller_edited_budget?: number;
    request_type?: 'travel_order' | 'seminar';
    requester_name?: string;
    requester?: {
      id?: string;
      name?: string;
      email?: string;
      profile_picture?: string;
      department?: string;
      position?: string;
    };
    department?: {
      name?: string;
      code?: string;
    };
    submitted_by_name?: string;
    is_representative?: boolean;
    requester_signed_at?: string;
    requester_signature?: string;
  };
  showActions?: boolean;
  onView?: () => void;
  onTrack?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function RequestCardEnhanced({
  request,
  showActions = true,
  onView,
  onTrack,
  onApprove,
  onReject,
  onDownload,
  onPrint,
  variant = 'default',
  className = "",
}: RequestCardEnhancedProps) {
  const requesterName = request.requester_name || request.requester?.name || "Unknown";
  const requesterEmail = request.requester?.email;
  const departmentName = request.department?.name || request.department?.code || "No Department";
  const purpose = request.purpose || request.title || "No purpose specified";
  const destination = request.destination || "—";
  const startDate = request.travel_start_date;
  const endDate = request.travel_end_date;
  const isSeminar = request.request_type === 'seminar';
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';

  // Format date range
  const formatDateRange = () => {
    if (!startDate) return "—";
    if (startDate && endDate && startDate !== endDate) {
      return `${formatLongDate(startDate)} - ${formatLongDate(endDate)}`;
    }
    return formatLongDate(startDate);
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isApproved) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (isRejected) return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-amber-600" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`
        bg-white rounded-xl border-2 border-gray-200 
        hover:border-[#7A0010]/40 hover:shadow-lg
        transition-all duration-200 overflow-hidden
        ${className}
      `}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-6 py-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-mono font-bold text-lg">{request.request_number}</span>
              </div>
              <StatusBadge status={request.status} variant="light" size="sm" />
              {request.file_code && (
                <div className="px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm border border-white/30">
                  <span className="text-xs font-mono font-semibold">{request.file_code}</span>
                </div>
              )}
              {isSeminar && (
                <div className="px-2 py-1 rounded-md bg-blue-500/80 backdrop-blur-sm border border-blue-300/50">
                  <span className="text-xs font-semibold flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Seminar
                  </span>
                </div>
              )}
            </div>
            {request.is_representative && request.submitted_by_name && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-md">
                  Submitted by: <span className="font-semibold">{request.submitted_by_name}</span>
                </span>
              </div>
            )}
          </div>
          {request.comptroller_approved_at && (
            <div className="text-xs text-white/80 ml-4 text-right">
              <div className="font-medium">Received</div>
              <div>{new Date(request.comptroller_approved_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Manila'
              })}</div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Purpose/Title */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
            {purpose}
          </h3>
        </div>

        {/* Requester Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <PersonDisplay
            name={requesterName}
            email={requesterEmail}
            profilePicture={request.requester?.profile_picture || null}
            size="sm"
            showEmail={false}
            position={request.requester?.position}
            department={request.requester?.department || request.department?.name}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">{departmentName}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Destination */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                Destination
              </div>
              <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                {destination}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <Calendar className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
                {isSeminar ? 'Seminar Dates' : 'Travel Dates'}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDateRange()}
              </div>
            </div>
          </div>

          {/* Budget */}
          {(() => {
            const displayBudget = request.comptroller_edited_budget || request.total_budget;
            // Convert to number if it's a string, and ensure it's greater than 0
            const budgetValue = typeof displayBudget === 'string' 
              ? parseFloat(displayBudget) 
              : (displayBudget || 0);
            
            // Show budget section regardless, but with different content based on value
            return (
              <div className={`flex items-start gap-3 p-3 rounded-lg border md:col-span-2 ${
                budgetValue && budgetValue > 0 && !isNaN(budgetValue)
                  ? 'bg-green-50 border-green-100'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <Banknote className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  budgetValue && budgetValue > 0 && !isNaN(budgetValue)
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                    budgetValue && budgetValue > 0 && !isNaN(budgetValue)
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`}>
                    {budgetValue && budgetValue > 0 && !isNaN(budgetValue) ? 'Total Budget' : 'Budget'}
                  </div>
                  {budgetValue && budgetValue > 0 && !isNaN(budgetValue) ? (
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(budgetValue)}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-gray-500 italic">
                      No budget proposal
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Signature Status (for inbox) */}
        {request.requester_signature && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Signed {request.requester_signed_at 
                ? `on ${new Date(request.requester_signed_at).toLocaleDateString()}`
                : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A0010] text-white text-sm font-semibold hover:bg-[#69000d] transition-colors"
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
            )}
            {onTrack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTrack();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Track
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isApproved && onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="p-2 text-gray-600 hover:text-[#7A0010] hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onPrint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint();
                }}
                className="p-2 text-gray-600 hover:text-[#7A0010] hover:bg-gray-100 rounded-lg transition-colors"
                title="Print"
              >
                <Printer className="h-4 w-4" />
              </button>
            )}
            {onApprove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

