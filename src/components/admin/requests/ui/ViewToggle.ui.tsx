"use client";

import { LayoutList, LayoutGrid } from "lucide-react";

export default function ViewToggleUI({
  view,
  onChange,
  className = "",
}: {
  view: "table" | "card";
  onChange: (v: "table" | "card") => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      <button
        onClick={() => onChange("table")}
        title="Table view (T)"
        className={`rounded-lg p-2 shadow-sm transition-colors outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 ${
          view === "table"
            ? "bg-[#7a1f2a] text-white"
            : "bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200"
        }`}
      >
        <LayoutList className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("card")}
        title="Card view (C)"
        className={`rounded-lg p-2 shadow-sm transition-colors outline-none focus:ring-2 focus:ring-[#7a1f2a]/30 ${
          view === "card"
            ? "bg-[#7a1f2a] text-white"
            : "bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}
