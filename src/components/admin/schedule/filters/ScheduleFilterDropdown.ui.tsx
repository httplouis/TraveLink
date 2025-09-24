"use client";
import * as React from "react";
import { Filter as FilterIcon, ChevronDown } from "lucide-react";
import type { ScheduleFilterState } from "@/lib/admin/schedule/filters";

/** View-only types */
export type DriverOption = { id: string; name: string };
export type VehicleOption = { id: string; label: string; plateNo: string };

/** Close on outside click (single root ref) */
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const n = ref.current;
      if (!n) return;
      if (!n.contains(e.target as Node)) onOutside();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [ref, onOutside]);
}

const STATUSES: Array<ScheduleFilterState["status"]> = [
  "All",
  "PLANNED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

export default function ScheduleFilterDropdownUI({
  draft,
  onDraftChange,
  onApply,
  onClearAll,
  drivers: driversProp,
  vehicles: vehiclesProp,
}: {
  draft: ScheduleFilterState;
  onDraftChange: (n: Partial<ScheduleFilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
  drivers?: DriverOption[];   // optional → defensive default
  vehicles?: VehicleOption[]; // optional → defensive default
}) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [alignRight, setAlignRight] = React.useState(false);
  useOutsideClick(rootRef, () => setOpen(false));

  // ✅ Defensive defaults prevent .map on undefined
  const drivers = driversProp ?? [];
  const vehicles = vehiclesProp ?? [];

  function set<K extends keyof ScheduleFilterState>(k: K, v: ScheduleFilterState[K]) {
    onDraftChange({ [k]: v } as Pick<ScheduleFilterState, K>);
  }

  const hasActive =
    draft.status !== "All" ||
    draft.driver !== "All" ||
    draft.vehicle !== "All" ||
    !!draft.from ||
    !!draft.to ||
    !!(draft.search && draft.search.trim());

  function toggle() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const PANEL_W = 300;
      const gutter = 12;
      setAlignRight(window.innerWidth - r.left < PANEL_W + gutter);
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm hover:bg-neutral-50"
      >
        <FilterIcon className={`h-4 w-4 ${hasActive ? "text-[#7a1f2a]" : "text-neutral-500"}`} />
        <span>Filter</span>
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-[300px] rounded-xl border border-neutral-200 bg-white text-sm shadow-2xl"
          style={alignRight ? { right: 0 } : { left: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 pt-3 pb-2">
            <Field label="Status">
              <select
                className="w-full rounded-lg border px-2 py-2"
                value={draft.status}
                onChange={(e) => set("status", e.target.value as any)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Driver">
              <select
                className="w-full rounded-lg border px-2 py-2"
                value={draft.driver}
                onChange={(e) => set("driver", (e.target.value as any) || "All")}
              >
                <option value="All">All</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Vehicle">
              <select
                className="w-full rounded-lg border px-2 py-2"
                value={draft.vehicle}
                onChange={(e) => set("vehicle", (e.target.value as any) || "All")}
              >
                <option value="All">All</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} ({v.plateNo})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="From">
                <input
                  type="date"
                  className="w-full rounded-lg border px-2 py-2"
                  value={draft.from || ""}
                  onChange={(e) => set("from", (e.target.value as any) || "")}
                />
              </Field>
              <Field label="To">
                <input
                  type="date"
                  className="w-full rounded-lg border px-2 py-2"
                  value={draft.to || ""}
                  onChange={(e) => set("to", (e.target.value as any) || "")}
                />
              </Field>
            </div>

            <Field label="Mode">
              <select
                className="w-full rounded-lg border px-2 py-2"
                value={draft.mode}
                onChange={(e) => set("mode", e.target.value as any)}
              >
                <option value="auto">Auto (instant)</option>
                <option value="apply">Apply (manual)</option>
              </select>
            </Field>
          </div>

          <div className="flex gap-2 border-t bg-white px-3 py-2">
            <button
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              onClick={() => {
                onClearAll();
                setOpen(false);
              }}
            >
              Clear All
            </button>
            <button
              className="flex-1 rounded-lg bg-[#7a1f2a] px-3 py-2 text-sm font-medium text-white"
              onClick={() => {
                if (draft.mode === "apply") onApply();
                setOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 space-y-1">
      <div className="text-xs font-medium text-neutral-600">{label}</div>
      {children}
    </div>
  );
}
