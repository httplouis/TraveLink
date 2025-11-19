"use client";

import React from "react";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export type RequestStatus = 
  | "pending_head"
  | "pending_admin"
  | "pending_comptroller"
  | "pending_hr"
  | "pending_exec"
  | "approved"
  | "rejected"
  | "cancelled"
  | "draft";

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "default" | "light";
}

const STATUS_CONFIG = {
  // Pending statuses
  pending_head: {
    label: "Pending Head",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  pending_admin: {
    label: "Pending Admin",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  pending_comptroller: {
    label: "Pending Comptroller",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  pending_hr: {
    label: "Pending HR",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  pending_exec: {
    label: "Pending Executive",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  
  // Final statuses
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
  draft: {
    label: "Draft",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
} as const;

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
  lg: "px-4 py-1.5 text-sm",
};

export default function StatusBadge({ 
  status, 
  size = "md",
  showIcon = true,
  variant = "default"
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  // Light variant for use on dark backgrounds
  const lightColors: Record<string, string> = {
    "bg-yellow-100 text-yellow-800 border-yellow-200": "bg-yellow-400/20 text-yellow-200 border-yellow-300/30",
    "bg-green-100 text-green-800 border-green-200": "bg-green-400/20 text-green-200 border-green-300/30",
    "bg-red-100 text-red-800 border-red-200": "bg-red-400/20 text-red-200 border-red-300/30",
    "bg-gray-100 text-gray-800 border-gray-200": "bg-gray-400/20 text-gray-200 border-gray-300/30",
    "bg-blue-100 text-blue-800 border-blue-200": "bg-blue-400/20 text-blue-200 border-blue-300/30",
  };

  const colorClass = variant === "light" 
    ? (lightColors[config.color] || "bg-white/20 text-white border-white/30")
    : config.color;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 
        font-medium rounded-full border
        transition-all duration-150
        ${colorClass}
        ${SIZE_CLASSES[size]}
      `}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
