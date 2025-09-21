// File: src/components/admin/drivers/ui/DriverDetailsModal.ui.tsx
"use client";
import * as React from "react";
import type { Driver, DriverStatus } from "@/lib/admin/drivers/types";

type Props = {
  open: boolean;
  onClose: () => void;
  d: (Driver & {
    documents?: { label: string; url?: string }[];
  }) | null;
};

export default function DriverDetailsModal({ open, onClose, d }: Props) {
  if (!open || !d) return null;

  const sections = [
    {
      key: "Profile",
      content: (
        <div className="grid gap-2 text-sm">
          <Row label="Code" value={d.code} />
          <Row label="Status" value={<Badge value={d.status} />} />
          <Row label="Hire date" value={d.hireDate ?? "—"} />
          <Row label="Rating" value={d.rating != null ? d.rating.toFixed(1) : "—"} />
          <Row label="Last check-in/out" value={d.lastCheckIn ?? "—"} />
        </div>
      ),
    },
    {
      key: "License",
      content: (
        <div className="grid gap-2 text-sm">
          <Row label="License No." value={d.licenseNo} />
          <Row label="Class" value={d.licenseClass} />
          <Row label="Expiry" value={d.licenseExpiryISO} />
        </div>
      ),
    },
    {
      key: "Assignment",
      content: (
        <div className="text-sm">
          <Row label="Assigned vehicle" value={d.assignedVehicleId ?? "—"} />
        </div>
      ),
    },
    {
      key: "Documents",
      content: (
        <div className="rounded-xl border bg-white p-3 text-sm">
          <div className="font-medium">Documents</div>
          <div className="mt-2 grid gap-2">
            {[
              { label: "License scan", url: d.docLicenseUrl },
              { label: "Government ID", url: d.docGovtIdUrl },
              ...(d.documents ?? []),
            ].map((doc) => (
              <div key={doc.label} className="flex items-center justify-between">
                <span>{doc.label}</span>
                {doc.url ? (
                  <a
                    className="text-blue-600 hover:underline"
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    { key: "Notes", content: <div className="text-sm whitespace-pre-wrap">{d.notes ?? "—"}</div> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Scrollable modal with sticky header */}
      <div
        className="flex w-full max-w-5xl max-h-[90vh] min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-full bg-gray-100">
              {d.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <div className="text-lg font-semibold">
                {d.firstName} {d.lastName}
              </div>
              <div className="text-sm text-gray-500">{d.code}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow hover:bg-red-700 focus:outline-none"
          >
            Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="grid flex-1 min-h-0 gap-4 overflow-y-auto p-4 lg:grid-cols-[340px,1fr]">
          {/* Left column */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border bg-white">
              {d.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.avatarUrl} alt="" className="w-full object-cover" />
              ) : (
                <div className="h-48" />
              )}
            </div>

            <div className="rounded-xl border bg-white p-3 text-sm">
              <div className="font-medium">Contact</div>
              <div className="mt-2 grid gap-2">
                <Row label="Phone" value={d.phone ?? "—"} />
                <Row label="Email" value={d.email ?? "—"} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="flex gap-3 border-b">
              {sections.map((s) => (
                <span key={s.key} className="px-2 py-2 text-sm font-medium">
                  {s.key}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {sections.map((s) => (
                <div key={s.key} className="rounded-xl border bg-white p-4">
                  {s.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* tiny atoms */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function Badge({ value }: { value: DriverStatus }) {
  const cls =
    value === "active"
      ? "bg-green-100 text-green-700"
      : value === "on_trip"
      ? "bg-blue-100 text-blue-700"
      : value === "off_duty"
      ? "bg-gray-100 text-gray-700"
      : value === "suspended"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-200 text-gray-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
