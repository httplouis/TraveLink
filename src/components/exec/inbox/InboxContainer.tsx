"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExecRequestModal from "@/components/exec/ExecRequestModal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import { Eye, Search, FileText } from "lucide-react";

export default function ExecInboxContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/exec/inbox", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.data ?? []);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    const interval = setInterval(() => load(false), 10000); // Poll every 10s
    return () => clearInterval(interval);
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
      item.purpose?.toLowerCase().includes(query)
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
          placeholder="Search by request number, requester, or purpose..."
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
            {searchQuery
              ? "Try adjusting your search terms"
              : "Requests approved by HR will appear here for final executive approval"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const requester = item.requester_name || item.requester?.name || "Unknown";
            const department = item.department?.name || item.department?.code || "Not specified";
            const purpose = item.purpose || "No purpose indicated";
            const requestNumber = item.request_number || "—";
            const travelDate = item.travel_start_date
              ? new Date(item.travel_start_date).toLocaleDateString()
              : "—";

            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-[#7A0010]/30 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
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
                    {purpose}
                  </p>
                  {/* Approval Progress Tracker */}
                  <div className="mt-2">
                    <RequestStatusTracker
                      status={item.status}
                      requesterIsHead={item.requester_is_head}
                      hasBudget={item.has_budget}
                      hasParentHead={item.has_parent_head}
                      compact={true}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <StatusBadge status="pending_exec" size="md" showIcon={true} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrackingRequest(item);
                      setShowTrackingModal(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#7a0019] hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Track
                  </button>
                  <svg className="h-5 w-5 text-slate-300 group-hover:text-[#7A0010] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ExecRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}

      {trackingRequest && (
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingRequest(null);
          }}
          requestId={trackingRequest.id}
        />
      )}
    </div>
  );
}
