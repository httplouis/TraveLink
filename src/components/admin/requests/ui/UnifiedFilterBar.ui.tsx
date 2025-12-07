// src/components/admin/requests/ui/UnifiedFilterBar.ui.tsx
"use client";

import React from "react";
import { Search, Filter, SlidersHorizontal, X, Calendar, Download, Bookmark } from "lucide-react";
import SearchableSelect from "@/components/common/inputs/SearchableSelect";
import { exportRequestsCsv } from "@/lib/admin/export";
import type { RequestRow } from "@/lib/admin/types";

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
  
  // Export
  filteredRows?: RequestRow[];
  onExport?: (rows: RequestRow[]) => void;
  
  // Filter presets
  onSavePreset?: (name: string) => void;
  savedPresets?: Array<{ name: string; filters: any }>;
  onLoadPreset?: (preset: any) => void;
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
  filteredRows = [],
  onExport,
  onSavePreset,
  savedPresets = [],
  onLoadPreset,
}: Props) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [showPresets, setShowPresets] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");

  const handleExport = () => {
    if (onExport && filteredRows.length > 0) {
      onExport(filteredRows);
    } else if (filteredRows.length > 0) {
      exportRequestsCsv(filteredRows, `requests-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim());
      setPresetName("");
      setShowPresets(false);
    }
  };

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

          {/* Export Button */}
          {filteredRows.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#7A0010] border-2 border-[#7A0010] rounded-xl hover:bg-[#60000C] transition-all"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}

          {/* Filter Presets */}
          {(onSavePreset || savedPresets.length > 0) && (
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border-2 border-neutral-300 rounded-xl hover:border-[#7A0010] hover:text-[#7A0010] transition-all"
              >
                <Bookmark className="h-4 w-4" />
                Presets
              </button>
              
              {showPresets && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-neutral-200 rounded-xl shadow-lg z-50 p-3">
                  {savedPresets.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-neutral-200">
                      <p className="text-xs font-semibold text-neutral-600 mb-2">Saved Presets:</p>
                      <div className="space-y-1">
                        {savedPresets.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (onLoadPreset) onLoadPreset(preset.filters);
                              setShowPresets(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {onSavePreset && hasActiveFilters && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-600 mb-2">Save Current Filters:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Preset name..."
                          className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePreset();
                          }}
                        />
                        <button
                          onClick={handleSavePreset}
                          className="px-3 py-2 text-sm bg-[#7A0010] text-white rounded-lg hover:bg-[#60000C] transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
