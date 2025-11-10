"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, FileX, Search, Inbox, Filter } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        flex flex-col items-center justify-center
        py-16 px-4 text-center
        ${className}
      `}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="
          w-20 h-20 rounded-full
          bg-gray-100 flex items-center justify-center
          mb-6
        "
      >
        <Icon className="w-10 h-10 text-gray-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="
            px-6 py-2.5 rounded-lg
            bg-[#7a0019] text-white font-medium
            hover:bg-[#5a0012] transition-colors
            shadow-sm
          "
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// Preset variants for common empty states
export function NoRequestsFound({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No requests found"
      description="You don't have any travel requests yet. Create your first request to get started."
      action={onCreateNew ? {
        label: "Create New Request",
        onClick: onCreateNew,
      } : undefined}
    />
  );
}

export function NoSearchResults({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="We couldn't find any requests matching your search. Try adjusting your filters or search terms."
      action={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch,
      } : undefined}
    />
  );
}

export function NoFilteredResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No matching requests"
      description="No requests match the current filters. Try changing your filter criteria."
      action={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
      } : undefined}
    />
  );
}
