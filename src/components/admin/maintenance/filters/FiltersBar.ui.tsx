"use client";
import * as React from "react";
import type { MaintFilters, MaintStatus, MaintType } from "@/lib/admin/maintenance";

const TYPES: MaintType[] = [
  "Preventive (PMS)",
  "Repair",
  "LTO Renewal",
  "Insurance Renewal",
  "Vulcanize/Tire",
  "Other",
];

const STATUSES: MaintStatus[] = [
  "Submitted",
  "Acknowledged",
  "In-Progress",
  "Completed",
  "Rejected",
];

type Props = {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void; // called on Apply and for density immediate change
  onClear: () => void;
  onApply: () => void;                 // parent can re-run loadMaintenance
};

export default function FiltersBar({
  value,
  onChange,
  onClear,
  onApply,
}: Props) {
  const [draft, setDraft] = React.useState<MaintFilters>(value);
  React.useEffect(() => setDraft(value), [value]);

  const toggle = <T extends string>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // Density applies immediately so the table row padding updates right away.
  function setDensityImmediate(density: MaintFilters["density"]) {
    const next = { ...draft, density };
    setDraft(next);
    onChange(next);
  }

  return (
    <div className="rounded-xl bg-white shadow-md ring-1 ring-black/5 p-4 md:p-5 space-y-4">
      {/* Search */}
      <input
        placeholder="Search vehicle, vendor, description…"
        value={draft.q}
        onChange={(e) => setDraft({ ...draft, q: e.target.value })}
        className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 focus:ring-2 focus:ring-[#7a1f2a]/30 outline-none bg-white/70"
      />

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => {
          const active = draft.types.includes(t);
          return (
            <button
              key={t}
              onClick={() => setDraft({ ...draft, types: toggle(draft.types, t) })}
              className={`text-xs px-2.5 py-1 rounded-full ring-1 transition ${
                active
                  ? "bg-[#7a1f2a]/10 ring-[#7a1f2a]/30 text-[#7a1f2a]"
                  : "ring-black/10 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = draft.statuses.includes(s);
          return (
            <button
              key={s}
              onClick={() => setDraft({ ...draft, statuses: toggle(draft.statuses, s) })}
              className={`text-xs px-2.5 py-1 rounded-full ring-1 transition ${
                active
                  ? "bg-emerald-50 ring-emerald-200 text-emerald-700"
                  : "ring-black/10 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Date + controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg ring-1 ring-black/10 bg-white/70 px-2 py-1">
          <span className="text-xs text-neutral-500">Date</span>
          <input
            type="date"
            value={draft.from || ""}
            onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })}
            className="px-1 py-0.5 bg-transparent outline-none"
          />
          <span className="text-sm text-neutral-400">–</span>
          <input
            type="date"
            value={draft.to || ""}
            onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
            className="px-1 py-0.5 bg-transparent outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={draft.density}
            onChange={(e) => setDensityImmediate(e.target.value as MaintFilters["density"])}
            className="px-2 py-1 rounded-lg ring-1 ring-black/10 bg-white/70"
            title="Row density"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>

          <button
            onClick={() => setDraft(value)}
            className="px-3 py-1 rounded-lg ring-1 ring-black/10"
          >
            Reset
          </button>

          <button
            onClick={() => {
              onChange(draft);
              onApply();
            }}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#7a1f2a] to-[#9a2f3a] text-white hover:from-[#6a1a24] hover:to-[#8a1f2a] transition-all shadow-md hover:shadow-lg font-medium"
          >
            Apply
          </button>

          <button
            onClick={onClear}
            className="px-3 py-1 rounded-lg ring-1 ring-black/10 hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
