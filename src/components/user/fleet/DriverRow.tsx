"use client";
import * as React from "react";
import { UserRound } from "lucide-react";
import AvailabilityBadge from "./AvailabilityBadge";
import type { DriverPublic } from "@/lib/fleet/publicTypes";

export default function DriverRow({ d }: { d: DriverPublic }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-neutral-100 p-2">
          <UserRound className="h-4 w-4 text-neutral-600" />
        </div>
        <div>
          <div className="text-sm font-medium">{d.nameMasked}</div>
          <div className="text-xs text-neutral-600">
            {d.phoneMasked && <span className="mr-2">Phone {d.phoneMasked}</span>}
            {d.licenseMasked && <span className="mr-2">License {d.licenseMasked}</span>}
            {d.seniority && <span className="mr-2">{d.seniority}</span>}
          </div>
        </div>
      </div>
      <AvailabilityBadge v={d.availability} />
    </div>
  );
}
