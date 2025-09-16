"use client";

import { CAMPUSES, MaintSeverity, MaintVehicle, MaintVehicleType, SEVERITIES, VEHICLE_TYPES } from "@/lib/maintenanceDomain";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const BRAND = "#7A0010";

export type MaintenanceFormValues = {
  title: string;
  description: string;
  campus: string;
  vehicleType?: MaintVehicleType | "Any";
  vehicleId: string;
  severity: MaintSeverity;
  dueDate?: string; // ISO
  markOutOfService?: boolean;
};

export default function MaintenanceFormModal({
  open,
  onClose,
  onSubmit,
  vehicles,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: MaintenanceFormValues) => void;
  vehicles: MaintVehicle[];
}) {
  const [v, setV] = useState<MaintenanceFormValues>({
    title: "",
    description: "",
    campus: "Lucena",
    vehicleType: "Any",
    vehicleId: "",
    severity: "Medium",
    dueDate: undefined,
    markOutOfService: false,
  });

  useEffect(() => {
    if (!open) {
      setV({
        title: "",
        description: "",
        campus: "Lucena",
        vehicleType: "Any",
        vehicleId: "",
        severity: "Medium",
        dueDate: undefined,
        markOutOfService: false,
      });
    }
  }, [open]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(x =>
      x.campus === v.campus && (v.vehicleType === "Any" || !v.vehicleType || x.type === v.vehicleType)
    );
  }, [vehicles, v.campus, v.vehicleType]);

  if (!open) return null;

  const valid = v.title.trim().length > 0 && v.vehicleId;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">New maintenance ticket</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <L label="Title">
              <input className="input" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g., Brake pads grinding" />
            </L>
            <L label="Campus">
              <select className="input" value={v.campus} onChange={(e) => setV({ ...v, campus: e.target.value })}>
                {CAMPUSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </L>
          </div>

          <L label="Description">
            <textarea className="input min-h-[88px]" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Describe the issue…" />
          </L>

          <div className="grid md:grid-cols-3 gap-3">
            <L label="Vehicle type">
              <select className="input" value={v.vehicleType ?? "Any"} onChange={(e) => setV({ ...v, vehicleType: e.target.value as any })}>
                {["Any", ...VEHICLE_TYPES].map(t => <option key={t}>{t}</option>)}
              </select>
            </L>
            <L label="Vehicle">
              <select className="input" value={v.vehicleId} onChange={(e) => setV({ ...v, vehicleId: e.target.value })}>
                <option value="">Select vehicle…</option>
                {filteredVehicles.map(x => <option key={x.id} value={x.id}>{x.name} • {x.id} • {x.plate}</option>)}
              </select>
            </L>
            <L label="Severity">
              <select className="input" value={v.severity} onChange={(e) => setV({ ...v, severity: e.target.value as MaintSeverity })}>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </L>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <L label="Due date">
              <input
                type="date"
                className="input"
                value={v.dueDate?.slice(0,10) ?? ""}
                onChange={(e) => setV({ ...v, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </L>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={v.markOutOfService}
                onChange={(e) => setV({ ...v, markOutOfService: e.target.checked })}
                className="accent-[#7A0010]"
              />
              <span className="text-sm text-neutral-700">Mark vehicle Out of Service</span>
            </label>
          </div>
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded-md border hover:bg-neutral-50" onClick={onClose}>Cancel</button>
          <button
            className={`px-3 py-2 rounded-md text-white ${!valid ? "opacity-60 cursor-not-allowed" : ""}`}
            style={{ background: BRAND }}
            onClick={() => valid && onSubmit(v)}
            disabled={!valid}
          >
            Create
          </button>
        </div>
      </div>

      <style jsx>{`
        .input { @apply w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none text-sm; }
      `}</style>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
