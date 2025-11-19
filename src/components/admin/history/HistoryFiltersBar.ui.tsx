// src/components/admin/history/HistoryFiltersBar.ui.tsx
"use client";

import type { HistoryFilters } from "@/lib/admin/history/types";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  value: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  onClear: () => void;
};

export default function HistoryFiltersBar({ value, onChange, onClear }: Props) {
  const [departments, setDepartments] = useState<Array<{ name: string; code: string }>>([]);

  useEffect(() => {
    // Fetch departments for filter dropdown - get unique departments from history data
    // This will be populated from the actual history data, but for now we'll fetch from a simple endpoint
    const fetchDepartments = async () => {
      try {
        // Use the same approach as report filter - fetch from requests to get unique departments
        const response = await fetch("/api/admin/history/departments");
        if (response.ok) {
          const result = await response.json();
          if (result.ok && result.data) {
            setDepartments(result.data);
          }
        }
      } catch (error) {
        console.error("[HistoryFiltersBar] Failed to fetch departments:", error);
      }
    };

    fetchDepartments();
  }, []);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reference, title, description, department..."
            value={value.search || ""}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1f2a] focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <select
          value={value.type || "all"}
          onChange={(e) => onChange({ ...value, type: e.target.value as any })}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1f2a] focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="requests">Requests Only</option>
          <option value="maintenance">Maintenance Only</option>
        </select>

        {/* Department Filter */}
        <select
          value={value.department || ""}
          onChange={(e) => onChange({ ...value, department: e.target.value || undefined })}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1f2a] focus:border-transparent"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.code} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex gap-2">
          <input
            type="date"
            value={value.from || ""}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1f2a] focus:border-transparent"
            placeholder="From"
          />
          <input
            type="date"
            value={value.to || ""}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1f2a] focus:border-transparent"
            placeholder="To"
          />
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}

