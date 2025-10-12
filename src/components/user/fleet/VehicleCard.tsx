"use client";
import * as React from "react";
import { Car } from "lucide-react";
import AvailabilityBadge from "./AvailabilityBadge";
import type { VehiclePublic } from "@/lib/fleet/publicTypes";

export default function VehicleCard({ v }: { v: VehiclePublic }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-neutral-100 p-2">
          <Car className="h-5 w-5 text-neutral-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium">{v.label}</div>
            <AvailabilityBadge v={v.availability} />
          </div>
          <div className="mt-1 text-xs text-neutral-600">
            {v.category && <span className="mr-2">• {v.category}</span>}
            {v.capacity != null && <span className="mr-2">• {v.capacity} seats</span>}
            {v.plateMasked && <span className="mr-2">• Plate {v.plateMasked}</span>}
          </div>
          {v.notes && <div className="mt-2 text-sm text-neutral-700">{v.notes}</div>}
        </div>
      </div>
    </div>
  );
}
