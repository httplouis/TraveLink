"use client";

import React from "react";
import { SkeletonRequestCard } from "@/components/common/ui/Skeleton";
import HRRequestModal from "@/components/hr/HRRequestModal";
import RequestStatusTracker from "@/components/common/RequestStatusTracker";
import TrackingModal from "@/components/common/TrackingModal";
import StatusBadge from "@/components/common/StatusBadge";
import PersonDisplay from "@/components/common/PersonDisplay";
import { Eye } from "lucide-react";

export default function HRInboxContainer() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [trackingRequest, setTrackingRequest] = React.useState<any | null>(null);
  const [showTrackingModal, setShowTrackingModal] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/hr/inbox", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        console.log("HR Inbox - Full Response:", json.data);
        if (json.data && json.data.length > 0) {
          console.log("HR Inbox - First Item:", json.data[0]);
          console.log("HR Inbox - First Item Department:", json.data[0].department);
        }
        setItems(json.data ?? []);
        setLastUpdate(new Date());
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  // Initial load
  React.useEffect(() => {
    load();
  }, []);

  // Real-time polling - refresh every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      load(false); // Silent refresh
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  function handleApproved(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => load(false), 500);
  }

  function handleRejected(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
    setTimeout(() => load(false), 500);
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#7A0010]">
              HR Approval Queue
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {items.length} {items.length === 1 ? 'request' : 'requests'} awaiting HR review
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="font-medium" suppressHydrationWarning>
              Auto-refresh • {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRequestCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No requests pending
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Requests approved by Comptroller will appear here for HR review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            // For representative submissions, prioritize requester_name (actual person traveling)
            const requester = item.requester_name || item.requester?.name || item.requester?.email || "Unknown";
            const department = item.department?.name || item.department?.code || item.requester?.department || "Not specified";
            const purpose = item.purpose || "No purpose indicated";
            const requestNumber = item.request_number || "—";
            const travelDate = item.travel_start_date ? new Date(item.travel_start_date).toLocaleDateString() : "—";

            return (
              <div
                key={item.id}
                onClick={() => {
                  console.log("HR Inbox - Clicked Item:", item);
                  console.log("HR Inbox - Clicked Item Department:", item.department);
                  setSelected(item);
                }}
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
                  <StatusBadge status="pending_hr" size="md" showIcon={true} />
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
        <HRRequestModal
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
