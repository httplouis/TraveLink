// src/app/(protected)/head/requests/page.tsx
"use client";

import React from "react";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

type TravelOrderPayload = {
  requestingPerson?: string;
  department?: string;
  purpose?: string;
  purposeOfTravel?: string;
};

type PendingHeadRequest = {
  id: string;
  payload: {
    travelOrder?: TravelOrderPayload;
  } | null;
  created_at?: string | null;
  current_status?: string | null;
};

export default function HeadRequestsPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/requests/list?status=pending_head",
    fetcher
  );

  async function endorse(id: string) {
    const res = await fetch("/api/requests/head", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        action: "approve",
        head_name: "Dean Roberto Cruz", // temp value, palitan mo from logged-in user
      }),
    });

    const json = await res.json();
    if (json.ok) {
      mutate();
    } else {
      alert("Approve failed: " + (json.error ?? "unknown error"));
    }
  }

  async function reject(id: string) {
    const res = await fetch("/api/requests/head", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        action: "reject",
        head_name: "Dean Roberto Cruz",
      }),
    });

    const json = await res.json();
    if (json.ok) {
      mutate();
    } else {
      alert("Reject failed: " + (json.error ?? "unknown error"));
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading head requests…</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        Error loading requests: {String(error)}
      </div>
    );
  }

  const items: PendingHeadRequest[] = data?.data ?? [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Requests for Head Endorsement
        </h1>
        <button
          onClick={() => mutate()}
          className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>

      {!items.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No requests waiting for endorsement.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => {
            const t = req.payload?.travelOrder ?? {};
            const name = t.requestingPerson ?? "Unknown person";
            const dept = t.department ?? "—";
            const purpose = t.purpose ?? t.purposeOfTravel ?? "No purpose";

            return (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">
                    {dept} • {purpose}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => reject(req.id)}
                    className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => endorse(req.id)}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                  >
                    Endorse
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
