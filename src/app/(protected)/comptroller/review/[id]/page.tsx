// src/app/(protected)/comptroller/review/[id]/page.tsx
"use client";

import * as React from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

function peso(n?: number) {
  const v = typeof n === "number" && isFinite(n) ? n : 0;
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ComptrollerReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [row, setRow] = React.useState<AdminRequest | null>(null);
  const [sig, setSig] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    const rec = AdminRequestsRepo.get(id);
    setRow(rec ?? null);
  }, [id]);

  if (!id || !row) return notFound();

  const c: any = row.travelOrder?.costs ?? {};
  const total =
    ["food", "driversAllowance", "rentVehicles", "hiredDrivers", "accommodation"].reduce(
      (s, k) => s + (typeof c[k] === "number" ? c[k] : 0),
      0
    ) +
    (Array.isArray(c.otherItems)
      ? c.otherItems.reduce((s: number, it: any) => s + (typeof it?.amount === "number" ? it.amount : 0), 0)
      : 0) +
    (typeof c.otherAmount === "number" ? c.otherAmount : 0);

  const approve = () => {
    if (!sig) return;
    AdminRequestsRepo.comptrollerApprove(row.id, {
      signature: sig,
      by: "Comptroller",
    });
    router.push("/comptroller/inbox");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Comptroller — Review</h1>
        <span className="text-xs text-neutral-500">ID: {row.id}</span>
      </div>

      <section className="rounded-xl border p-4 space-y-2">
        <h2 className="text-sm font-semibold">Summary</h2>
        <div className="text-sm">
          <div><span className="font-medium">Requester:</span> {row.travelOrder?.requestingPerson ?? "—"}</div>
          <div><span className="font-medium">Department:</span> {row.travelOrder?.department ?? "—"}</div>
          <div><span className="font-medium">Purpose:</span> {row.travelOrder?.purposeOfTravel ?? "—"}</div>
          {row.tmNote && <div><span className="font-medium">Admin Note:</span> {row.tmNote}</div>}
        </div>

        <div className="mt-3">
          <h3 className="text-sm font-semibold">Budget Summary</h3>
          <div className="text-sm">
            {["food","driversAllowance","rentVehicles","hiredDrivers","accommodation"].map((k) =>
              c[k] ? (<div key={k} className="flex justify-between"><span>{k}</span><span>{peso(c[k])}</span></div>) : null
            )}
            {Array.isArray(c.otherItems) &&
              c.otherItems.map((it: any, i: number) =>
                it?.amount ? (
                  <div key={i} className="flex justify-between">
                    <span>{it.label}</span><span>{peso(it.amount)}</span>
                  </div>
                ) : null
              )}
            {c.otherLabel && c.otherAmount ? (
              <div className="flex justify-between"><span>{c.otherLabel}</span><span>{peso(c.otherAmount)}</span></div>
            ) : null}
            <div className="mt-2 flex justify-between border-t pt-1 font-semibold">
              <span>Total</span><span>{peso(total)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 text-sm font-semibold">Approve — Signature</h2>
        <SignaturePad height={220} value={null} onSave={setSig} onClear={() => setSig(null)} hideSaveButton />
        <div className="mt-3 flex gap-2">
          <button
            onClick={approve}
            disabled={!sig}
            className={`rounded-md px-4 py-2 text-sm text-white ${sig ? "bg-green-600 hover:bg-green-700" : "bg-neutral-400 cursor-not-allowed"}`}
          >
            Approve &amp; Send to HR
          </button>
          <button
            onClick={() => router.push("/comptroller/inbox")}
            className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
