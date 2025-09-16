"use client";
import * as React from "react";
import type { FilterState } from "@/lib/admin/types";

type SavedView = { name: string; filters: FilterState };

export default function SavedViewsMenu({
  views,
  onApplyView,
  onSaveCurrent,
  onDeleteView,
}: {
  views: SavedView[];
  onApplyView: (v: SavedView) => void;
  onSaveCurrent: () => void;
  onDeleteView: (name: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button className="rounded border px-3 py-1 text-sm" onClick={() => setOpen((o) => !o)}>
        Saved Views
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded border bg-white p-2 shadow">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Presets</div>
            <button className="text-xs text-blue-600" onClick={onSaveCurrent}>Save current</button>
          </div>
          <div className="mt-2 space-y-1">
            {views.length === 0 && <div className="text-xs text-neutral-500">No presets yet.</div>}
            {views.map((v) => (
              <div key={v.name} className="flex items-center justify-between rounded px-2 py-1 hover:bg-neutral-50">
                <button className="text-sm text-blue-700" onClick={() => onApplyView(v)}>
                  {v.name}
                </button>
                <button className="text-xs text-red-600" onClick={() => onDeleteView(v.name)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
