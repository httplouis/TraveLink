"use client";
import * as React from "react";
import { Filter as FilterIcon, ChevronDown } from "lucide-react";
import type { ScheduleFilterState } from "@/lib/admin/schedule/filters";
import { ScheduleRepo } from "@/lib/admin/schedule/store";

const statuses: Array<ScheduleFilterState["status"]> = [
  "All",
  "PLANNED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

// Local, tiny outside-click hook (so no missing import errors)
function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onClickOutside: () => void
) {
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClickOutside();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ref, onClickOutside]);
}

export default function ScheduleFilterDropdownUI({
  draft,
  onDraftChange,
  onApply,
  onClearAll,
}: {
  draft: ScheduleFilterState;
  onDraftChange: (n: Partial<ScheduleFilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  useOutsideClick(ref, () => setOpen(false));

  const drivers = ScheduleRepo.constants.drivers;
  const vehicles = ScheduleRepo.constants.vehicles;

  // ✅ define as a normal function so TSX doesn’t think it’s JSX
  function set<K extends keyof ScheduleFilterState>(
    k: K,
    v: ScheduleFilterState[K]
  ) {
    onDraftChange({ [k]: v } as Pick<ScheduleFilterState, K>);
  }

  const hasActive =
    draft.status !== "All" ||
    draft.driver !== "All" ||
    draft.vehicle !== "All" ||
    !!draft.from ||
    !!draft.to ||
    !!(draft.search && draft.search.trim());

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm hover:bg-neutral-50"
      >
        <FilterIcon
          className={`h-4 w-4 ${
            hasActive ? "text-[#7a1f2a]" : "text-neutral-500"
          }`}
        />
        <span>Filter</span>
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </button>

      {open && (
        <div
          className="absolute left-0 z-30 mt-2 w-[340px] rounded-xl border border-neutral-200 bg-white p-3 text-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Field label="Status">
            <select
              className="w-full rounded-lg border px-2 py-2"
              value={draft.status}
              onChange={(e) => set("status", e.target.value as any)}
            >
              {statuses.map((s) => (
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
              onChange={(e) =>
                set("vehicle", (e.target.value as any) || "All")
              }
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

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() => {
                onClearAll();
                setOpen(false);
              }}
            >
              Clear All
            </button>
            <button
              className="rounded-lg bg-[#7a1f2a] px-3 py-2 text-sm font-medium text-white"
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 space-y-1">
      <div className="text-xs font-medium text-neutral-600">{label}</div>
      {children}
    </div>
  );
}
