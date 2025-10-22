// src/components/user/schedule/parts/MapHeader.ui.tsx
"use client";

import * as React from "react";
import type { Booking } from "@/lib/user/schedule/types";
import dynamic from "next/dynamic";

// Use the new viewer (client-only)
const MapViewer = dynamic(
  () => import("@/components/common/map/MapViewer.ui"),
  { ssr: false }
);

const DEFAULT_CENTER: [number, number] = [13.9368, 121.6130]; // Lucena-ish

export function MapHeader({
  selectedDateISO,
  topBooking,
}: {
  selectedDateISO: string | null;
  topBooking: Booking | null;
}) {
  const center = DEFAULT_CENTER;

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-md shadow-black/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/70">
        <div className="text-sm font-medium">Location Map</div>
        <div className="text-xs text-neutral-500">
          {selectedDateISO ? `Selected: ${selectedDateISO}` : "Click a date to preview"}
        </div>
      </div>

      <div className="relative h-48 sm:h-56 w-full bg-neutral-50">
        <MapViewer
          center={center}
          zoom={13}
          readOnly
          marker={topBooking ? center : undefined}
          label={topBooking ? topBooking.destination : undefined}
          className="absolute inset-0"
        />

        {/* Overlay summary */}
        {topBooking ? (
          <div className="absolute left-4 bottom-4 rounded-xl border border-neutral-200/70 bg-white/90 backdrop-blur px-4 py-3 shadow">
            <div className="text-sm font-semibold">{topBooking.destination}</div>
            <div className="mt-1 text-xs text-neutral-600">
              {topBooking.vehicle} • Driver {topBooking.driver} • {topBooking.department}
            </div>
            <div className="text-xs text-neutral-600">
              {topBooking.purpose} — {topBooking.departAt} → {topBooking.returnAt}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">
            No reservation selected
          </div>
        )}
      </div>
    </div>
  );
}
