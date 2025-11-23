"use client";

import React from "react";
import { FileText, CheckCircle2, XCircle, History, RefreshCw } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import { motion } from "framer-motion";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestDetailsView from "@/components/common/RequestDetailsView";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function UserHistoryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<any>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/inbox/history", { cache: "no-store" });
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
      if (json.ok) {
        setItems(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    let isMounted = true;
    let mutateTimeout: NodeJS.Timeout | null = null;
    let channel: any = null;
    
    // Initial load
    load();
    
    // Set up real-time subscription
    const supabase = createSupabaseClient();
    channel = supabase
      .channel("user-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          if (!isMounted) return;
          // If requester_signature was added or status changed, refresh
          if (payload.new?.requester_signature && !payload.old?.requester_signature ||
              payload.new?.status !== payload.old?.status) {
            if (mutateTimeout) clearTimeout(mutateTimeout);
            mutateTimeout = setTimeout(() => {
              if (isMounted) {
                load();
              }
            }, 500);
          }
        }
      )
      .subscribe();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        load();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (mutateTimeout) clearTimeout(mutateTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleClose = () => {
    setSelected(null);
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.request_number?.toLowerCase().includes(query) ||
      item.requester_name?.toLowerCase().includes(query) ||
      item.requester?.name?.toLowerCase().includes(query) ||
      item.purpose?.toLowerCase().includes(query) ||
      item.department?.name?.toLowerCase().includes(query);
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'status') return item.status === value;
      return true;
    });
    
    return matchesSearch && matchesFilters;
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
          <h1 className="text-3xl font-bold text-gray-900">Request History</h1>
          <p className="text-gray-600 mt-1">
            {filteredItems.length} {filteredItems.length === 1 ? 'request' : 'requests'} you've signed
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
            My History
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
              { value: "pending_vp", label: "Pending VP" },
              { value: "pending_president", label: "Pending President" },
            ],
          },
        ]}
        showDateFilter={true}
        placeholder="Search history by request number, requester, or purpose..."
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
              : "Signed requests will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const requester = item.requester_name || item.requester?.name || "Unknown";
            const department = item.department?.name || item.department?.code || "—";
            const requestNumber = item.request_number || "—";
            const travelDate = item.travel_start_date
              ? new Date(item.travel_start_date).toLocaleDateString()
              : "—";
            const isApproved = item.status === "approved";
            const isRejected = item.status === "rejected";
            const actionDate = item.requester_signed_at;

            return (
              <motion.button
                key={item.id}
                onClick={() => setSelected(item)}
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
                    {!isApproved && !isRejected && (
                      <span className="flex items-center gap-1 rounded-md bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200">
                        {item.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                      </span>
                    )}
                    {actionDate && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-medium text-gray-500">
                          Signed on {new Date(actionDate).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <PersonDisplay
                    name={requester}
                    position={item.requester?.position_title}
                    department={department}
                    profilePicture={item.requester?.profile_picture || item.requester?.avatar_url}
                    size="sm"
                  />

                  {item.purpose && (
                    <p className="text-sm text-gray-600 line-clamp-1 mt-2">
                      {item.purpose}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Travel Date: <span className="font-medium text-gray-700">{travelDate}</span></span>
                    {item.destination && (
                      <span>•</span>
                    )}
                    {item.destination && (
                      <span className="line-clamp-1">Destination: <span className="font-medium text-gray-700">{item.destination}</span></span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <RequestDetailsView request={selected} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

