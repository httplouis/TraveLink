"use client";

import { Driver, Vehicle, VEHICLE_TYPES, VehicleType } from "@/lib/schedule";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const MAROON = "#7A0010";

export type ScheduleFormValues = {
  title: string;
  campus: string;
  date: string;      // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  passengers?: number;
  vehicleType?: VehicleType | "Any";
  vehicleId?: string;
  driverId?: string;
  notes?: string;
};

export default function ScheduleFormModal({
  open,
  onClose,
  onSubmit,
  vehicles,
  drivers,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: ScheduleFormValues) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  initial?: Partial<ScheduleFormValues>;
}) {
  const [v, setV] = useState<ScheduleFormValues>(() => ({
    title: "",
    campus: "Lucena",
    date: new Date().toISOString().slice(0,10),
    startTime: "09:00",
    endTime: "11:00",
    passengers: 8,
    vehicleType: "Any",
    vehicleId: "",
    driverId: "",
    notes: "",
    ...initial,
  }));

  useEffect(() => {
    if (open) {
      setV((prev) => ({ ...prev, ...initial }));
    }
  }, [open, initial]);

  const vehiclesFiltered = useMemo(() => {
    return vehicles.filter(x =>
      x.campus === v.campus &&
      x.status === "Available" &&
      (v.vehicleType === "Any" || !v.vehicleType || x.type === v.vehicleType)
    );
  }, [vehicles, v.campus, v.vehicleType]);

  const driversFiltered = useMemo(() => {
    return drivers.filter(x => x.campus === v.campus && x.online);
  }, [drivers, v.campus]);

  if (!open) return null;

  const valid = v.title.trim().length > 0 && v.startTime < v.endTime;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">New schedule</div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <L label="Title">
              <input className="input" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g., Campus Shuttle" />
            </L>
            <L label="Campus">
              <select className="input" value={v.campus} onChange={(e) => setV({ ...v, campus: e.target.value })}>
                {["Lucena", "Candelaria", "Saman"].map(c => <option key={c}>{c}</option>)}
              </select>
            </L>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <L label="Date">
              <input type="date" className="input" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
            </L>
            <L label="Start">
              <input type="time" className="input" value={v.startTime} onChange={(e) => setV({ ...v, startTime: e.target.value })} />
            </L>
            <L label="End">
              <input type="time" className="input" value={v.endTime} onChange={(e) => setV({ ...v, endTime: e.target.value })} />
            </L>
            <L label="Passengers">
              <input type="number" min={1} className="input" value={v.passengers ?? 1} onChange={(e) => setV({ ...v, passengers: Number(e.target.value || 1) })} />
            </L>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <L label="Vehicle type">
              <select className="input" value={v.vehicleType ?? "Any"} onChange={(e) => setV({ ...v, vehicleType: e.target.value as any })}>
                {["Any", ...VEHICLE_TYPES].map(t => <option key={t}>{t}</option>)}
              </select>
            </L>
            <L label="Vehicle">
              <select className="input" value={v.vehicleId ?? ""} onChange={(e) => setV({ ...v, vehicleId: e.target.value })}>
                <option value="">(Unassigned)</option>
                {vehiclesFiltered.map(x => <option key={x.id} value={x.id}>{x.name} • {x.id}</option>)}
              </select>
            </L>
            <L label="Driver">
              <select className="input" value={v.driverId ?? ""} onChange={(e) => setV({ ...v, driverId: e.target.value })}>
                <option value="">(Unassigned)</option>
                {driversFiltered.map(x => <option key={x.id} value={x.id}>{x.name} • {x.id}</option>)}
              </select>
            </L>
          </div>

          <L label="Notes">
            <textarea className="input min-h-[88px]" value={v.notes ?? ""} onChange={(e) => setV({ ...v, notes: e.target.value })} placeholder="Optional instructions…" />
          </L>
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded-md border hover:bg-neutral-50" onClick={onClose}>Cancel</button>
          <button
            className={`px-3 py-2 rounded-md text-white ${!valid ? "opacity-60 cursor-not-allowed" : ""}`}
            style={{ background: MAROON }}
            onClick={() => valid && onSubmit(v)}
            disabled={!valid}
          >
            Create
          </button>
        </div>
      </div>
      <style jsx>{`
        .input {
          @apply w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none text-sm;
        }
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
