// src/components/admin/requests/ui/UnifiedFilterBar.ui.tsx
"use client";

import React from "react";
import { Search, Filter, SlidersHorizontal, X, Calendar } from "lucide-react";
import SearchableSelect from "@/components/common/inputs/SearchableSelect";

type Props = {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Status filter
  statusValue: string;
  onStatusChange: (value: string) => void;

  // Department filter (optional)
  deptValue?: string;
  onDeptChange?: (value: string) => void;
  departments?: string[];

  // Date range (optional)
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;

  // Clear
  onClear: () => void;
  hasActiveFilters: boolean;

  // Results
  resultsCount: number;
  totalCount: number;
};

export default function UnifiedFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search requests...",
  statusValue,
  onStatusChange,
  deptValue,
  onDeptChange,
  departments,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  hasActiveFilters,
  resultsCount,
  totalCount,
}: Props) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden">
      {/* Main Filter Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0010] focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 relative group">
            <Filter className="h-5 w-5 text-neutral-500 group-hover:text-[#7A0010] transition-colors" />
            <select
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 text-sm font-medium border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0010] focus:border-[#7A0010] transition-all bg-white min-w-[150px] cursor-pointer hover:border-[#7A0010] hover:shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237A0010'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem'
              }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          {(departments || onDateFromChange) && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 rounded-xl transition-all ${
                showAdvanced
                  ? "bg-[#7A0010] text-white border-[#7A0010]"
                  : "bg-white text-neutral-700 border-neutral-300 hover:border-[#7A0010] hover:text-[#7A0010]"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced
            </button>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (departments || onDateFromChange) && (
          <div className="mt-4 pt-4 border-t-2 border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Department Filter */}
            {departments && onDeptChange && deptValue !== undefined && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 ml-1">
                  Department
                </label>
                <SearchableSelect
                  value={deptValue}
                  onChange={onDeptChange}
                  options={[
                    { value: "All", label: "All Departments" },
                    ...departments.map((dept) => ({ value: dept, label: dept }))
                  ]}
                  placeholder="Type to search departments..."
                />
              </div>
            )}

            {/* Date From */}
            {onDateFromChange && dateFrom !== undefined && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 ml-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0010] focus:border-transparent transition-all"
                />
              </div>
            )}

            {/* Date To */}
            {onDateToChange && dateTo !== undefined && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5 ml-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0010] focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 bg-gradient-to-r from-neutral-50 to-neutral-100 border-t-2 border-neutral-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-neutral-600">
            Showing <span className="font-bold text-neutral-900">{resultsCount}</span> of{" "}
            <span className="font-bold text-neutral-900">{totalCount}</span> records
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-[#7A0010] text-white text-xs rounded-full font-semibold">
                FILTERED
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
