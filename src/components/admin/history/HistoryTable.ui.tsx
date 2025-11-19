// src/components/admin/history/HistoryTable.ui.tsx
"use client";

import type { HistoryItem } from "@/lib/admin/history/types";
import { CheckCircle2, Wrench, Eye } from "lucide-react";

// Format date helper (no external dependency)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return "N/A";
  }
}

type Props = {
  rows: HistoryItem[];
  onView?: (item: HistoryItem) => void;
};

export default function HistoryTable({ rows, onView }: Props) {
  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-800 border-green-200";
    if (status === "Approved") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-neutral-100 text-neutral-800 border-neutral-200";
  };

  const getTypeIcon = (type: string) => {
    if (type === "request") return CheckCircle2;
    return Wrench;
  };

  const getTypeColor = (type: string) => {
    if (type === "request") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <div className="text-neutral-400 mb-2">
          <CheckCircle2 className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-neutral-600 font-medium">No history records found</p>
        <p className="text-sm text-neutral-500 mt-1">Completed requests and maintenance will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#7a1f2a] to-[#9a2f3a] text-white">
              <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Reference</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Requester</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rows.map((row) => {
              const TypeIcon = getTypeIcon(row.type);
              return (
                <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTypeColor(row.type)}`}>
                      <TypeIcon className="h-3.5 w-3.5" />
                      {row.type === "request" ? "Request" : "Maintenance"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-neutral-600">{row.reference}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-neutral-900 truncate">{row.title}</p>
                      {row.description && (
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{row.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{row.department}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{row.requester}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{row.vehicle}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {row.date ? formatDate(row.date) : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-700 hover:text-[#7a1f2a] hover:bg-neutral-100 rounded-md transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

