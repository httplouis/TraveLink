"use client";

import React from "react";
import { FileText, CheckCircle2, XCircle, History, RefreshCw } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import { motion } from "framer-motion";
import PersonDisplay from "@/components/common/PersonDisplay";
import ComptrollerReviewModal from "@/components/comptroller/ComptrollerReviewModal";

export default function ComptrollerHistoryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<any>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/comptroller/history", { 
        cache: "no-store",
        credentials: 'include'
      });
      if (!res.ok) {
        console.warn("History API not OK:", res.status);
        setItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("History API returned non-JSON response");
        setItems([]);
        return;
      }
      const json = await res.json();
      if (json.ok && json.data) {
        setItems(Array.isArray(json.data) ? json.data : []);
      } else if (Array.isArray(json)) {
        setItems(json);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const handleClose = () => {
    setSelected(null);
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchesSearch = 
        item.request_number?.toLowerCase().includes(query) ||
        item.requester?.toLowerCase().includes(query) ||
        item.requester_name?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query) ||
        item.department_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') {
        if (value === 'approved') return item.decision === 'approved' || item.status === 'approved';
        if (value === 'rejected') return item.decision === 'rejected' || item.status === 'rejected';
      }
      return true;
    });
    
    return matchesFilters;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Review History</h1>
          <p className="text-gray-600 mt-1">
            {filteredItems.length} {filteredItems.length === 1 ? 'request' : 'requests'} reviewed by Comptroller
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a0019] to-[#9a0020] text-white rounded-lg text-sm font-medium shadow-lg">
            <History className="h-4 w-4" />
            Comptroller History
          </div>
        </div>
      </div>

      {/* FilterBar */}
      <FilterBar
        onSearch={(query) => setSearchQuery(query)}
        onFilter={(filters) => setActiveFilters(filters)}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
        showDateFilter={true}
        placeholder="Search history by request number, requester, or department..."
      />

      {/* History List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? "No results found" : "No history yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Approved and rejected budget reviews will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const requester = item.requester || "Unknown";
            const department = item.department || "—";
            const requestNumber = item.request_number || "—";
            const isApproved = item.decision === "approved";
            const isRejected = item.decision === "rejected";
            const actionDate = item.decision_date;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  // Fetch full request details
                  fetch(`/api/requests/${item.id}`, {
                    credentials: 'include',
                    cache: 'no-store'
                  })
                    .then(res => {
                      if (!res.ok) {
                        throw new Error(`Failed to fetch: ${res.status}`);
                      }
                      return res.json();
                    })
                    .then(data => {
                      if (data.ok && data.data) {
                        setSelected(data.data);
                      } else {
                        console.error("Invalid response format:", data);
                      }
                    })
                    .catch(err => {
                      console.error("Failed to fetch request:", err);
                    });
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex w-full items-center justify-between rounded-xl border-2 border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/40 hover:shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                      {requestNumber}
                    </span>
                    {isApproved && (
                      <span className="flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    )}
                    {actionDate && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(actionDate).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Manila'
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="text-sm mt-2">
                    <div className="font-semibold text-gray-900">{requester}</div>
                    <div className="text-gray-600 mt-0.5">{item.department_name || department}</div>
                  </div>

                  {item.budget !== undefined && item.budget !== null && (
                    <div className="mt-3 text-sm">
                      <span className="text-gray-500">Budget: </span>
                      <span className="font-semibold text-gray-900">₱{Number(item.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {item.edited_budget && Number(item.edited_budget) !== Number(item.budget) && (
                        <span className="text-gray-500 ml-2">
                          (Edited: ₱{Number(item.edited_budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>
                  )}

                  {item.notes && item.notes.trim() && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ComptrollerReviewModal
          request={selected}
          onClose={handleClose}
          onApproved={() => {
            handleClose();
            load();
          }}
          onRejected={() => {
            handleClose();
            load();
          }}
          viewOnly={true}
        />
      )}
    </motion.div>
  );
}
