"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  XCircle,
  User,
  UserCheck,
  Building2,
  Wallet,
  Shield,
  Crown,
  Truck,
  ArrowRight,
} from "lucide-react";

interface RequestStatusTrackerProps {
  request: {
    id: string;
    status: string;
    request_number?: string;
    purpose?: string;
    created_at?: string;
    submitted_at?: string;
    head_approved_at?: string;
    admin_processed_at?: string;
    comptroller_approved_at?: string;
    hr_approved_at?: string;
    vp_approved_at?: string;
    president_approved_at?: string;
    rejected_at?: string;
    returned_at?: string;
    vehicle_assigned_at?: string;
    completed_at?: string;
    requires_head_approval?: boolean;
    requires_vp_approval?: boolean;
    requires_president_approval?: boolean;
  };
  compact?: boolean;
}

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending" | "skipped" | "rejected";
  timestamp?: string;
  description?: string;
}

export default function RequestStatusTracker({ request, compact = false }: RequestStatusTrackerProps) {
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    // Guard against undefined request
    if (!request) return;

    const buildSteps = () => {
      const s: Step[] = [];
      const status = request.status?.toLowerCase() || "";

      // Step 1: Submitted
      s.push({
        id: "submitted",
        label: "Submitted",
        icon: <User className="h-4 w-4" />,
        status: request.submitted_at ? "completed" : status === "draft" ? "current" : "pending",
        timestamp: request.submitted_at,
        description: "Request submitted for approval",
      });

      // Step 2: Head Endorsement (if required)
      if (request.requires_head_approval !== false) {
        s.push({
          id: "head",
          label: "Head Endorsed",
          icon: <UserCheck className="h-4 w-4" />,
          status: request.head_approved_at
            ? "completed"
            : status === "pending_head" || status === "submitted"
            ? "current"
            : status === "rejected" || status === "returned"
            ? "rejected"
            : "pending",
          timestamp: request.head_approved_at,
          description: "Department head endorsement",
        });
      }

      // Step 3: Admin Processing
      s.push({
        id: "admin",
        label: "Admin Processed",
        icon: <Building2 className="h-4 w-4" />,
        status: request.admin_processed_at
          ? "completed"
          : status === "pending_admin" || status === "head_approved"
          ? "current"
          : "pending",
        timestamp: request.admin_processed_at,
        description: "Admin verification & scheduling",
      });

      // Step 4: Comptroller Budget Review
      s.push({
        id: "comptroller",
        label: "Budget Approved",
        icon: <Wallet className="h-4 w-4" />,
        status: request.comptroller_approved_at
          ? "completed"
          : status === "pending_comptroller" || status === "admin_processed"
          ? "current"
          : "pending",
        timestamp: request.comptroller_approved_at,
        description: "Budget review & approval",
      });

      // Step 5: HR Approval
      s.push({
        id: "hr",
        label: "HR Approved",
        icon: <Shield className="h-4 w-4" />,
        status: request.hr_approved_at
          ? "completed"
          : status === "pending_hr" || status === "comptroller_approved"
          ? "current"
          : "pending",
        timestamp: request.hr_approved_at,
        description: "HR compliance check",
      });

      // Step 6: VP Approval (if required)
      if (request.requires_vp_approval !== false) {
        s.push({
          id: "vp",
          label: "VP Approved",
          icon: <Crown className="h-4 w-4" />,
          status: request.vp_approved_at
            ? "completed"
            : status === "pending_vp" || status === "hr_approved"
            ? "current"
            : "pending",
          timestamp: request.vp_approved_at,
          description: "Vice President approval",
        });
      }

      // Step 7: President Approval (if required)
      if (request.requires_president_approval) {
        s.push({
          id: "president",
          label: "President Approved",
          icon: <Crown className="h-4 w-4" />,
          status: request.president_approved_at
            ? "completed"
            : status === "pending_president"
            ? "current"
            : "pending",
          timestamp: request.president_approved_at,
          description: "President final approval",
        });
      }

      // Step 8: Vehicle Assigned
      s.push({
        id: "assigned",
        label: "Vehicle Assigned",
        icon: <Truck className="h-4 w-4" />,
        status: request.vehicle_assigned_at
          ? "completed"
          : status === "approved" || status === "vp_approved" || status === "president_approved"
          ? "current"
          : "pending",
        timestamp: request.vehicle_assigned_at,
        description: "Vehicle & driver assigned",
      });

      // Step 9: Completed
      s.push({
        id: "completed",
        label: "Completed",
        icon: <CheckCircle className="h-4 w-4" />,
        status: request.completed_at || status === "completed"
          ? "completed"
          : status === "assigned"
          ? "current"
          : "pending",
        timestamp: request.completed_at,
        description: "Trip completed",
      });

      // Handle rejected/returned status
      if (status === "rejected" || status === "returned") {
        const lastCompletedIndex = s.findLastIndex((step) => step.status === "completed");
        if (lastCompletedIndex >= 0 && lastCompletedIndex < s.length - 1) {
          s[lastCompletedIndex + 1].status = "rejected";
        }
      }

      setSteps(s);
    };

    buildSteps();
  }, [request]);

  const getStatusColor = (status: Step["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "current":
        return "bg-blue-500 text-white border-blue-500 animate-pulse";
      case "rejected":
        return "bg-red-500 text-white border-red-500";
      case "skipped":
        return "bg-gray-300 text-gray-500 border-gray-300";
      default:
        return "bg-white text-gray-400 border-gray-300";
    }
  };

  const getLineColor = (status: Step["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-blue-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Guard against undefined request
  if (!request) {
    return null;
  }

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-center h-6 w-6 rounded-full border-2 ${getStatusColor(step.status)}`}
              title={`${step.label}${step.timestamp ? ` - ${formatTime(step.timestamp)}` : ""}`}
            >
              {step.status === "rejected" ? (
                <XCircle className="h-3 w-3" />
              ) : step.status === "completed" ? (
                <CheckCircle className="h-3 w-3" />
              ) : step.status === "current" ? (
                <Clock className="h-3 w-3" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </motion.div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-4 ${getLineColor(step.status)}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Full vertical view
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Request Progress</h3>
          <p className="text-xs text-gray-500">{request.request_number || request.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="relative">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 pb-4 last:pb-0"
          >
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ${getStatusColor(step.status)} transition-all`}
              >
                {step.status === "rejected" ? (
                  <XCircle className="h-4 w-4" />
                ) : step.status === "completed" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : step.status === "current" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[20px] ${getLineColor(step.status)}`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium text-sm ${
                    step.status === "completed"
                      ? "text-green-700"
                      : step.status === "current"
                      ? "text-blue-700"
                      : step.status === "rejected"
                      ? "text-red-700"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="text-xs text-gray-500">{formatTime(step.timestamp)}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Badge */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Current Status</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              request.status === "completed"
                ? "bg-green-100 text-green-700"
                : request.status === "rejected"
                ? "bg-red-100 text-red-700"
                : request.status === "returned"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {request.status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
          </span>
        </div>
      </div>
    </div>
  );
}
