// src/app/(protected)/head/inbox/page.tsx
"use client";

import React from "react";
import HeadRequestModal from "@/components/head/HeadRequestModal";

export default function HeadInboxPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/head", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setItems(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function handleApproved(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
  }

  function handleRejected(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
    setSelected(null);
  }

  return (
    <div className="min-h-screen bg-[#EEF0F5] px-6 py-6">
      <h1 className="mb-6 text-2xl font-semibold text-[#7A0010]">
        Requests for endorsement
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#7A0010] border-r-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">Loading requests...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">No requests pending</h3>
          <p className="mt-1 text-sm text-slate-500">
            When faculty submit requests, they will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const requester = item.requester?.name || "Unknown";
            const department = item.department?.name || item.department?.code || "—";
            const purpose = item.purpose || "No purpose indicated";
            const requestNumber = item.request_number || "—";
            const travelDate = item.travel_start_date ? new Date(item.travel_start_date).toLocaleDateString() : "—";
            
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-6 py-4 text-left shadow-sm transition-all hover:border-[#7A0010] hover:shadow-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-[#7A0010]/10 px-2.5 py-0.5 text-xs font-semibold text-[#7A0010]">
                      {requestNumber}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{travelDate}</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">
                    {requester}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-1">
                    {purpose}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {department}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 group-hover:bg-amber-100">
                    Pending Review
                  </span>
                  <svg className="h-5 w-5 text-slate-400 group-hover:text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <HeadRequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </div>
  );
}
