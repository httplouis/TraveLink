"use client";
import React, { useState } from "react";
import CTA from "@/components/ui/Button";
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/travilink";

export default function AddVehicleCard({ onAdd }: { onAdd: (v: Vehicle) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>({
    name: "",
    type: "Bus",
    status: "available",
    note: "",
  });

  const save = () => {
    if (!form.name?.trim()) return;
    const id = "v" + Math.random().toString(36).slice(2, 8);
    onAdd({
      id,
      name: form.name!.trim(),
      type: form.type as VehicleType,
      status: form.status as VehicleStatus,
      note: form.note,
    });
    setOpen(false);
    setForm({ name: "", type: "Bus", status: "available", note: "" });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="snap-start shrink-0 w-[260px] h-[230px] rounded-xl border-2 border-dashed border-[#7A0010]/30 bg-white hover:bg-[#7A0010]/5 hover:-translate-y-0.5 hover:shadow-md transition-all grid place-items-center text-center"
      >
        <div>
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl grid place-items-center bg-[#7A0010]/10 ring-1 ring-[#7A0010]/20">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#7A0010" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="font-semibold text-sm">Add / Register Vehicle</div>
          <div className="text-xs text-neutral-500">Create a new vehicle record</div>
        </div>
      </button>
    );
  }

  return (
    <div className="snap-start shrink-0 w-[260px] h-[230px] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col">
      <div className="text-sm font-semibold mb-2">Register Vehicle</div>
      <div className="space-y-2">
        <input
          className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
          placeholder="Name (e.g., Bus 4)"
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
            value={form.type as string}
            onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
          >
            <option>Bus</option>
            <option>Van</option>
            <option>Car</option>
          </select>
          <select
            className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
            value={form.status as string}
            onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
          >
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <input
          className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
          placeholder="Note (optional)"
          value={form.note ?? ""}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      <div className="mt-auto pt-2 flex items-center justify-between">
        <CTA tone="ghost" className="px-3 py-1.5" onClick={() => setOpen(false)}>Cancel</CTA>
        <CTA tone="primary" className="px-3 py-1.5" onClick={save}>Save</CTA>
      </div>
    </div>
  );
}
