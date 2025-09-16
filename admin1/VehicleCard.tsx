"use client";
import React from "react";
import CTA from "@/components/ui/Button";
import StatusChip from "@/components/admin/StatusChip";
import { VehicleIcon, IconTrash } from "@/components/ui/Icons";
import type { Vehicle, VehicleStatus } from "@/lib/travilink";

export default function VehicleCard({
  v,
  onStatus,
  onRemove,
}: {
  v: Vehicle;
  onStatus: (id: string, status: VehicleStatus) => void;
  onRemove: (id: string) => void;
}) {
  const available = v.status === "available";

  const handleRemove = () => {
    const ok = window.confirm("Are you sure you want to delete this vehicle?");
    if (!ok) return;
    onRemove(v.id);
  };

  return (
    <div className="snap-start shrink-0 w=[260px] w-[260px] rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 transition-all h-[230px] flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{v.name}</div>
          <div className="text-[11px] text-neutral-500">{v.type}</div>
        </div>
        <StatusChip current={v.status} onChange={(s) => onStatus(v.id, s)} />
      </div>

      <div className="mt-3 flex-1 flex flex-col">
        <div className="text-neutral-700">
          <div className="h-12 w-12 rounded-2xl grid place-items-center bg-[#7A0010]/5 ring-1 ring-[#7A0010]/10">
            <VehicleIcon type={v.type} />
          </div>
        </div>
        <div className="mt-2 h-5 text-xs text-neutral-600 truncate">{v.note ?? ""}</div>
      </div>

      <div className="mt-3 pt-1 flex items-center justify-between gap-2">
        <CTA tone="primary" className="px-3.5 py-1.5" disabled={!available}>
          Schedule
        </CTA>

        <div className="flex items-center gap-1.5">
          <CTA tone="ghost" className="px-2.5 py-1.5">Details</CTA>
          <button
            type="button"
            title="Delete vehicle"
            aria-label={`Delete ${v.name}`}
            onClick={handleRemove}
            className="p-1.5 rounded-md text-neutral-500 transition-colors hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300/50"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
