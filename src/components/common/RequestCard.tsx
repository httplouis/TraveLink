"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Calendar, MapPin, Clock, Zap, Route } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { PersonDisplay } from "./ProfilePicture";
import { WowCard, WowButton } from "./Modal";

interface RequestCardProps {
  request: {
    id: string;
    request_number: string;
    title: string;
    status: string;
    destination: string;
    departure_date: string;
    requester: {
      id: string;
      name: string;
      position?: string;
      department?: string;
      profile_picture?: string;
      is_online?: boolean;
    };
    total_budget?: number;
    smart_skips_applied?: string[];
    efficiency_boost?: number;
    priority?: 'high' | 'medium' | 'low';
  };
  showActions?: boolean;
  onView?: () => void;
  onTrack?: () => void;
  onAction?: () => void;
  className?: string;
}

export default function RequestCard({
  request,
  showActions = true,
  onView,
  onTrack,
  onAction,
  className = "",
}: RequestCardProps) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const hasSmartFeatures = request.smart_skips_applied && request.smart_skips_applied.length > 0;

  return (
    <WowCard
      onClick={onView}
      hoverEffect
      glowOnHover={hasSmartFeatures}
      className={`space-y-4 ${className}`}
    >
      {/* Smart Features Indicator */}
      {hasSmartFeatures && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-2">
          <Zap className="w-3 h-3" />
          Smart Skip Active - {request.smart_skips_applied?.length} stages bypassed
        </div>
      )}

      {/* Header: Request Number & Status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">
              {request.request_number}
            </h3>
            <StatusBadge status={request.status} />
            {request.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[request.priority]}`}>
                {request.priority.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {request.title}
          </p>
        </div>
      </div>

      {/* Requester Info */}
      <PersonDisplay
        person={{
          id: request.requester?.id || 'unknown',
          name: request.requester?.name || 'Unknown User',
          position: request.requester?.position,
          department: request.requester?.department,
          profile_picture: request.requester?.profile_picture,
          is_online: request.requester?.is_online
        }}
        size="sm"
        showPosition
      />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{request.destination}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(request.departure_date).toLocaleDateString()}</span>
        </div>
        {request.total_budget && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-400">₱</span>
            <span>₱{request.total_budget.toLocaleString()}</span>
          </div>
        )}
        {hasSmartFeatures && (
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{request.efficiency_boost || request.smart_skips_applied?.length}% faster</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <WowButton variant="outline" size="sm" onClick={() => onView?.()}>
              <Route className="w-4 h-4" />
              View Details & Tracking
            </WowButton>
          </div>
          {onAction && (
            <WowButton variant="primary" size="sm" onClick={() => onAction?.()}>
              Take Action
            </WowButton>
          )}
        </div>
      )}
    </WowCard>
  );
}

// Compact variant for list views
export function RequestCardCompact({
  request,
  onClick,
  className = "",
}: Pick<RequestCardProps, "request" | "className"> & { onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200
        p-4 flex items-center justify-between
        hover:border-[#7a0019] hover:shadow-md
        transition-all duration-150
        cursor-pointer
        ${className}
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {request.request_number}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {request.title}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>
    </motion.div>
  );
}
