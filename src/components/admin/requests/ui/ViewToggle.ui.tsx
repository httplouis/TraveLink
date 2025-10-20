// src/components/admin/requests/ui/ViewToggle.ui.tsx
"use client";

import * as React from "react";
import { LayoutGrid, Rows, Inbox } from "lucide-react";

type Props = {
  view: "table" | "card" | "receiver"; // ✅ extended
  onChange: (v: "table" | "card" | "receiver") => void; // ✅ extended
};

export default function ViewToggleUI({ view, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-300 bg-white shadow-sm">
      {/* Table View */}
      <button
        onClick={() => onChange("table")}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
          view === "table" ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50"
        }`}
      >
        <Rows className="h-4 w-4" />
        Table
      </button>

      {/* Card View */}
      <button
        onClick={() => onChange("card")}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
          view === "card" ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Card
      </button>

      {/* Receiver View */}
      <button
        onClick={() => onChange("receiver")}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
          view === "receiver" ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50"
        }`}
      >
        <Inbox className="h-4 w-4" />
        Receiver
      </button>
    </div>
  );
}
