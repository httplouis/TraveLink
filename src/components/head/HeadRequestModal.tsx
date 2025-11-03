// src/components/head/HeadRequestModal.ui.tsx
"use client";

import React from "react";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";
import type { HeadInboxItem } from "@/app/(protected)/head/inbox/page";

type Props = {
  request: HeadInboxItem;
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
  const t = request.payload?.travelOrder ?? {};
  const [headName, setHeadName] = React.useState<string>(
    request.head_signed_by ?? "Department Head"
  );
  const [headSignature, setHeadSignature] = React.useState<string>(
    request.head_signature ?? ""
  );
  const [submitting, setSubmitting] = React.useState(false);

  const costs = t.costs ?? {};
  const totalCost =
    (costs.food ?? 0) +
    (costs.driversAllowance ?? 0) +
    (costs.rentVehicles ?? 0) +
    (costs.hiredDrivers ?? 0) +
    (costs.accommodation ?? 0) +
    (costs.otherAmount ?? 0);

  async function doApprove() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/head", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          action: "approve",
          head_name: headName,
          head_signature: headSignature,
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
          head_name: headName,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 py-10">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Request details
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT */}
          <div className="space-y-5">
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Requesting person
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {t.requestingPerson ?? "Requesting person"}
              </p>
              <p className="text-xs text-slate-500">
                {t.department ?? "No department indicated"}
              </p>
            </section>

            <div className="flex flex-wrap gap-8">
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Purpose
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {t.purpose ?? t.purposeOfTravel ?? "No purpose indicated"}
                </p>
              </section>
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Travel dates
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {t.departureDate && t.returnDate
                    ? `${t.departureDate} – ${t.returnDate}`
                    : "—"}
                </p>
              </section>
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Vehicle mode
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {t.vehicleMode ?? "Not specified"}
                </p>
              </section>
            </div>

            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Trip details
              </p>
              <p className="mt-2 text-sm text-slate-800">
                {t.destination ?? "No destination provided."}
              </p>
            </section>

            {/* requester sig */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Requesting person’s signature
              </p>
              {t.requesterSignature ? (
                <div className="mt-2 flex h-[90px] items-center justify-center">
                  <img
                    src={t.requesterSignature}
                    alt="Requester signature"
                    className="h-[70px] object-contain"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-slate-400">
                  No signature provided by requester.
                </p>
              )}
            </section>

            {/* costs */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Travel cost (estimate)
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                {costs.food ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>Food</span>
                    <span className="font-semibold">{peso(costs.food)}</span>
                  </div>
                ) : null}
                {costs.driversAllowance ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>Driver&apos;s allowance</span>
                    <span className="font-semibold">
                      {peso(costs.driversAllowance)}
                    </span>
                  </div>
                ) : null}
                {costs.rentVehicles ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>Rent vehicles</span>
                    <span className="font-semibold">
                      {peso(costs.rentVehicles)}
                    </span>
                  </div>
                ) : null}
                {costs.hiredDrivers ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>Hired drivers</span>
                    <span className="font-semibold">
                      {peso(costs.hiredDrivers)}
                    </span>
                  </div>
                ) : null}
                {costs.accommodation ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>Accommodation</span>
                    <span className="font-semibold">
                      {peso(costs.accommodation)}
                    </span>
                  </div>
                ) : null}
                {costs.otherAmount ? (
                  <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>{costs.otherLabel ?? "Other"}</span>
                    <span className="font-semibold">
                      {peso(costs.otherAmount)}
                    </span>
                  </div>
                ) : null}
              </div>
              {totalCost > 0 ? (
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Total: {peso(totalCost)}
                </p>
              ) : null}
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Department head endorsement
            </p>

            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Endorsed by (name)
              </label>
              <input
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#7A0010]"
              />
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
              <p className="mt-1 text-[10px] text-slate-400">
                This will be saved with the approval.
              </p>
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
