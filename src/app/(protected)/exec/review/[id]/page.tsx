// src/app/(protected)/exec/review/[id]/page.tsx
"use client";

import * as React from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

export default function ExecReviewPage() {
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

  const approve = () => {
    if (!sig) return;
    AdminRequestsRepo.executiveApprove(row.id, { signature: sig, by: "Executive" });
    // After final approve, you may redirect to a "done" screen or an exec inbox
    router.push("/exec/review/" + encodeURIComponent(row.id));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Executive — Review</h1>
        <span className="text-xs text-neutral-500">ID: {row.id}</span>
      </div>

      <section className="rounded-xl border p-4 space-y-1 text-sm">
        <div><span className="font-medium">Requester:</span> {row.travelOrder?.requestingPerson ?? "—"}</div>
        <div><span className="font-medium">Department:</span> {row.travelOrder?.department ?? "—"}</div>
        <div><span className="font-medium">Purpose:</span> {row.travelOrder?.purposeOfTravel ?? "—"}</div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 text-sm font-semibold">Final Approve — Signature</h2>
        <SignaturePad height={220} value={null} onSave={setSig} onClear={() => setSig(null)} hideSaveButton />
        <div className="mt-3 flex gap-2">
          <button
            onClick={approve}
            disabled={!sig}
            className={`rounded-md px-4 py-2 text-sm text-white ${sig ? "bg-green-600 hover:bg-green-700" : "bg-neutral-400 cursor-not-allowed"}`}
          >
            Final Approve
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
