"use client";
import React from "react";
import type { Schedule } from "@/lib/admin/schedule/types";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import StatusBadge from "./StatusBadge";

type Props = {
  open: boolean;
  data?: Schedule | null;
  onClose: () => void;
};

export default function ScheduleDetailsModal({ open, data, onClose }: Props) {
  const drivers = ScheduleRepo.constants.drivers;
  const vehicles = ScheduleRepo.constants.vehicles;

  // keep hooks order stable
  const driverName =
    drivers.find((d) => d.id === data?.driverId)?.name ?? "—";
  const vehicle =
    vehicles.find((v) => v.id === data?.vehicleId)?.label ?? "—";
  const plate =
    vehicles.find((v) => v.id === data?.vehicleId)?.plateNo ?? "—";

  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold">{data.title}</h3>
            <div className="mt-1 text-xs text-gray-500">
              Created {new Date(data.createdAt).toLocaleString()}
              {data.requestId ? ` • Request #${data.requestId}` : ""}
            </div>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Date">
            {data.date} ({data.startTime}–{data.endTime})
          </Field>
          <Field label="Driver">{driverName}</Field>

          <Field label="Origin">{data.origin}</Field>
          <Field label="Vehicle">
            {vehicle} <span className="text-gray-500">({plate})</span>
          </Field>

          <Field label="Destination" className="sm:col-span-2">
            {data.destination}
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            {data.notes?.trim() ? data.notes : <span className="text-gray-400">—</span>}
          </Field>
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
  <span>Trip ID:</span>
  <code className="rounded bg-gray-50 px-1.5 py-0.5">{data.tripId}</code>
  <button
    onClick={() => navigator.clipboard?.writeText(data.tripId)}
    className="rounded border px-1.5 py-0.5 text-xs"
    title="Copy Trip ID"
  >
    Copy
  </button>
  <span className="ml-2">Created {new Date(data.createdAt).toLocaleString()}</span>
  {data.requestId ? <span> • Request #{data.requestId}</span> : null}
</div>


        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            onClick={onClose}
            className="h-10 rounded-md border px-4"
            aria-label="Close details"
          >
            Close
          </button>
        </div>
      </div>
      

      {/* click outside to close */}
      <button
        className="fixed inset-0 cursor-default"
        aria-hidden
        onClick={onClose}
      />
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{children}</div>
    </div>
  );
}
