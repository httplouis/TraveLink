"use client";

import { motion } from "framer-motion";

/**
 * Skeleton Loader Components
 * Beautiful loading placeholders for various content types
 */

// Base skeleton with shimmer effect
function SkeletonBase({ className = "", animate = true }: { className?: string; animate?: boolean }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${
        animate ? "animate-shimmer" : ""
      } ${className}`}
    />
  );
}

// Card skeleton
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <SkeletonBase className="h-6 w-3/4 mb-3" />
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-5/6 mb-4" />
      <div className="flex gap-2 mt-4">
        <SkeletonBase className="h-8 w-20 rounded-md" />
        <SkeletonBase className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

// Request card skeleton
export function SkeletonRequestCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden shadow-lg bg-white ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 p-5">
        <SkeletonBase className="h-6 w-32 mb-2" />
        <SkeletonBase className="h-5 w-48" />
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonBase className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <SkeletonBase className="h-4 w-24 mb-2" />
            <SkeletonBase className="h-3 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <SkeletonBase className="h-4 w-full" />
          <SkeletonBase className="h-4 w-full" />
          <SkeletonBase className="h-4 w-full" />
          <SkeletonBase className="h-4 w-full" />
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-5 bg-gray-50 flex gap-3 justify-end">
        <SkeletonBase className="h-9 w-24 rounded-lg" />
        <SkeletonBase className="h-9 w-24 rounded-lg" />
      </div>
    </motion.div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonBase key={colIdx} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// List skeleton
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white">
          <SkeletonBase className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-3 w-1/2" />
          </div>
          <SkeletonBase className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// Calendar skeleton
export function SkeletonCalendar() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-md p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonBase className="h-6 w-32" />
        <div className="flex gap-2">
          <SkeletonBase className="h-8 w-8 rounded-md" />
          <SkeletonBase className="h-8 w-8 rounded-md" />
        </div>
      </div>
      
      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 w-full" />
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBase key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Form skeleton
export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-3 justify-end pt-4">
        <SkeletonBase className="h-10 w-24 rounded-md" />
        <SkeletonBase className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS
export const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;


