"use client";

import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/maintenance.types";
import MaintForm from "@/components/admin/maintenance/forms/MaintForm.ui";

type Props = {
  open: boolean;
  initial?: Partial<Maintenance>;
  onClose: () => void;
  onSubmit?: (m: Maintenance) => void;
};

export default function NewReportModal({ open, initial, onClose, onSubmit }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="text-lg font-semibold mb-2">New Maintenance Report</div>

        <MaintForm
          initial={initial}
          onCancel={onClose}
          onSubmit={(m) => onSubmit?.(m)}
        />
      </div>
    </div>
  );
}
