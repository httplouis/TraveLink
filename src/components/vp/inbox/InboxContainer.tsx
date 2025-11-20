"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VPRequestModal from "@/components/vp/VPRequestModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import RequestCardEnhanced from "@/components/common/RequestCardEnhanced";
import { Eye, Search, FileText } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonRequestCard } from "@/components/common/SkeletonLoader";
import { createLogger } from "@/lib/debug";

export default function VPInboxContainer() {
  console.log("[VPInboxContainer] 🚀 Component mounting");
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const logger = createLogger("VPInbox");

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      logger.info("Loading VP requests...");
      console.log("[VPInboxContainer] 🔍 Starting fetch to /api/vp/inbox");
      const res = await fetch("/api/vp/inbox", { cache: "no-store" });
      console.log("[VPInboxContainer] 📡 Response received:", {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        url: res.url
      });
      if (!res.ok) {
        logger.error("API response not OK:", res.status, res.statusText);
        const errorText = await res.text();
        console.error("[VPInboxContainer] ❌ Error response body:", errorText.substring(0, 500));
        setItems([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      console.log("[VPInboxContainer] 📄 Content-Type:", contentType);
      if (!contentType || !contentType.includes("application/json")) {
        logger.error("API returned non-JSON response. Content-Type:", contentType);
        const errorText = await res.text();
        console.error("[VPInboxContainer] ❌ Non-JSON response body:", errorText.substring(0, 500));
        setItems([]);
        return;
      }
      console.log("[VPInboxContainer] ✅ Parsing JSON...");
      const json = await res.json();
      console.log("[VPInboxContainer] ✅ JSON parsed successfully:", { ok: json.ok, dataLength: json.data?.length });
      if (json.ok) {
        setItems(json.data ?? []);
        logger.success(`Loaded ${json.data?.length || 0} VP requests`);
      } else {
        logger.warn("Failed to load VP requests:", json.error);
      }
    } catch (error) {
      logger.error("Error loading VP requests:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  React.useEffect(() => {
    console.log("[VPInboxContainer] 🔄 useEffect running, starting load...");
    let isMounted = true;
    let mutateTimeout: NodeJS.Timeout | null = null;
    let channel: any = null;
    
    // Initial load
    load().catch((err) => {
      console.error("[VPInboxContainer] ❌ Error in initial load:", err);
      setLoading(false);
    });
    
    // Set up real-time subscription
    const supabase = createSupabaseClient();
    console.log("[VPInboxContainer] Setting up real-time subscription...");
    
    channel = supabase
      .channel("vp-inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          if (!isMounted) return;
          
          const newStatus = (payload.new as any)?.status;
          const oldStatus = (payload.old as any)?.status;
          
          // Only react to changes that affect VP inbox statuses
          const vpStatuses = ['pending_vp', 'pending_president', 'approved', 'rejected'];
          if (vpStatuses.includes(newStatus) || vpStatuses.includes(oldStatus)) {
            console.log("[VPInboxContainer] 🔄 Real-time change detected:", payload.eventType, newStatus);
            
            if (mutateTimeout) clearTimeout(mutateTimeout);
            mutateTimeout = setTimeout(() => {
              if (isMounted) {
                load(false);
              }
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (mutateTimeout) clearTimeout(mutateTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleApproved = (id: string) => {
    setSelected(null);
    load();
  };

  const handleRejected = (id: string) => {
    setSelected(null);
    load();
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.request_number?.toLowerCase().includes(query) ||
      item.requester_name?.toLowerCase().includes(query) ||
      item.requester?.name?.toLowerCase().includes(query) ||
      item.purpose?.toLowerCase().includes(query) ||
      item.destination?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            <div className="h-5 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>
        {/* Search Skeleton */}
        <div className="h-12 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
        {/* Request Cards Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by request number, purpose, or destination..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
        />
      </div>

      {/* Request List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? "No results found" : "No pending requests"}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? "Try a different search term" : "Requests awaiting VP approval will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RequestCardEnhanced
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
                    requester_name: item.requester_name || item.requester?.name,
                    requester: {
                      name: item.requester_name || item.requester?.name || "Unknown",
                      email: item.requester?.email,
                      profile_picture: item.requester?.profile_picture,
                      department: item.department?.name,
                      position: item.requester?.position_title,
                    },
                    department: item.department,
                  }}
                  showActions={true}
                  onView={() => setSelected(item)}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {selected && (
        <VPRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}

