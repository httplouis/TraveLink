"use client";
import { ClipboardList, Info } from "lucide-react";

/** Local minimal types so we don't depend on '@/app/lib/mock' */
type VehicleStatus = "available" | "offline" | "maintenance";
type Vehicle = { id: string; name: string; type: string; status: VehicleStatus };

function StatusPill({ s }: { s: VehicleStatus }) {
  const map: Record<VehicleStatus, string> = {
    available: "bg-green-50 text-green-700 border-green-200",
    maintenance: "bg-gray-100 text-gray-700 border-gray-200",
    offline: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const label = s === "available" ? "Available" : "Unavailable";
  return <span className={`pill ${map[s]}`}>{label}</span>;
}

export default function VehicleCard({ v }: { v: Vehicle }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-tl.gray3">{v.type}</div>
          <div className="text-lg font-semibold">{v.name}</div>
        </div>
        <StatusPill s={v.status} />
      </div>

      <div className="h-24 my-4 grid place-items-center rounded-xl border border-dashed border-tl-line bg-gray-50 text-tl.gray4 text-sm">
        Vehicle image
      </div>

      <div className="flex gap-2">
        <button className="btn">
          <ClipboardList size={16} /> Schedule
        </button>
        <button className="btn">
          <Info size={16} /> Details
        </button>
      </div>
    </div>
  );
}
