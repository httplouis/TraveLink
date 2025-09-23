"use client";
import * as React from "react";
import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";

type Props = {
  collapsed: boolean;
  onClick: () => void;
  brand?: string; // optional brand hex (defaults to TraviLink maroon)
};

export default function CollapseToggle({ collapsed, onClick, brand = "#7a1f2a" }: Props) {
  // two style sets: light (expanded sidebar) vs dark (collapsed rail)
  const light =
    "border-neutral-300 bg-white text-neutral-700 hover:text-white hover:bg-[var(--brand)] hover:border-[var(--brand)]";
  const dark =
    "border-white/30 bg-white/15 text-white hover:bg-white hover:text-[var(--brand)] hover:border-white";

  return (
    <button
      type="button"
      data-nav-toggle="true"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{ ["--brand" as any]: brand }}
      className={[
        "relative flex h-8 w-10 items-center justify-center rounded-md border shadow-sm transition-colors",
        collapsed ? dark : light,
      ].join(" ")}
    >
      {collapsed ? (
        <ArrowRightToLine className="h-4 w-4" />
      ) : (
        <ArrowLeftToLine className="h-4 w-4" />
      )}
    </button>
  );
}
