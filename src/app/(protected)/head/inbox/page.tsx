// src/app/(protected)/head/inbox/page.tsx
"use client";

import React from "react";
import HeadRequestModal from "@/components/head/HeadRequestModal";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import { createSupabaseClient } from "@/lib/supabase/client";
import { createLogger } from "@/lib/debug";

// Format time ago helper
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function HeadInboxPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [historyItems, setHistoryItems] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  
  // Tab system
  const [activeTab, setActiveTab] = React.useState<'pending' | 'history'>('pending');
  
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
  
  // Track viewed requests (mark as read)
  const [viewedRequests, setViewedRequests] = React.useState<Set<string>>(new Set());
  
  // Load viewed requests from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('head_viewed_requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setViewedRequests(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse viewed requests', e);
      }
    }
  }, []);
  
  // Mark request as viewed when opened
  const markAsViewed = (requestId: string) => {
    const newViewed = new Set(viewedRequests);
    newViewed.add(requestId);
    setViewedRequests(newViewed);
    localStorage.setItem('head_viewed_requests', JSON.stringify(Array.from(newViewed)));
  };
  
  // Extract unique departments for filter
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    [...items, ...historyItems].forEach(item => {
      const deptName = item.department?.name || item.department?.code;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts).sort();
  }, [items, historyItems]);

  const logger = createLogger("HeadInbox");

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      logger.info("Loading head requests...");
      const res = await fetch("/api/head", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data ?? []);
        setLastUpdate(new Date());
        logger.success(`Loaded ${json.data?.length || 0} requests`);
      } else {
        logger.warn("Failed to load requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading requests:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch("/api/head/history", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setHistoryItems(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }

  // Initial load
  React.useEffect(() => { 
    load(); 
    loadHistory();
  }, []);

  // Real-time polling - refresh every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      load(false); // Refresh without showing loader
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  function handleApproved(id: string) {
    // Optimistically remove from UI first
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    
    // Reload both lists to ensure fresh data
    setTimeout(() => {
      load(false);  // Reload pending list (silent)
      loadHistory(); // Reload history
      setActiveTab('history'); // Switch to history tab
    }, 500);
  }

  function handleRejected(id: string) {
    // Optimistically remove from UI first
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    
    // Reload both lists to ensure fresh data
    setTimeout(() => {
      load(false);  // Reload pending list (silent)
      loadHistory(); // Reload history
      setActiveTab('history'); // Switch to history tab
    }, 500);
  }

  // Count rejected items
  const rejectedCount = React.useMemo(() => {
    return historyItems.filter(item => item.status === 'rejected').length;
  }, [historyItems]);

  // Filter and search logic
  const filteredItems = React.useMemo(() => {
    let filtered = activeTab === 'pending' ? items : historyItems;

    // Apply status filter (only for history tab)
    if (activeTab === 'history' && filterStatus !== "all") {
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
  }, [items, historyItems, activeTab, filterStatus, searchQuery, dateFrom, dateTo, filterDepartment, filterRequestType, sortBy]);

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#7A0010]">
              Requests for Endorsement
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {activeTab === 'pending' 
                ? `${filteredItems.length} ${filteredItems.length === 1 ? 'request' : 'requests'} pending your review`
                : `${filteredItems.length} ${filteredItems.length === 1 ? 'request' : 'requests'} in history`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium" suppressHydrationWarning>
              Auto-refresh • {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-[#7A0010] border-b-2 border-[#7A0010] -mb-[2px]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending
            {items.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                {items.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-[#7A0010] border-b-2 border-[#7A0010] -mb-[2px]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History
            {historyItems.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                {historyItems.length}
              </span>
            )}
          </button>
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
          
          {activeTab === 'history' && rejectedCount > 0 && (
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
              
              {/* Status Filter (only for history) */}
              {activeTab === 'history' && (
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
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {searchQuery || filterStatus !== "all" ? "No matching requests" : "No requests pending"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || filterStatus !== "all" 
              ? "Try adjusting your search or filter criteria."
              : "When faculty submit requests, they will appear here for your approval."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            // Check if request is new (within last 24 hours AND not viewed yet)
            const createdAt = item.created_at ? new Date(item.created_at) : null;
            const now = new Date();
            const hoursSinceCreation = createdAt ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 999;
            const isNew = hoursSinceCreation < 24 && !viewedRequests.has(item.id);
            
            return (
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
                onView={() => {
                  setSelected(item);
                  markAsViewed(item.id);
                }}
                className={
                  isNew && activeTab === 'pending' && !viewedRequests.has(item.id)
                    ? "border-green-300 bg-green-50/30"
                    : ""
                }
              />
            );
          })}
        </div>
      )}

      {selected && (
        <HeadRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
          viewOnly={activeTab === 'history'}
        />
      )}
    </div>
  );
}
