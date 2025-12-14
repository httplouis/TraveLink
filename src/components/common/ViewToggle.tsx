"use client";

import React from "react";
import { LayoutGrid, Table2 } from "lucide-react";

export type ViewMode = "cards" | "table";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
  storageKey?: string;
  className?: string;
}

export function useViewMode(storageKey: string, defaultValue: ViewMode = "cards"): [ViewMode, (v: ViewMode) => void] {
  const [mounted, setMounted] = React.useState(false);
  const [view, setView] = React.useState<ViewMode>(defaultValue);

  // Only read from localStorage after mount to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as ViewMode;
    if (stored === "cards" || stored === "table") {
      setView(stored);
    }
  }, [storageKey]);

  // Save to localStorage when view changes (only after mount)
  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, view);
    }
  }, [view, storageKey, mounted]);

  return [view, setView];
}

export default function ViewToggle({ view, onChange, className = "" }: ViewToggleProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 ${className}`}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-400">
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Cards</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-400">
          <Table2 className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center rounded-lg border border-gray-200 bg-white p-1 ${className}`}>
      <button
        onClick={() => onChange("cards")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "cards"
            ? "bg-[#7A0010] text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="Card View"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => onChange("table")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === "table"
            ? "bg-[#7A0010] text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="Table View"
      >
        <Table2 className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}
