"use client";

import * as React from "react";
import type { Maintenance, MaintHistoryItem } from "@/lib/admin/maintenance/types";
import AttachmentBadges from "../ui/AttachmentBadges.ui";

type Props = {
  open: boolean;
  row: Maintenance | null;
  onClose: () => void;
};

export default function MaintenanceDrawer({ open, row, onClose }: Props) {
  if (!open || !row) return null;

  return (
    <div className="p-4">
      <section className="space-y-2">
        <div className="text-neutral-500 mb-2">Description</div>
        <div className="text-neutral-800">{row.description}</div>
      </section>

      <section className="mt-6">
        <div className="text-neutral-500 mb-2">Attachments</div>
        <AttachmentBadges items={row.attachments || []} />
      </section>

      <section className="mt-6">
        <div className="text-neutral-500 mb-2">History</div>
        <div className="space-y-2">
          {(row.history || []).map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[#7a1f2a]" />
              <div className="text-xs text-neutral-600">
                {new Date(h.atISO).toLocaleString()} • {h.actor}
                {Boolean((h as any).notes) && (
                  <span className="text-neutral-700"> — {(h as any).notes}</span>
                )}
              </div>
            </div>
          ))}
          {!row.history?.length && <div className="text-neutral-400 italic">No history</div>}
        </div>
      </section>
    </div>
  );
}
