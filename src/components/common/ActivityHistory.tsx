"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Send, 
  Edit, 
  Eye, 
  Truck,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  History
} from "lucide-react";

interface ActivityItem {
  id: string;
  request_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  previous_status: string;
  new_status: string;
  comments: string;
  metadata: any;
  created_at: string;
  is_own_action?: boolean;
  request?: {
    id: string;
    request_number: string;
    purpose: string;
    requester?: {
      id: string;
      name: string;
      email: string;
    };
  };
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityHistoryProps {
  showFilters?: boolean;
  limit?: number;
  compact?: boolean;
  hideHeader?: boolean;
  onActivityClick?: (requestId: string) => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  approved: <CheckCircle className="h-4 w-4 text-green-600" />,
  rejected: <XCircle className="h-4 w-4 text-red-600" />,
  returned: <RotateCcw className="h-4 w-4 text-amber-600" />,
  resubmitted: <Send className="h-4 w-4 text-blue-600" />,
  submitted: <Send className="h-4 w-4 text-blue-600" />,
  budget_modified: <Edit className="h-4 w-4 text-purple-600" />,
  viewed: <Eye className="h-4 w-4 text-gray-600" />,
  assigned: <Truck className="h-4 w-4 text-teal-600" />,
  signed: <CheckCircle className="h-4 w-4 text-green-600" />,
};

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved",
  admin_approved: "Admin Approved",
  rejected: "Rejected",
  returned: "Returned",
  resubmitted: "Resubmitted",
  submitted: "Submitted",
  created: "Created",
  budget_modified: "Budget Modified",
  viewed: "Viewed",
  assigned: "Assigned",
  signed: "Signed",
  admin_edited: "Request Updated",
  edited: "Request Updated",
};

// User-friendly field name mappings
const FIELD_LABELS: Record<string, string> = {
  purpose: "Purpose",
  destination: "Destination",
  travel_start_date: "Travel Start Date",
  travel_end_date: "Travel End Date",
  total_budget: "Total Budget",
  expense_breakdown: "Expense Breakdown",
  transportation_type: "Transportation Type",
  pickup_location: "Pickup Location",
  pickup_time: "Pickup Time",
  pickup_contact_number: "Contact Number",
  pickup_special_instructions: "Special Instructions",
  admin_notes: "Admin Notes",
};

// User-friendly role labels
const ROLE_LABELS: Record<string, string> = {
  admin: "Transportation Management",
  head: "Department Head",
  comptroller: "Comptroller",
  hr: "HR Officer",
  vp: "Vice President",
  president: "President",
  exec: "Executive",
  user: "Requester",
  requester: "Requester",
};

// Helper function to format field names
function formatFieldName(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format role names
function formatRoleName(role: string): string {
  return ROLE_LABELS[role?.toLowerCase()] || role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

// Helper function to format comments for display
function formatActivityComments(activity: ActivityItem): string | null {
  const { action, comments, metadata } = activity;
  
  // Handle admin_edited action
  if (action === 'admin_edited' || action === 'edited') {
    if (metadata?.edited_fields && Array.isArray(metadata.edited_fields)) {
      const friendlyFields = metadata.edited_fields
        .filter((f: string) => f !== 'updated_at')
        .map((f: string) => formatFieldName(f));
      
      if (friendlyFields.length > 0) {
        if (friendlyFields.length <= 3) {
          return `Updated: ${friendlyFields.join(', ')}`;
        } else {
          return `Updated ${friendlyFields.length} fields including ${friendlyFields.slice(0, 2).join(', ')}`;
        }
      }
    }
    // Parse from comments if metadata not available
    if (comments?.includes('edited request fields:')) {
      const fieldsMatch = comments.match(/edited request fields:\s*(.+)/i);
      if (fieldsMatch) {
        const fields = fieldsMatch[1].split(',').map(f => formatFieldName(f.trim()));
        if (fields.length <= 3) {
          return `Updated: ${fields.join(', ')}`;
        } else {
          return `Updated ${fields.length} fields including ${fields.slice(0, 2).join(', ')}`;
        }
      }
    }
    return 'Request details were updated';
  }
  
  // Handle budget_modified
  if (action === 'budget_modified') {
    if (metadata?.original_budget !== undefined && metadata?.new_budget !== undefined) {
      const oldBudget = parseFloat(metadata.original_budget).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      const newBudget = parseFloat(metadata.new_budget).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      return `Budget: ₱${oldBudget} → ₱${newBudget}`;
    }
  }
  
  // Handle approved action
  if (action === 'approved' || action === 'admin_approved') {
    const sentTo = metadata?.sent_to;
    if (sentTo) {
      return `Forwarded to ${formatRoleName(sentTo)}`;
    }
  }
  
  return comments || null;
}

export default function ActivityHistory({ 
  showFilters = true, 
  limit = 20,
  compact = false,
  hideHeader = false,
  onActivityClick
}: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (actionFilter) {
        params.set("action_type", actionFilter);
      }

      const res = await fetch(`/api/activity?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      
      if (data.ok) {
        setActivities(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [offset, actionFilter, limit]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const actionTypes = ["approved", "rejected", "returned", "resubmitted", "submitted", "budget_modified", "signed"];

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <History className="h-4 w-4" />
        <span>Show Activity History</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className={hideHeader ? "" : "bg-white rounded-lg border border-gray-200 shadow-sm"}>
      {/* Header */}
      {!hideHeader && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Activity History</h3>
            {total > 0 && (
              <span className="text-xs text-gray-500">({total} total)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showFilters && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>{actionFilter ? ACTION_LABELS[actionFilter] : "All"}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => { setActionFilter(""); setShowFilterDropdown(false); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!actionFilter ? "bg-gray-100" : ""}`}
                    >
                      All Actions
                    </button>
                    {actionTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => { setActionFilter(type); setShowFilterDropdown(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${actionFilter === type ? "bg-gray-100" : ""}`}
                      >
                        {ACTION_ICONS[type]}
                        {ACTION_LABELS[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {compact && (
              <button
                onClick={() => setExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronUp className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <History className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                onClick={() => activity.request_id && onActivityClick?.(activity.request_id)}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${onActivityClick ? "cursor-pointer group" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {ACTION_ICONS[activity.action] || <Clock className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {ACTION_LABELS[activity.action] || activity.action}
                      </span>
                      {activity.is_own_action ? (
                        <span className="text-xs text-gray-500">
                          by you as {formatRoleName(activity.actor_role)}
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600">
                          by {activity.actor?.name || formatRoleName(activity.actor_role)}
                        </span>
                      )}
                    </div>
                    {activity.request && (
                      <p className={`text-xs text-gray-600 mt-0.5 ${onActivityClick ? "group-hover:text-[#7A0010]" : ""}`}>
                        Request: {activity.request.request_number || activity.request_id.slice(0, 8)}
                        {activity.request.purpose && (
                          <span className="text-gray-400"> - {activity.request.purpose.slice(0, 50)}...</span>
                        )}
                      </p>
                    )}
                    {(() => {
                      const formattedComments = formatActivityComments(activity);
                      return formattedComments ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {formattedComments}
                        </p>
                      ) : null;
                    })()}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(activity.created_at)} • {formatDate(activity.created_at)}
                      </p>
                      {onActivityClick && (
                        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          View Summary
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            {offset + 1} - {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
