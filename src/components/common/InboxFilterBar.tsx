"use client";
import * as React from "react";
import { Search, Filter, X, LayoutGrid, Table2 } from "lucide-react";

export type ViewMode = "table" | "card";

export interface FilterState {
  urgent: boolean;
  international: boolean;
  local: boolean;
  pendingLong: boolean;
  highPriority: boolean;
  searchQuery: string;
}

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  requestCount?: number;
}

export default function InboxFilterBar({
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  requestCount,
}: Props) {
  const [showFilters, setShowFilters] = React.useState(false);

  const updateFilter = (key: keyof FilterState, value: boolean | string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      urgent: false,
      international: false,
      local: false,
      pendingLong: false,
      highPriority: false,
      searchQuery: "",
    });
  };

  const activeFilterCount = [
    filters.urgent,
    filters.international,
    filters.local,
    filters.pendingLong,
    filters.highPriority,
    filters.searchQuery.trim(),
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        {/* Top row: Search and View Toggle */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request number, title, or requester..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter("searchQuery", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a1f2a] focus:border-[#7a1f2a] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                showFilters || activeFilterCount > 0
                  ? "bg-[#7a1f2a] text-white border-[#7a1f2a]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-[#7a1f2a] rounded-full px-2 py-0.5 text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("table")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "table"
                    ? "bg-[#7a1f2a] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Table View"
              >
                <Table2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange("card")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "card"
                    ? "bg-[#7a1f2a] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Filter Options</h3>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#7a1f2a] hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.urgent}
                  onChange={(e) => updateFilter("urgent", e.target.checked)}
                  className="rounded border-gray-300 text-[#7a1f2a] focus:ring-[#7a1f2a]"
                />
                <span className="text-sm text-gray-700">Urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.international}
                  onChange={(e) => updateFilter("international", e.target.checked)}
                  className="rounded border-gray-300 text-[#7a1f2a] focus:ring-[#7a1f2a]"
                />
                <span className="text-sm text-gray-700">International</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.local}
                  onChange={(e) => updateFilter("local", e.target.checked)}
                  className="rounded border-gray-300 text-[#7a1f2a] focus:ring-[#7a1f2a]"
                />
                <span className="text-sm text-gray-700">Local</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pendingLong}
                  onChange={(e) => updateFilter("pendingLong", e.target.checked)}
                  className="rounded border-gray-300 text-[#7a1f2a] focus:ring-[#7a1f2a]"
                />
                <span className="text-sm text-gray-700">Pending &gt; 1 Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.highPriority}
                  onChange={(e) => updateFilter("highPriority", e.target.checked)}
                  className="rounded border-gray-300 text-[#7a1f2a] focus:ring-[#7a1f2a]"
                />
                <span className="text-sm text-gray-700">High Priority</span>
              </label>
            </div>
          </div>
        )}

        {/* Request Count */}
        {requestCount !== undefined && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {requestCount} request{requestCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

