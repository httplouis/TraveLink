"use client";
import * as React from "react";
import type { MaintFilters, MaintStatus, MaintType } from "@/lib/admin/maintenance";

const TYPES: MaintType[] = [
  "Preventive (PMS)","Repair","LTO Renewal","Insurance Renewal","Vulcanize/Tire","Other"
];
const STATUSES: MaintStatus[] = [
  "Submitted","Acknowledged","In-Progress","Completed","Rejected"
];

type Props = {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onFillMock?: () => void;
};

export default function FiltersBar({ value, onChange, onClear, onApply, onFillMock }: Props) {
  const [draft, setDraft] = React.useState<MaintFilters>(value);

  React.useEffect(() => setDraft(value), [value]);

  const toggle = <T extends string>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="rounded-xl border bg-white p-3 md:p-4 space-y-3">
      <input
        placeholder="Search vehicle, vendor, description…"
        value={draft.q}
        onChange={(e) => setDraft({ ...draft, q: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg"
      />

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setDraft({ ...draft, types: toggle(draft.types, t) })}
            className={`text-xs px-2 py-1 rounded-full border ${
              draft.types.includes(t) ? "bg-rose-50 border-rose-300" : "hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setDraft({ ...draft, statuses: toggle(draft.statuses, s) })}
            className={`text-xs px-2 py-1 rounded-full border ${
              draft.statuses.includes(s) ? "bg-emerald-50 border-emerald-300" : "hover:bg-gray-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={draft.from || ""}
          onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })}
          className="px-2 py-1 border rounded"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={draft.to || ""}
          onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
          className="px-2 py-1 border rounded"
        />

        <div className="ml-auto flex items-center gap-2">
          <select
            value={draft.density}
            onChange={(e) =>
              setDraft({ ...draft, density: e.target.value as MaintFilters["density"] })
            }
            className="px-2 py-1 border rounded"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>

          <button
            onClick={() => setDraft(value)}
            className="px-3 py-1 rounded border"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onChange(draft);
              onApply();
            }}
            className="px-3 py-1 rounded bg-[#7a1f2a] text-white"
          >
            Apply
          </button>
          <button onClick={onClear} className="px-3 py-1 rounded border">Clear</button>
          {onFillMock && (
            <button onClick={onFillMock} className="px-3 py-1 rounded border">Fill Mock Data</button>
          )}
        </div>
      </div>
    </div>
  );
}
