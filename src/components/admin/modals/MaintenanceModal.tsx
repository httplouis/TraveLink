"use client";

import { useEffect } from "react";

export default function MaintenanceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">New Maintenance Log</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-neutral-100">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600">Vehicle</span>
            <input className="rounded-md border px-2 py-1.5 text-sm" placeholder="e.g., VAN-12" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600">Type</span>
            <select className="rounded-md border px-2 py-1.5 text-sm">
              <option>Corrective</option>
              <option>Preventive</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600">Odometer</span>
            <input type="number" className="rounded-md border px-2 py-1.5 text-sm" placeholder="km" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-600">Date</span>
            <input type="date" className="rounded-md border px-2 py-1.5 text-sm" />
          </label>
          <label className="col-span-full flex flex-col gap-1">
            <span className="text-xs text-neutral-600">Notes</span>
            <textarea className="min-h-[80px] rounded-md border px-2 py-1.5 text-sm" placeholder="Work performed, parts used…" />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">
            Cancel
          </button>
          <button className="rounded-md bg-[#7A0010] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#60000C]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
