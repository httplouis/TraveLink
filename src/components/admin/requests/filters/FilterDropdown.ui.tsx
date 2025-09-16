// src/components/admin/requests/filters/FilterDropdown.ui.tsx
"use client";
import * as React from "react";
import type { FilterState } from "@/lib/admin/types";
import useOutsideClick from "../hooks/useOutsideClick";
import { Filter as FilterIcon, ChevronDown } from "lucide-react";

const statuses: Array<FilterState["status"]> = [
  "All",
  "Pending",
  "Approved",
  "Completed",
  "Rejected",
];
const depts: Array<FilterState["dept"]> = ["All", "CCMS", "HR", "Registrar", "Finance"];

export default function FilterDropdownUI({
  draft,
  onDraftChange,
  onApply,
  onClearAll,
}: {
  draft: FilterState;
  onDraftChange: (n: Partial<FilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => setOpen(false));

  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onDraftChange({ [k]: v } as Pick<FilterState, K>);

  // highlight icon if any filter is active
  const hasActive =
    draft.status !== "All" ||
    draft.dept !== "All" ||
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
        {/* 🔎 Filter icon */}
        <FilterIcon className={`h-4 w-4 ${hasActive ? "text-[#7a1f2a]" : "text-neutral-500"}`} />
        <span>Filter</span>
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </button>

      {open && (
        <div
          className="absolute left-0 z-30 mt-2 w-[320px] rounded-xl border border-neutral-200 bg-white p-3 text-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Field label="Status">
            <select
              className="w-full rounded-lg border px-2 py-2"
              value={draft.status}
              onChange={(e) => set("status", e.target.value as FilterState["status"])}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select
              className="w-full rounded-lg border px-2 py-2"
              value={draft.dept}
              onChange={(e) => set("dept", e.target.value as FilterState["dept"])}
            >
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
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
                onChange={(e) => set("from", e.target.value || "")}
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                className="w-full rounded-lg border px-2 py-2"
                value={draft.to || ""}
                onChange={(e) => set("to", e.target.value || "")}
              />
            </Field>
          </div>

          <Field label="Mode">
            <select
              className="w-full rounded-lg border px-2 py-2"
              value={draft.mode}
              onChange={(e) => set("mode", e.target.value as FilterState["mode"])}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 mb-3">
      <div className="text-xs font-medium text-neutral-600">{label}</div>
      {children}
    </div>
  );
}
