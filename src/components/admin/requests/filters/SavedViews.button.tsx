"use client";
import * as React from "react";
import type { FilterState } from "@/lib/admin/types";

const LS_KEY = "travilink.requests.savedViews.v1";

type SavedView = { id: string; name: string; filters: FilterState; createdAt: number };

function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch { return []; }
}
function saveViews(list: SavedView[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export default function SavedViewsButton({
  current,
  onApply,
}: {
  current: FilterState;
  onApply: (f: FilterState) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [views, setViews] = React.useState<SavedView[]>([]);
  const [name, setName] = React.useState("");

  React.useEffect(() => { setViews(loadViews()); }, []);

  function add() {
    const n = name.trim() || defaultName(current);
    const v: SavedView = { id: crypto.randomUUID(), name: n, filters: current, createdAt: Date.now() };
    const next = [v, ...views];
    setViews(next); saveViews(next); setName(""); setOpen(false);
  }
  function del(id: string) {
    const next = views.filter(v => v.id !== id);
    setViews(next); saveViews(next);
  }
  function apply(v: SavedView) {
    onApply(v.filters);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        className="rounded border px-3 py-1 text-sm"
        onClick={() => setOpen(o => !o)}
        title="Saved filter presets"
      >
        Saved Views
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[320px] rounded border bg-white p-3 shadow-lg">
          <div className="mb-2 text-sm font-medium">Saved Views</div>

          {views.length === 0 && (
            <div className="mb-2 text-xs text-neutral-500">No views yet. Save your current filters below.</div>
          )}

          <ul className="mb-3 max-h-56 space-y-1 overflow-auto pr-1">
            {views.map(v => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
                <button
                  className="truncate text-left text-sm text-blue-600 hover:underline"
                  onClick={() => apply(v)}
                  title="Apply this view"
                >
                  {v.name}
                </button>
                <button
                  className="text-xs text-red-600"
                  onClick={() => del(v.id)}
                  title="Delete view"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <input
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="Name this view (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button className="rounded bg-neutral-800 px-3 py-1 text-sm text-white" onClick={add}>
              Save current
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function defaultName(f: FilterState) {
  const parts: string[] = [];
  if (f.status !== "All") parts.push(f.status);
  if (f.dept !== "All") parts.push(f.dept);
  if (f.from || f.to) parts.push(`${f.from || "…"}→${f.to || "…"}`);
  if (f.search) parts.push(`"${f.search}"`);
  return parts.join(" · ") || "My view";
}
