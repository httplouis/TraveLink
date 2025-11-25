"use client";

import React from "react";
import { FileText } from "lucide-react";
import ExecRequestModal from "@/components/exec/ExecRequestModal";
import FilterBar from "@/components/common/FilterBar";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ExecHistoryContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<any>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/exec/history", { cache: "no-store" });
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
    
    // Initial load
    load();
    
    // Set up real-time subscription for history updates
    const supabase = createSupabaseClient();
    
    let mutateTimeout: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel("exec-history-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload: any) => {
          if (!isMounted) return;
          
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          
          // Only react to approvals/rejections
          if (newStatus === "approved" || newStatus === "rejected" || 
              (oldStatus && (oldStatus === "pending_vp" || oldStatus === "pending_president" || oldStatus === "pending_exec"))) {
            // Debounce: only trigger refetch after 500ms
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

    // Cleanup
    return () => {
      isMounted = false;
      if (mutateTimeout) clearTimeout(mutateTimeout);
      supabase.removeChannel(channel);
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
    <div className="space-y-4">
      {/* FilterBar with Search and Filters */}
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
              : "Approved and rejected requests will appear here"}
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
            const isApproved = item.status === "approved" || item.status === "completed";
            const isRejected = item.status === "rejected";
            const actionDate = item.exec_approved_at || item.vp_approved_at || item.president_approved_at || item.rejected_at;

            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg hover:scale-[1.01]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                      {requestNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">{travelDate}</span>
                  </div>

                  {/* Use PersonDisplay component */}
                  <PersonDisplay
                    name={requester}
                    position={item.requester?.position_title}
                    department={department}
                    profilePicture={item.requester?.profile_picture}
                    size="sm"
                  />

                  <p className="text-sm text-slate-600 line-clamp-1 mt-2 mb-1">
                    {item.purpose}
                  </p>

                  {actionDate && (
                    <div className="mt-2 text-xs text-gray-500">
                      Actioned on {new Date(actionDate).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <StatusBadge status={item.status} size="md" showIcon={true} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ExecRequestModal
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
          readOnly={true}
        />
      )}
    </div>
  );
}
