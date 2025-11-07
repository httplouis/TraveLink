// src/app/(protected)/head/inbox/page.tsx
"use client";

import React from "react";
import HeadRequestModal from "@/components/head/HeadRequestModal";
import { SkeletonRequestCard } from "@/components/common/ui/Skeleton";

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

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/head", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data ?? []);
        setLastUpdate(new Date());
      }
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

    return filtered;
  }, [items, historyItems, activeTab, filterStatus, searchQuery]);

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
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
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
        
        {activeTab === 'history' && (
          <div className="flex gap-2">
            {/* Quick filter for rejected */}
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
            
            {/* Status dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7A0010] focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved_head">Approved</option>
              <option value="pending_comptroller">Forwarded to Comptroller</option>
              <option value="pending_hr">Forwarded to HR</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
            </select>
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
        <div className="space-y-3">
          {filteredItems.map((item) => {
            // Better fallback chain for requester name
            const requester = item.requester?.name || item.requester_name || item.requester?.email || "Unknown Requester";
            const department = item.department?.name || item.department?.code || "—";
            const purpose = item.purpose || "No purpose indicated";
            const requestNumber = item.request_number || "—";
            const travelDate = item.travel_start_date ? new Date(item.travel_start_date).toLocaleDateString() : "—";
            
            // Status badge config
            const getStatusBadge = (status: string) => {
              switch (status) {
                case 'pending_head':
                case 'pending_parent_head':
                  return { text: 'Pending Review', color: 'bg-amber-50 border-amber-200 text-amber-700' };
                case 'approved_head':
                  return { text: 'Approved', color: 'bg-green-50 border-green-200 text-green-700' };
                case 'pending_comptroller':
                  return { text: 'With Comptroller', color: 'bg-blue-50 border-blue-200 text-blue-700' };
                case 'pending_hr':
                  return { text: 'With HR', color: 'bg-purple-50 border-purple-200 text-purple-700' };
                case 'rejected':
                  return { text: 'Rejected', color: 'bg-red-50 border-red-200 text-red-700' };
                default:
                  return { text: status || 'Unknown', color: 'bg-slate-50 border-slate-200 text-slate-700' };
              }
            };
            const statusBadge = getStatusBadge(item.status);
            
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg hover:scale-[1.01]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                      {requestNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">{travelDate}</span>
                  </div>
                  <p className="font-semibold text-slate-900 mb-1.5">
                    {requester}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-1 mb-1">
                    {purpose}
                  </p>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-slate-500 font-medium">{department}</span>
                  </div>
                  
                  {/* History timestamps */}
                  {activeTab === 'history' && (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {item.head_approved_at && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Approved: {new Date(item.head_approved_at).toLocaleDateString()} {new Date(item.head_approved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                      {item.rejected_at && (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Rejected: {new Date(item.rejected_at).toLocaleDateString()} {new Date(item.rejected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                      {item.parent_head_approved_at && !item.head_approved_at && (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Approved: {new Date(item.parent_head_approved_at).toLocaleDateString()} {new Date(item.parent_head_approved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                  <svg className="h-5 w-5 text-slate-300 group-hover:text-[#7A0010] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
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
