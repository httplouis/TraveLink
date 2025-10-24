"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import { MaintForm } from "./MaintForm.ui";

export default function NewReportModal({
  open, initial, onClose, onSubmit,
}: {
  open: boolean;
  initial?: Maintenance;
  onClose: () => void;
  onSubmit: (data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history">) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40" onClick={onClose}>
      <div className="w-[min(760px,96vw)] rounded-2xl bg-white p-4 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{initial ? "Edit Maintenance" : "Add Maintenance"}</h2>
          <button className="border rounded-md px-2 py-1 bg-white" onClick={onClose}>Close</button>
        </div>
        <MaintForm initial={initial} onCancel={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
