// src/components/admin/nav/ProfileMenu.tsx
"use client";

import * as React from "react";
import { ChevronDown, User } from "lucide-react";

type Props = {
  name?: string;
  variant?: "light" | "onMaroon";
  className?: string;
};

export default function ProfileMenu({ name = "Admin", variant = "light", className = "" }: Props) {
  const isMaroon = variant === "onMaroon";
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        className={[
          "inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors",
          isMaroon
            ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        ].join(" ")}
      >
        <span className={["inline-flex h-6 w-6 items-center justify-center rounded-full", isMaroon ? "bg-white/15 text-white" : "bg-neutral-200 text-neutral-700"].join(" ")}>
          <User className="h-4 w-4" />
        </span>
        <span className={isMaroon ? "text-white" : "text-neutral-800"}>{name}</span>
        <ChevronDown className={isMaroon ? "h-4 w-4 text-white/90" : "h-4 w-4 text-neutral-500"} />
      </button>
    </div>
  );
}
