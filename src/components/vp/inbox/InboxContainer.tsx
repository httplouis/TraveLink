"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import VPRequestModal from "@/components/vp/VPRequestModal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import { Eye, Search, FileText } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function VPInboxContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/vp/inbox", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data ?? []);
      }
    } finally {
      if (showLoader) setLoading(false);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
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
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const requester = item.requester_name || item.requester?.name || item.requester?.email || "Unknown";
            const department = item.department?.name || item.department?.code || "Not specified";
            const purpose = item.purpose || "No purpose indicated";
            const requestNumber = item.request_number || "—";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-semibold text-gray-900">{requestNumber}</span>
                    {item.vp_approved_by && !item.vp2_approved_by && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        First VP Approved
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{purpose}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <PersonDisplay 
                      name={requester || "Unknown"} 
                      email={item.requester?.email} 
                      size="sm" 
                    />
                    <span>{department}</span>
                    {item.vp_approver && (
                      <span className="text-blue-600">
                        Approved by {item.vp_approver.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Time of Receive */}
                  {item.created_at && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">
                        Time of receive: <span className="font-medium text-gray-700">
                          {new Date(item.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                  
                  {/* Routing Information - Who sent this to VP */}
                  {(item.sent_by || item.routed_from || item.assigned_to_vp) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {item.sent_by && item.routed_from && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-medium">
                            Sent by: <span className="font-semibold">{item.sent_by}</span>
                            {item.routing_details?.position && (
                              <span className="text-purple-600"> ({item.routing_details.position})</span>
                            )}
                          </span>
                        )}
                        {item.routed_from && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                            Routed from: <span className="font-medium">{item.routed_from}</span>
                          </span>
                        )}
                        {item.assigned_to_vp && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md">
                            Assigned to: <span className="font-semibold">{item.assigned_to_vp.name}</span>
                            {item.assigned_to_vp.position && (
                              <span className="text-green-600"> ({item.assigned_to_vp.position})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrackingRequest(item);
                      setShowTrackingModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-[#7A0010] transition-colors"
                    title="View tracking"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
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

      {/* Tracking Modal */}
      {showTrackingModal && trackingRequest && (
        <TrackingModal
          requestId={trackingRequest.id}
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingRequest(null);
          }}
        />
      )}
    </div>
  );
}

