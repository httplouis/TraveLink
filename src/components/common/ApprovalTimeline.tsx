"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit,
  Send,
  FileText,
  Truck,
  DollarSign,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  action: string;
  actor_name?: string;
  actor_role?: string;
  timestamp: string;
  comments?: string;
  status_from?: string;
  status_to?: string;
  metadata?: any;
}

interface ApprovalTimelineProps {
  requestId: string;
  events?: TimelineEvent[];
  maxItems?: number;
  showAll?: boolean;
}

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
  dropoff_location: "Drop-off Location",
  dropoff_time: "Drop-off Time",
  cost_justification: "Cost Justification",
  preferred_vehicle_id: "Preferred Vehicle",
  preferred_driver_id: "Preferred Driver",
  preferred_vehicle_note: "Vehicle Notes",
  preferred_driver_note: "Driver Notes",
  assigned_vehicle_id: "Assigned Vehicle",
  assigned_driver_id: "Assigned Driver",
  admin_notes: "Admin Notes",
  requester_name: "Requester Name",
  requester_contact_number: "Requester Contact",
  participants: "Participants",
  head_included: "Head Included",
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
  faculty: "Faculty",
  system: "System",
};

// User-friendly action labels with descriptions
const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string; description?: string }> = {
  created: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Request Created",
    description: "Travel order request was created",
  },
  submitted: {
    icon: <Send className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Submitted",
    description: "Request submitted for approval",
  },
  approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Approved",
    description: "Request approved and forwarded",
  },
  admin_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Transportation Management Approved",
    description: "Approved by Transportation Management",
  },
  rejected: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Rejected",
    description: "Request was rejected",
  },
  returned: {
    icon: <RotateCcw className="h-4 w-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Returned",
    description: "Request returned for revision",
  },
  resubmitted: {
    icon: <Send className="h-4 w-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    label: "Resubmitted",
    description: "Request resubmitted after revision",
  },
  signed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Signed",
    description: "Digital signature added",
  },
  budget_modified: {
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Budget Modified",
    description: "Budget amount was adjusted",
  },
  assigned: {
    icon: <Truck className="h-4 w-4" />,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    label: "Driver/Vehicle Assigned",
    description: "Driver and vehicle assigned",
  },
  admin_edited: {
    icon: <Edit className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Request Updated",
    description: "Request details were updated",
  },
  edited: {
    icon: <Edit className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Request Updated",
    description: "Request details were updated",
  },
};

// Helper function to format field names to user-friendly labels
function formatFieldName(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format role names
function formatRoleName(role: string): string {
  return ROLE_LABELS[role?.toLowerCase()] || role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
}

// Helper function to generate user-friendly comments
function formatComments(event: TimelineEvent): string | null {
  const { action, comments, metadata } = event;
  
  // Handle admin_edited action with user-friendly field names
  if (action === 'admin_edited' || action === 'edited') {
    if (metadata?.edited_fields && Array.isArray(metadata.edited_fields)) {
      const friendlyFields = metadata.edited_fields
        .filter((f: string) => f !== 'updated_at')
        .map((f: string) => formatFieldName(f));
      
      if (friendlyFields.length > 0) {
        if (friendlyFields.length <= 3) {
          return `Updated: ${friendlyFields.join(', ')}`;
        } else {
          return `Updated ${friendlyFields.length} fields: ${friendlyFields.slice(0, 3).join(', ')} and ${friendlyFields.length - 3} more`;
        }
      }
    }
    // Fallback: parse from comments if metadata not available
    if (comments?.includes('edited request fields:')) {
      const fieldsMatch = comments.match(/edited request fields:\s*(.+)/i);
      if (fieldsMatch) {
        const fields = fieldsMatch[1].split(',').map(f => formatFieldName(f.trim()));
        if (fields.length <= 3) {
          return `Updated: ${fields.join(', ')}`;
        } else {
          return `Updated ${fields.length} fields: ${fields.slice(0, 3).join(', ')} and ${fields.length - 3} more`;
        }
      }
    }
    return 'Request details were updated';
  }
  
  // Handle budget_modified action
  if (action === 'budget_modified') {
    if (metadata?.original_budget !== undefined && metadata?.new_budget !== undefined) {
      const oldBudget = parseFloat(metadata.original_budget).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      const newBudget = parseFloat(metadata.new_budget).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      return `Budget changed from ₱${oldBudget} to ₱${newBudget}`;
    }
    return comments || 'Budget was modified';
  }
  
  // Handle approved action
  if (action === 'approved' || action === 'admin_approved') {
    const sentTo = metadata?.sent_to;
    if (sentTo) {
      return `Approved and forwarded to ${formatRoleName(sentTo)}`;
    }
    return comments || 'Request approved';
  }
  
  // Handle rejected action
  if (action === 'rejected') {
    if (metadata?.rejection_reason) {
      return `Reason: ${metadata.rejection_reason}`;
    }
    return comments || 'Request was rejected';
  }
  
  // Handle returned action
  if (action === 'returned') {
    if (metadata?.return_reason) {
      return `Reason: ${metadata.return_reason}`;
    }
    return comments || 'Request returned for revision';
  }
  
  // Handle created action
  if (action === 'created') {
    return 'Travel order request was created and submitted';
  }
  
  // Handle submitted action
  if (action === 'submitted' || action === 'resubmitted') {
    return comments || 'Request submitted for approval';
  }
  
  // Handle assigned action
  if (action === 'assigned') {
    if (metadata?.driver_assigned || metadata?.vehicle_assigned) {
      const parts = [];
      if (metadata.driver_assigned) parts.push('Driver');
      if (metadata.vehicle_assigned) parts.push('Vehicle');
      return `${parts.join(' and ')} assigned to this request`;
    }
    return comments || 'Driver/Vehicle assigned';
  }
  
  // Default: return original comments or null
  return comments || null;
}

export default function ApprovalTimeline({
  requestId,
  events: initialEvents,
  maxItems = 5,
  showAll = false,
}: ApprovalTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState(!initialEvents);
  const [expanded, setExpanded] = useState(showAll);

  useEffect(() => {
    if (!initialEvents && requestId) {
      loadEvents();
    }
  }, [requestId, initialEvents]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}/history`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setEvents(data.data || []);
        }
      }
    } catch (error) {
      console.error("Failed to load timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getConfig = (action: string) => {
    return (
      ACTION_CONFIG[action.toLowerCase()] || {
        icon: <Clock className="h-4 w-4" />,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: null,
      }
    );
  };

  // Get user-friendly description for the event
  const getEventDescription = (event: TimelineEvent) => {
    const config = getConfig(event.action);
    const formattedComments = formatComments(event);
    
    // If we have formatted comments, use them
    if (formattedComments) {
      return formattedComments;
    }
    
    // Otherwise use the config description
    return config.description || null;
  };

  const displayEvents = expanded ? events : events.slice(0, maxItems);
  const hasMore = events.length > maxItems;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Approval Timeline</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">Approval Timeline</span>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-gray-900">Approval Timeline</span>
            <span className="text-xs text-gray-500 ml-2">({events.length} events)</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <AnimatePresence>
            {displayEvents.map((event, index) => {
              const config = getConfig(event.action);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex gap-4 pb-4 last:pb-0"
                >
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${config.bgColor} ${config.color} ring-4 ring-white`}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                        {event.actor_role && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {formatRoleName(event.actor_role)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap" title={formatFullDate(event.timestamp)}>
                        {formatTime(event.timestamp)}
                      </span>
                    </div>

                    {event.actor_name && (
                      <p className="text-sm text-gray-600 mt-0.5">by {event.actor_name}</p>
                    )}

                    {/* User-friendly description */}
                    {(() => {
                      const description = getEventDescription(event);
                      return description ? (
                        <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <p className="text-xs text-gray-600 line-clamp-3">{description}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more/less button */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {events.length - maxItems} more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
