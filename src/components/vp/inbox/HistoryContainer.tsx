"use client";

import React from "react";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import VPRequestModal from "@/components/vp/VPRequestModal";
import FilterBar from "@/components/common/FilterBar";
import StatusBadge from "@/components/common/StatusBadge";
import { NoSearchResults } from "@/components/common/EmptyState";

export default function VPHistoryContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [activeFilters, setActiveFilters] = React.useState<any>({});

  async function load() {
    setLoading(true);
    try {
      console.log("[VPHistoryContainer] 🔍 Starting fetch to /api/vp/history");
      const res = await fetch("/api/vp/history", { cache: "no-store" });
      console.log("[VPHistoryContainer] 📡 Response received:", {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        url: res.url
      });
      if (!res.ok) {
        console.warn("[VPHistoryContainer] ❌ History API not OK:", res.status);
        const errorText = await res.text();
        console.error("[VPHistoryContainer] ❌ Error response body:", errorText.substring(0, 500));
        setItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      console.log("[VPHistoryContainer] 📄 Content-Type:", contentType);
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[VPHistoryContainer] ❌ History API returned non-JSON response");
        const errorText = await res.text();
        console.error("[VPHistoryContainer] ❌ Non-JSON response body:", errorText.substring(0, 500));
        setItems([]);
        return;
      }
      console.log("[VPHistoryContainer] ✅ Parsing JSON...");
      const json = await res.json();
      console.log("[VPHistoryContainer] ✅ JSON parsed successfully:", { ok: json.ok, dataLength: json.data?.length });
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
    load();
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
            const isApproved = item.status === "approved" || item.status === "pending_exec" || item.status === "pending_president";
            const isRejected = item.status === "rejected";
            const actionDate = item.vp_approved_at || item.vp2_approved_at || item.rejected_at;

            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg hover:scale-[1.01]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="rounded-md bg-[#7A0010] px-2.5 py-0.5 text-xs font-bold text-white">
                      {requestNumber}
                    </span>
                    {isApproved && (
                      <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Requester:</span>{" "}
                      <span className="font-medium text-gray-900">{requester}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>{" "}
                      <span className="font-medium text-gray-900">{department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Travel Date:</span>{" "}
                      <span className="font-medium text-gray-900">{travelDate}</span>
                    </div>
                  </div>
                  {actionDate && (
                    <div className="mt-2 text-xs text-gray-500">
                      Actioned on {new Date(actionDate).toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <VPRequestModal
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
    </div>
  );
}

