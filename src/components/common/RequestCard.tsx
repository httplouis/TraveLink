"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, TrendingUp, MoreVertical, Calendar, MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { PersonDisplayCompact } from "./PersonDisplay";

interface RequestCardProps {
  request: {
    id: string;
    request_number: string;
    title: string;
    status: string;
    destination: string;
    departure_date: string;
    requester_name: string;
    requester_position?: string;
    requester_photo?: string;
    department_name?: string;
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        bg-white rounded-lg border-2 border-gray-200
        p-6 space-y-4
        hover:shadow-lg hover:border-[#7a0019]
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
      onClick={onView}
    >
      {/* Header: Request Number & Status */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {request.request_number}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {request.title}
          </p>
        </div>
        <StatusBadge status={request.status} showIcon={true} />
      </div>

      {/* Requester Info */}
      <PersonDisplayCompact
        name={request.requester_name}
        position={request.requester_position || request.department_name}
        profilePicture={request.requester_photo}
      />

      {/* Details: Date & Destination */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{new Date(request.departure_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{request.destination}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 pt-2 border-t border-gray-100"
        >
          {onView && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="
                flex-1 flex items-center justify-center gap-2
                px-3 py-2 rounded-lg
                border border-[#7a0019] text-[#7a0019]
                hover:bg-[#7a0019] hover:text-white
                transition-colors duration-150
                text-sm font-medium
              "
            >
              <Eye className="w-4 h-4" />
              View Details
            </motion.button>
          )}

          {onTrack && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onTrack();
              }}
              className="
                flex-1 flex items-center justify-center gap-2
                px-3 py-2 rounded-lg
                bg-gray-200 text-gray-800
                hover:bg-gray-300
                transition-colors duration-150
                text-sm font-medium
              "
            >
              <TrendingUp className="w-4 h-4" />
              Track
            </motion.button>
          )}

          {onAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="
                flex items-center justify-center
                w-10 h-10 rounded-lg
                bg-[#7a0019] text-white
                hover:bg-[#5a0012]
                transition-colors duration-150
              "
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
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
        <StatusBadge status={request.status} size="sm" showIcon={false} />
      </div>
    </motion.div>
  );
}
