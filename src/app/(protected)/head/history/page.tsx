// src/app/(protected)/head/history/page.tsx
"use client";

import React from "react";
import HeadRequestModal from "@/components/head/HeadRequestModal";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";

const logger = createLogger("HeadHistory");

export default function HeadHistoryPage() {
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  
  // Search and filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  
  // Advanced filters
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [filterDepartment, setFilterDepartment] = React.useState<string>("all");
  const [filterRequestType, setFilterRequestType] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("newest");
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Extract unique departments for filter
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    historyItems.forEach(item => {
      const deptName = item.department?.name || item.department?.code;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts).sort();
  }, [historyItems]);

  async function loadHistory(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      logger.info("Loading head history...");
      const res = await fetch("/api/head/history", { cache: "no-store" });
      if (!res.ok) {
        logger.error("History API response not OK:", res.status, res.statusText);
        setHistoryItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        logger.error("History API returned non-JSON response. Content-Type:", contentType);
        setHistoryItems([]);
        return;
      }
      const json = await res.json();
      if (json.ok) {
        setHistoryItems(json.data ?? []);
        setLastUpdate(new Date());
        logger.success(`Loaded ${json.data?.length || 0} history items`);
      } else {
        logger.warn("Failed to load history:", json.error);
      }
    } catch (error) {
      logger.error("Error loading history:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  // Initial load
  React.useEffect(() => { 
    loadHistory();
  }, []);

  // Real-time updates using Supabase Realtime
  React.useEffect(() => {
    const supabase = createSupabaseClient();
    let mutateTimeout: NodeJS.Timeout | null = null;
    let channel: any = null;
    
    channel = supabase
      .channel("head-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          // Debounce: only trigger refetch after 500ms
          if (mutateTimeout) clearTimeout(mutateTimeout);
          mutateTimeout = setTimeout(() => {
            loadHistory(false); // Silent refresh
          }, 500);
        }
      )
      .subscribe((status: string) => {
        console.log("[Head History] Realtime subscription status:", status);
      });

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      loadHistory(false);
    }, 30000);

    return () => {
      clearInterval(interval);
      if (mutateTimeout) clearTimeout(mutateTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Count rejected items
  const rejectedCount = React.useMemo(() => {
    return historyItems.filter(item => item.status === 'rejected').length;
  }, [historyItems]);

  // Filter and search logic
  const filteredItems = React.useMemo(() => {
    let filtered = [...historyItems];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter(item => {
        const deptName = item.department?.name || item.department?.code;
        return deptName === filterDepartment;
      });
    }
    
    // Apply request type filter
    if (filterRequestType !== "all") {
      filtered = filtered.filter(item => item.request_type === filterRequestType);
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(item => {
        const travelDate = item.travel_start_date ? new Date(item.travel_start_date) : null;
        return travelDate && travelDate >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(item => {
        const travelDate = item.travel_start_date ? new Date(item.travel_start_date) : null;
        return travelDate && travelDate <= new Date(dateTo);
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const requester = (item.requester?.name || item.requester_name || item.requester?.email || "").toLowerCase();
        const department = (item.department?.name || item.department?.code || "").toLowerCase();
        const purpose = (item.purpose || "").toLowerCase();
        const requestNumber = (item.request_number || "").toLowerCase();
        
        return requester.includes(query) || 
               department.includes(query) || 
               purpose.includes(query) ||
               requestNumber.includes(query);
      });
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      const travelA = new Date(a.travel_start_date || 0);
      const travelB = new Date(b.travel_start_date || 0);
      
      switch (sortBy) {
        case "newest":
          return dateB.getTime() - dateA.getTime();
        case "oldest":
          return dateA.getTime() - dateB.getTime();
        case "travel-soon":
          return travelA.getTime() - travelB.getTime();
        case "travel-later":
          return travelB.getTime() - travelA.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [historyItems, filterStatus, searchQuery, dateFrom, dateTo, filterDepartment, filterRequestType, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
              <div className="h-5 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            </div>
            <div className="h-8 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>

        {/* Search and Filter Bar Skeleton */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-11 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
            <div className="h-11 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
            <div className="h-11 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>

        {/* Request Cards Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#7A0010]">
              Approval History
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? 'request' : 'requests'} in history
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium" suppressHydrationWarning>
              Auto-refresh • {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search + Filter Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by requester, department, purpose, or request number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              showFilters || dateFrom || dateTo || filterDepartment !== 'all' || filterRequestType !== 'all'
                ? 'bg-[#7A0010] text-white border-2 border-[#7A0010]'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#7A0010]/50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {(dateFrom || dateTo || filterDepartment !== 'all' || filterRequestType !== 'all') && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">Active</span>
            )}
          </button>
          
          {rejectedCount > 0 && (
            <button
              onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'all' : 'rejected')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rejected
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                filterStatus === 'rejected'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-100 text-red-700'
              }`}>
                {rejectedCount}
              </span>
            </button>
          )}
        </div>
        
        {/* Advanced Filters Panel (Collapsible) */}
        {showFilters && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Advanced Filters
              </h3>
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setFilterDepartment("all");
                  setFilterRequestType("all");
                  setFilterStatus("all");
                  setSortBy("newest");
                }}
                className="text-xs text-slate-500 hover:text-[#7A0010] font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date From */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Travel Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                />
              </div>
              
              {/* Date To */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Travel Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                />
              </div>
              
              {/* Department Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              {/* Request Type Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Request Type</label>
                <select
                  value={filterRequestType}
                  onChange={(e) => setFilterRequestType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="travel_order">Travel Order</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>
            </div>
            
            {/* Sort and Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="newest">Newest First (Submitted)</option>
                  <option value="oldest">Oldest First (Submitted)</option>
                  <option value="travel-soon">Travel Date (Soonest)</option>
                  <option value="travel-later">Travel Date (Latest)</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="approved_head">Approved</option>
                  <option value="pending_comptroller">With Comptroller</option>
                  <option value="pending_hr">With HR</option>
                  <option value="rejected">Rejected ({rejectedCount})</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {searchQuery || filterStatus !== "all" ? "No matching requests" : "No history yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || filterStatus !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "Approved and rejected requests will appear here."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <RequestCardEnhanced
              key={item.id}
              request={{
                id: item.id,
                request_number: item.request_number || "—",
                file_code: item.file_code,
                title: item.title,
                purpose: item.purpose || "No purpose indicated",
                destination: item.destination,
                travel_start_date: item.travel_start_date,
                travel_end_date: item.travel_end_date,
                status: item.status,
                created_at: item.created_at,
                total_budget: item.total_budget,
                request_type: item.request_type,
                requester_name: item.requester?.name || item.requester_name,
                requester: {
                  name: item.requester?.name || item.requester_name || "Unknown",
                  email: item.requester?.email,
                  profile_picture: item.requester?.profile_picture || item.requester?.avatar_url,
                  department: item.department?.name || item.department?.code,
                  position: item.requester?.position_title,
                },
                department: item.department,
              }}
              showActions={true}
              onView={() => setSelected(item)}
            />
          ))}
        </div>
      )}

      {selected && (
        <HeadRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={() => {
            setSelected(null);
            loadHistory(false);
          }}
          onRejected={() => {
            setSelected(null);
            loadHistory(false);
          }}
          viewOnly={true}
        />
      )}
    </div>
  );
}
