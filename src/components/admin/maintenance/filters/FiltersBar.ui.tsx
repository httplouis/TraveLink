"use client";
import * as React from "react";
import type {
  MaintFilters,
  MaintStatus,
  MaintType,
  NextDueTint,
} from "@/lib/admin/maintenance/types";
import {
  MAINT_TYPES as TYPES,
  MAINT_STATUSES as STATUSES,
} from "@/lib/admin/maintenance/types";
import { Search, X, ChevronDown, Calendar, Filter } from "lucide-react";

type Props = {
  value: MaintFilters;
  onChange: (v: MaintFilters) => void;
  onClear: () => void;
};

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-8 rounded-full px-3 text-xs font-medium transition",
        active
          ? "bg-[#7a1f2a] text-white shadow-sm"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function MaintFiltersBar({ value, onChange, onClear }: Props) {
  const v: MaintFilters = {
    q: value.q ?? "",
    category: (value.category ?? "all") as MaintType | "all",
    status: (value.status ?? "all") as MaintStatus | "all",
    due: (value.due ?? "all") as NextDueTint | "all",
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    density: value.density ?? "comfortable",
  };
  const set = (patch: Partial<MaintFilters>) => onChange({ ...v, ...patch });

  return (
    <div className="rounded-2xl border border-neutral-200 shadow-sm bg-gradient-to-b from-white to-neutral-50/60">
      {/* top row */}
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              value={v.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Vehicle, vendor, description…"
              className="w-full h-11 rounded-xl border border-neutral-300 pl-10 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            {!!v.q && (
              <button
                onClick={() => set({ q: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-neutral-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-neutral-400" />
              </button>
            )}
          </div>

          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 h-11 rounded-xl border border-neutral-300 px-3 text-sm hover:bg-neutral-100"
          >
            <X className="h-4 w-4" /> Reset
          </button>
        </div>

        {/* quick chips */}
        <div className="flex flex-wrap gap-2">
          <Chip active={v.status === "Submitted"} onClick={() => set({ status: v.status === "Submitted" ? "all" : "Submitted" })}>Submitted</Chip>
          <Chip active={v.status === "In-Progress"} onClick={() => set({ status: v.status === "In-Progress" ? "all" : "In-Progress" })}>In-Progress</Chip>
          <Chip active={v.status === "Completed"} onClick={() => set({ status: v.status === "Completed" ? "all" : "Completed" })}>Completed</Chip>
          <Chip active={v.due === "soon"} onClick={() => set({ due: v.due === "soon" ? "all" : "soon" })}>Due soon</Chip>
          <Chip active={v.due === "overdue"} onClick={() => set({ due: v.due === "overdue" ? "all" : "overdue" })}>Overdue</Chip>
          <Chip active={v.category !== "all"} onClick={() => set({ category: "all" })}>All types</Chip>
        </div>

        {/* primary controls w/ dates always visible */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
          <div className="relative">
            <select
              value={v.category}
              onChange={(e) => set({ category: e.target.value as MaintType | "all" })}
              className="h-10 w-full rounded-lg border border-neutral-300 pr-8 pl-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            >
              <option value="all">Type: all</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none h-4 w-4 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <select
              value={v.status}
              onChange={(e) => set({ status: e.target.value as MaintStatus | "all" })}
              className="h-10 w-full rounded-lg border border-neutral-300 pr-8 pl-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            >
              <option value="all">Status: all</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none h-4 w-4 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <select
              value={v.due}
              onChange={(e) => set({ due: e.target.value as NextDueTint | "all" })}
              className="h-10 w-full rounded-lg border border-neutral-300 pr-8 pl-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            >
              <option value="all">Due: all</option>
              <option value="ok">OK</option>
              <option value="soon">Soon</option>
              <option value="overdue">Overdue</option>
              <option value="none">None</option>
            </select>
            <ChevronDown className="pointer-events-none h-4 w-4 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2" />
          </div>

          <div className="relative">
            <Calendar className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={v.dateFrom || ""}
              onChange={(e) => set({ dateFrom: e.target.value || undefined })}
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            />
          </div>

          <div className="relative">
            <Calendar className="h-4 w-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={v.dateTo || ""}
              onChange={(e) => set({ dateTo: e.target.value || undefined })}
              className="h-10 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-sm focus:ring-2 focus:ring-[#7a1f2a]/30 focus:border-[#7a1f2a] bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Filter className="h-4 w-4" />
          Density:&nbsp;
          <button
            className={["px-2 py-1 rounded-md border", v.density === "comfortable" ? "bg-neutral-100 border-neutral-300" : "border-transparent hover:bg-neutral-100"].join(" ")}
            onClick={() => set({ density: "comfortable" })}
          >
            Comfortable
          </button>
          <button
            className={["px-2 py-1 rounded-md border", v.density === "compact" ? "bg-neutral-100 border-neutral-300" : "border-transparent hover:bg-neutral-100"].join(" ")}
            onClick={() => set({ density: "compact" })}
          >
            Compact
          </button>
        </div>
      </div>
    </div>
  );
}
