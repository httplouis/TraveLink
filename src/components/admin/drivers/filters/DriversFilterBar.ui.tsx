"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import type { DriverFilters } from "@/lib/admin/drivers/types";
import { DriversRepo } from "@/lib/admin/drivers/store";

export function DriversFilterBar({
  value,
  onChange,
  onClear,
}: {
  value: DriverFilters;
  onChange: (v: DriverFilters) => void;
  onClear: () => void;
}) {
  const hasFilters = !!(value.search || value.status || value.licenseClass);

  // debounced search
  const [search, setSearch] = React.useState(value.search ?? "");
  React.useEffect(() => setSearch(value.search ?? ""), [value.search]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      if ((value.search ?? "") !== search) onChange({ ...value, search });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectCls =
    "rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 " +
    "hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-gray-400";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/90 p-2 ring-1 ring-gray-200 shadow-sm">
      {/* Search pill */}
      <label className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
        <Search size={16} className="opacity-60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, code, phone, email…"
          className="w-56 sm:w-72 bg-transparent outline-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="rounded-full p-0.5 text-gray-500 hover:bg-gray-100"
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </label>

      {/* Status */}
      <select
        className={selectCls}
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: e.target.value as any })}
      >
        <option value="">All Status</option>
        {DriversRepo.constants.statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* License class */}
      <select
        className={selectCls}
        value={value.licenseClass ?? ""}
        onChange={(e) =>
          onChange({ ...value, licenseClass: e.target.value as any })
        }
      >
        <option value="">All License Classes</option>
        {DriversRepo.constants.licenseClasses.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="ms-auto" />

      {/* Clear link */}
      <button
        type="button"
        onClick={onClear}
        disabled={!hasFilters}
        className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        title="Clear filters"
      >
        Clear
      </button>
    </div>
  );
}
