"use client";

import React from "react";
import { FileText, CheckCircle2, XCircle, History, RefreshCw, Calendar, DollarSign, Building2, User, Eye } from "lucide-react";
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
      className="space-y-6 w-full"
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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
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
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            const requester = item.requester || item.requester_name || "Unknown";
            const department = item.department_name || item.department || "—";
            const requestNumber = item.request_number || "—";
            const isApproved = item.decision === "approved" || item.status === "approved";
            const isRejected = item.decision === "rejected" || item.status === "rejected";
            const actionDate = item.decision_date || item.comptroller_approved_at || item.updated_at;
            const budget = item.budget || item.total_budget || 0;
            const editedBudget = item.edited_budget || item.comptroller_edited_budget;

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-[#7A0010]/40 hover:shadow-lg"
              >
                <button
                  onClick={() => {
                    // Fetch full request details
                    fetch(`/api/requests/${item.id || item.request_id}`, {
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
                  className="w-full text-left"
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A0010] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                          <FileText className="h-3.5 w-3.5" />
                          {requestNumber}
                        </span>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200">
                            <XCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        )}
                      </div>
                      {actionDate && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            {new Date(actionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'Asia/Manila'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Requester & Department */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Requester</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{requester}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Department</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{department}</p>
                        </div>
                      </div>
                    </div>

                    {/* Budget Section */}
                    {budget > 0 && (
                      <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-amber-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-700 mb-1">Budget Amount</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-gray-900">
                              ₱{Number(budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {editedBudget && Number(editedBudget) !== Number(budget) && (
                              <>
                                <span className="text-xs text-gray-400">→</span>
                                <span className="text-base font-semibold text-[#7A0010]">
                                  ₱{Number(editedBudget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-amber-600 font-medium">(Edited)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes/Comment */}
                    {item.notes && item.notes.trim() && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Comment</p>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                          "{item.notes}"
                        </p>
                      </div>
                    )}

                    {/* View Details CTA */}
                    <div className="mt-4 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A0010] group-hover:text-[#9a0020] transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                        View Details
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ComptrollerReviewModal
          request={selected}
          onClose={() => {
            handleClose();
            load();
          }}
          readOnly={true}
        />
      )}
    </motion.div>
  );
}
