"use client";
import { RequestRow } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  request: RequestRow | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export default function RequestDetailsUI({ open, onClose, request, onApprove, onReject }: Props) {
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        {/* header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request {request.id}</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Label>Department</Label><Value>{request.dept}</Value>
          <Label>Date</Label><Value className="tabular-nums">{request.date}</Value>
          <Label>Status</Label><Value>{statusTag(request.status)}</Value>
          <Label>Requester</Label><Value>{request.requester ?? "—"}</Value>
          <Label>Vehicle</Label><Value>{request.vehicle ?? "—"}</Value>
          <Label>Driver</Label><Value>{request.driver ?? "—"}</Value>

          <div className="col-span-2 mt-3">
            <div className="text-sm font-medium text-neutral-600 mb-1">Purpose</div>
            <div className="rounded border bg-neutral-50 px-3 py-2">{request.purpose}</div>
          </div>
        </div>

        {/* footer */}
        <div className="mt-6 flex justify-end gap-2">
          {request.status === "Pending" && (
            <>
              <button
                onClick={() => onApprove?.(request.id)}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(request.id)}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
              >
                Reject
              </button>
            </>
          )}
          <button onClick={onClose} className="rounded bg-neutral-200 px-3 py-1.5 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-neutral-500">{children}</div>;
}
function Value({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-medium ${className}`}>{children}</div>;
}

function statusTag(s: RequestRow["status"]) {
  const c: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    Completed: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return <span className={`rounded px-2 py-1 text-xs font-medium ${c[s]}`}>{s}</span>;
}
