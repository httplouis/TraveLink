"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X, Calendar } from "lucide-react";

interface FilterBarProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterValues) => void;
  filters?: FilterOption[];
  showDateFilter?: boolean;
  placeholder?: string;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface FilterValues {
  [key: string]: string;
}

export default function FilterBar({
  onSearch,
  onFilter,
  filters = [],
  showDateFilter = false,
  placeholder = "Search requests...",
  className = "",
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setDateRange({ start: "", end: "" });
    onSearch?.("");
    onFilter?.({});
  };

  const activeFilterCount = Object.keys(activeFilters).length + (dateRange.start ? 1 : 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Toggle */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-lg
              border-2 border-gray-200
              focus:border-[#7a0019] focus:ring-2 focus:ring-[#7a0019]/20
              transition-all outline-none
            "
          />
        </div>

        {/* Filter Toggle Button */}
        {(filters.length > 0 || showDateFilter) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`
              relative px-4 py-2.5 rounded-lg border-2
              flex items-center gap-2 font-medium
              transition-all
              ${showFilters 
                ? "border-[#7a0019] bg-red-50 text-[#7a0019]" 
                : "border-gray-200 text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="
                absolute -top-2 -right-2
                w-6 h-6 rounded-full
                bg-[#7a0019] text-white text-xs
                flex items-center justify-center
                font-bold
              ">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        )}

        {/* Clear All */}
        {(searchQuery || activeFilterCount > 0) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearAllFilters}
            className="
              px-4 py-2.5 rounded-lg
              bg-gray-200 text-gray-700 font-medium
              hover:bg-gray-300 transition-colors
              flex items-center gap-2
            "
          >
            <X className="w-4 h-4" />
            Clear
          </motion.button>
        )}
      </div>

      {/* Filter Panels */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="
            p-4 rounded-lg border-2 border-gray-200 bg-gray-50
            grid md:grid-cols-3 gap-4
          "
        >
          {/* Date Range Filter */}
          {showDateFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="
                    w-full px-3 py-2 rounded-lg border border-gray-300
                    focus:border-[#7a0019] focus:ring-1 focus:ring-[#7a0019]
                    transition-all outline-none text-sm
                  "
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="
                    w-full px-3 py-2 rounded-lg border border-gray-300
                    focus:border-[#7a0019] focus:ring-1 focus:ring-[#7a0019]
                    transition-all outline-none text-sm
                  "
                />
              </div>
            </div>
          )}

          {/* Dynamic Filters */}
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filter.label}
              </label>
              <select
                value={activeFilters[filter.key] || ""}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg border border-gray-300
                  focus:border-[#7a0019] focus:ring-1 focus:ring-[#7a0019]
                  transition-all outline-none text-sm
                "
              >
                <option value="">All</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </motion.div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key);
            const option = filter?.options.find((o) => o.value === value);
            return (
              <motion.div
                key={key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="
                  inline-flex items-center gap-1.5
                  px-3 py-1 rounded-full
                  bg-[#7a0019] text-white text-sm font-medium
                "
              >
                {filter?.label}: {option?.label}
                <button
                  onClick={() => handleFilterChange(key, "")}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
          {dateRange.start && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="
                inline-flex items-center gap-1.5
                px-3 py-1 rounded-full
                bg-[#7a0019] text-white text-sm font-medium
              "
            >
              {dateRange.start} to {dateRange.end || "now"}
              <button
                onClick={() => setDateRange({ start: "", end: "" })}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
