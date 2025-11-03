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
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No requests assigned to you.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const to = item.payload?.travelOrder ?? {};
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-5 py-4 text-left shadow-sm hover:border-[#7A0010]/50"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {to.requestingPerson ?? "Requesting person"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(to.department as string) ?? "—"} •{" "}
                    {to.purposeOfTravel ?? to.purpose ?? "No purpose indicated"}
                  </p>
                </div>
                <span className="rounded-md bg-[#7A0010]/10 px-4 py-1 text-sm font-medium text-[#7A0010]">
                  Approve
                </span>
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
