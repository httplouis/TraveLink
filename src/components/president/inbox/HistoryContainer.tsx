"use client";

import React from "react";
import { FileText } from "lucide-react";
import FilterBar from "@/components/common/FilterBar";
import StatusBadge from "@/components/common/StatusBadge";
import { NoSearchResults } from "@/components/common/EmptyState";

export default function PresidentHistoryContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<any>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/president/history", { cache: "no-store" });
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
    load();
  }, []);

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

      {filteredItems.length === 0 ? (
        <NoSearchResults query={searchQuery} />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-semibold text-gray-900">{item.request_number || "—"}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{item.purpose || "No purpose"}</p>
                <p className="text-xs text-gray-500">
                  {item.requester_name || item.requester?.name || "Unknown"} • {item.department?.name || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

