// src/components/common/AdvancedFilters.tsx
"use client";

import * as React from "react";
import { Search, Filter, X, ChevronDown, Calendar, Building2, FileText, SortAsc } from "lucide-react";

export interface FilterState {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  department: string;
  requestType: string;
  status: string;
  sortBy: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  departments?: string[];
  showRequestType?: boolean;
  showStatus?: boolean;
  placeholder?: string;
}

export const defaultFilters: FilterState = {
  searchQuery: "",
  dateFrom: "",
  dateTo: "",
  department: "all",
  requestType: "all",
  status: "all",
  sortBy: "newest",
};

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  departments = [],
  showRequestType = true,
  showStatus = false,
  placeholder = "Search by request number, requester, purpose...",
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.department !== "all" ? filters.department : "",
    filters.requestType !== "all" ? filters.requestType : "",
    filters.status !== "all" ? filters.status : "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search + Filter Toggle Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter("searchQuery", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-[#7A0010] text-white border-2 border-[#7A0010]'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-[#7A0010]/50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">{activeFilterCount}</span>
          )}
        </button>
      </div>
      
      {/* Advanced Filters Panel (Collapsible) */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#7A0010]" />
              Advanced Filters
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-[#7A0010] font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date From */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Travel Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Travel Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
              />
            </div>
            
            {/* Department Filter */}
            {departments.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => updateFilter("department", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Request Type Filter */}
            {showRequestType && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Request Type
                </label>
                <select
                  value={filters.requestType}
                  onChange={(e) => updateFilter("requestType", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="travel_order">Travel Order</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>
            )}
            
            {/* Status Filter */}
            {showStatus && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Sort Row */}
          <div className="pt-2 border-t border-slate-200">
            <div className="max-w-xs">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5">
                <SortAsc className="h-3.5 w-3.5" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
              >
                <option value="newest">Newest First (Submitted)</option>
                <option value="oldest">Oldest First (Submitted)</option>
                <option value="travel-soon">Travel Date (Soonest)</option>
                <option value="travel-later">Travel Date (Latest)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to apply filters to items
export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: FilterState,
  options?: {
    searchFields?: (keyof T)[];
    dateField?: keyof T;
    departmentField?: string;
    requestTypeField?: keyof T;
  }
): T[] {
  const {
    searchFields = ['request_number', 'purpose', 'destination'],
    dateField = 'travel_start_date',
    departmentField = 'department.name',
    requestTypeField = 'request_type',
  } = options || {};

  let filtered = [...items];

  // Apply search
  if (filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      return searchFields.some(field => {
        const value = String(item[field] || '').toLowerCase();
        return value.includes(query);
      }) || 
      // Also search requester name
      (item.requester?.name || item.requester_name || '').toLowerCase().includes(query) ||
      // Search department
      (item.department?.name || item.department?.code || '').toLowerCase().includes(query);
    });
  }

  // Apply department filter
  if (filters.department !== 'all') {
    filtered = filtered.filter(item => {
      const deptName = item.department?.name || item.department?.code;
      return deptName === filters.department;
    });
  }

  // Apply request type filter
  if (filters.requestType !== 'all') {
    filtered = filtered.filter(item => item[requestTypeField] === filters.requestType);
  }

  // Apply status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(item => {
      const status = item.status || '';
      if (filters.status === 'pending') {
        return status.startsWith('pending');
      }
      return status === filters.status;
    });
  }

  // Apply date range filter
  if (filters.dateFrom) {
    filtered = filtered.filter(item => {
      const travelDate = item[dateField] ? new Date(item[dateField] as string) : null;
      return travelDate && travelDate >= new Date(filters.dateFrom);
    });
  }
  if (filters.dateTo) {
    filtered = filtered.filter(item => {
      const travelDate = item[dateField] ? new Date(item[dateField] as string) : null;
      return travelDate && travelDate <= new Date(filters.dateTo);
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    const travelA = new Date(a[dateField] as string || 0);
    const travelB = new Date(b[dateField] as string || 0);
    
    switch (filters.sortBy) {
      case 'newest':
        return dateB.getTime() - dateA.getTime();
      case 'oldest':
        return dateA.getTime() - dateB.getTime();
      case 'travel-soon':
        return travelA.getTime() - travelB.getTime();
      case 'travel-later':
        return travelB.getTime() - travelA.getTime();
      default:
        return 0;
    }
  });

  return filtered;
}
