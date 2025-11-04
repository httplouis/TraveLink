// src/components/head/HeadRequestModal.ui.tsx
"use client";

import React from "react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

type Props = {
  request: any;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
};

function peso(n?: number | null) {
  if (!n) return "";
  return `₱ ${Number(n).toLocaleString("en-PH")}`;
}

export default function HeadRequestModal({
  request,
  onClose,
  onApproved,
  onRejected,
}: Props) {
  // New schema: data is directly on request object, not in payload
  const t = request;
  const [headName, setHeadName] = React.useState<string>(
    request.head_signed_by ?? ""
  );
  const [headProfile, setHeadProfile] = React.useState<any>(null);
  const [headSignature, setHeadSignature] = React.useState<string>(
    request.head_signature ?? ""
  );
  const [submitting, setSubmitting] = React.useState(false);

  // Auto-load saved signature and head info
  React.useEffect(() => {
    // Load current user (head) info
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (data.name) {
          setHeadName(data.name);
          setHeadProfile(data);
        }
      });

    // Load saved signature if exists
    if (!headSignature) {
      fetch("/api/signature")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.signature) {
            setHeadSignature(data.signature);
          }
        });
    }
  }, []);

  // New schema uses expense_breakdown array
  const expenseBreakdown = t.expense_breakdown || [];
  const totalCost = t.total_budget || expenseBreakdown.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  async function doApprove() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const approvalDate = new Date().toISOString();
      const res = await fetch("/api/head", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          action: "approve",
          signature: headSignature,
          comments: "",
          approved_at: approvalDate,
        }),
      });
      const j = await res.json();
      if (j.ok) {
        onApproved(request.id);
      } else {
        alert("Approve failed: " + (j.error ?? "unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Approve failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function doReject() {
    // ✅ confirm muna bago mag PATCH
    const ok = window.confirm(
      "Reject this request? The requester will have to resend."
    );
    if (!ok) return;

    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/head", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          action: "reject",
          comments: "",
        }),
      });
      const j = await res.json();
      if (j.ok) {
        onRejected(request.id);
      } else {
        alert("Reject failed: " + (j.error ?? "unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Reject failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-10">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl transform transition-all duration-300 scale-100">
        {/* header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-[#7A0010] to-[#5e000d] px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Request Details
            </h2>
            {t.request_number && (
              <p className="text-sm text-white/80 font-mono">
                {t.request_number}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              t.status === 'pending_head' ? 'bg-amber-100 text-amber-700' :
              t.status === 'approved_head' ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {t.status === 'pending_head' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Review
                </>
              ) : t.status === 'approved_head' ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </>
              ) : (
                t.status || 'Pending'
              )}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* body */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT */}
          <div className="space-y-5">
            <section className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Requesting person
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {t.requester_name || t.requester?.name || t.requester?.email || "Unknown Requester"}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {t.department?.name || t.department?.code || "No department indicated"}
                  </p>
                  {t.created_at && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submitted {new Date(t.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <section className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 flex items-center gap-1.5 mb-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Purpose
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.purpose || "No purpose indicated"}
                </p>
              </section>
              <section className="rounded-lg bg-green-50/50 border border-green-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1.5 mb-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Travel dates
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.travel_start_date && t.travel_end_date
                    ? `${new Date(t.travel_start_date).toLocaleDateString()} – ${new Date(t.travel_end_date).toLocaleDateString()}`
                    : "—"}
                </p>
              </section>
              <section className="rounded-lg bg-purple-50/50 border border-purple-100 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-600 flex items-center gap-1.5 mb-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Vehicle mode
                </p>
                <p className="text-sm text-slate-800 font-medium">
                  {t.vehicle_type || (t.needs_vehicle ? "University Vehicle" : "Not specified")}
                </p>
              </section>
            </div>

            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Trip details
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-sm text-slate-800 flex-1">
                  {t.destination || "No destination provided."}
                </p>
                {t.destination && (
                  <button
                    onClick={() => {
                      const encodedDest = encodeURIComponent(t.destination);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedDest}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                    title="View on Google Maps"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View on Map
                  </button>
                )}
              </div>
            </section>

            {/* requester sig */}
            <section className="rounded-lg bg-amber-50/50 border border-amber-200 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 flex items-center gap-1.5 mb-3">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Requesting person's signature
              </p>
              {t.requesterSignature ? (
                <div className="flex items-center justify-center bg-white rounded-lg border-2 border-amber-200 p-4">
                  <img
                    src={t.requesterSignature}
                    alt="Requester signature"
                    className="h-[80px] max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm italic text-amber-600 bg-white rounded-lg border border-amber-200 p-3">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No signature provided by requester
                </div>
              )}
            </section>

            {/* costs */}
            {expenseBreakdown.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Travel cost (estimate)
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {expenseBreakdown.map((expense: any, idx: number) => (
                    expense.amount > 0 && (
                      <div key={idx} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                        <span>{expense.item || expense.description}</span>
                        <span className="font-semibold">{peso(expense.amount)}</span>
                      </div>
                    )
                  ))}
                </div>
                {totalCost > 0 && (
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Total: {peso(totalCost)}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7A0010] to-[#5e000d] flex items-center justify-center text-white font-bold text-lg">
                {headName ? headName.charAt(0).toUpperCase() : 'H'}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Department Head Endorsement
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {headName || headProfile?.email || "Loading..."}
                </p>
                {headProfile?.department && (
                  <p className="text-xs text-slate-500">
                    {headProfile.department.name || headProfile.department.code}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Signature
              </label>
              <div className="rounded-md bg-white p-2">
                <SignaturePad
                  height={140}
                  initialImage={headSignature || undefined}
                  onSave={(dataUrl) => {
                    setHeadSignature(dataUrl);
                  }}
                  onClear={() => setHeadSignature("")}
                  hideSaveButton
                  className="h-[140px] w-full"
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Sign above to approve this request</span>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
          <button
            onClick={doReject}
            disabled={submitting}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Reject
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={doApprove}
              disabled={submitting || !headSignature}
              className="rounded-md bg-[#7A0010] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5e000d] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Approve"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
