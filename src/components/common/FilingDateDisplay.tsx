"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { formatLongDateTime } from "@/lib/datetime";

type Props = {
  createdAt?: string | null;
  requestNumber?: string | null;
  status?: string;
  className?: string;
};

/**
 * Displays the Date of Filing (systemdate) for a request
 * Only shows for submitted requests (not drafts)
 */
export default function FilingDateDisplay({
  createdAt,
  requestNumber,
  status,
  className = "",
}: Props) {
  // Only show for submitted requests (not drafts)
  const isDraft = status === "draft" || !status;
  const hasCreatedAt = createdAt && createdAt.trim() !== "";

  // Don't render if it's a draft or no created_at
  if (isDraft || !hasCreatedAt) {
    return null;
  }

  const formattedDate = formatLongDateTime(createdAt);

  return (
    <div className={`rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Date of Filing (systemdate)
          </div>
          <div className="mt-0.5 text-sm font-medium text-gray-900">
            {formattedDate}
            <span className="ml-2 text-xs text-gray-500">(Philippine Time)</span>
          </div>
          {requestNumber && (
            <div className="mt-1 text-xs text-gray-500">
              Request Number: <span className="font-semibold">{requestNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

