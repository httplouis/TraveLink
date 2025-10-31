"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

/* Simple inline signature pad (self-contained) */
function SignaturePad({
  value,
  onChange,
}: { value: string | null; onChange: (v: string | null) => void }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);

  const down = () => { drawing.current = true; };
  const up = () => {
    drawing.current = false;
    const c = ref.current!;
    c.getContext("2d")!.beginPath();
  };
  const pos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        width={640}
        height={180}
        className="w-full rounded border"
        onMouseDown={down}
        onMouseUp={up}
        onMouseLeave={up}
        onMouseMove={move}
      />
      <div className="flex gap-2">
        <button
          className="rounded border px-3 py-1.5"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            onChange(null);
          }}
        >
          Clear
        </button>
        <button
          className="rounded bg-[#7a1f2a] px-3 py-1.5 text-white"
          onClick={() => {
            const c = ref.current!;
            onChange(c.toDataURL("image/png"));
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export default function HeadReviewPage() {
  const params = useParams(); // may be null and may include string[]
  const router = useRouter();

  // Safely normalize the dynamic route param to a string
  const id = React.useMemo(() => {
    const raw = (params as Record<string, string | string[]> | null)?.id;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params]);

  // TODO: wire real auth and head check; for now assume current user is a head
  const currentHead = { id: "HEAD-USER-ID", name: "Department Head" };

  const [req, setReq] = React.useState(() => (id ? AdminRequestsRepo.get(String(id)) : undefined));
  const [sig, setSig] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!id) { setReq(undefined); return; }
    const r = AdminRequestsRepo.get(String(id));
    setReq(r);
    setSig((r as any)?.travelOrder?.endorsedByHeadSignature ?? null);
  }, [id]);

  if (!id) return <div className="p-6">Invalid request.</div>;
  if (!req) return <div className="p-6">Not found.</div>;
  if (req.status !== "pending_head") return <div className="p-6">Already processed.</div>;

  const t = req.travelOrder as any;
  const c = t?.costs || {};

  const approve = () => {
    if (!sig) { alert("Please add a signature first."); return; }
    setBusy(true);
    AdminRequestsRepo.upsert({
      ...req,
      status: "head_approved",
      updatedAt: new Date().toISOString(),
      travelOrder: {
        ...t,
        endorsedByHeadName: currentHead.name,
        endorsedByHeadSignature: sig,
        endorsedAt: new Date().toISOString(),
      },
    });
    setBusy(false);
    router.replace("/head/inbox");
  };

  const reject = () => {
    setBusy(true);
    AdminRequestsRepo.upsert({
      ...req,
      status: "head_rejected",
      updatedAt: new Date().toISOString(),
    });
    setBusy(false);
    router.replace("/head/inbox");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Review & Endorse</h1>
        <div className="text-xs text-neutral-500">Request ID: {req.id}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <div className="space-y-3">
          <div className="text-sm text-neutral-500">Summary</div>
          <div className="space-y-1 rounded-lg border p-4">
            <div><span className="font-medium">Department:</span> {t?.department || "—"}</div>
            <div><span className="font-medium">Purpose:</span> {t?.purposeOfTravel || t?.purpose || "—"}</div>
            <div><span className="font-medium">Destination:</span> {t?.destination || "—"}</div>
            <div><span className="font-medium">Dates:</span> {t?.dateFrom || "—"} → {t?.dateTo || "—"}</div>
            <div><span className="font-medium">Passengers:</span> {t?.passengers?.join(", ") || "—"}</div>
            <div><span className="font-medium">Vehicle Mode:</span> {t?.vehicleMode || "—"}</div>
          </div>

          <div className="text-sm text-neutral-500">Budget (Proposed)</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-4 text-sm">
            {Object.keys(c).length ? (
              Object.entries(c).map(([k, v]) => (
                <React.Fragment key={k}>
                  <div className="capitalize">{k}</div>
                  <div className="text-right">{String(v ?? "—")}</div>
                </React.Fragment>
              ))
            ) : (
              <div className="col-span-2 text-neutral-500">No costs provided.</div>
            )}
          </div>
        </div>

        {/* Signature & Actions */}
        <div className="space-y-3">
          <div className="text-sm text-neutral-500">Head Signature</div>
          <SignaturePad value={sig} onChange={setSig} />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={approve}
              className="rounded-md bg-[#7a1f2a] px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Approving…" : "Approve & Endorse"}
            </button>
            <button
              disabled={busy}
              onClick={reject}
              className="rounded-md border px-4 py-2"
            >
              {busy ? "Processing…" : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
