"use client";
import * as React from "react";

export function StatusBadge({ value }: { value: string }) {
  const cls =
    value === "active"
      ? "bg-green-100 text-green-700"
      : value === "suspended"
      ? "bg-amber-100 text-amber-700"
      : value === "pending_verification"
      ? "bg-blue-100 text-blue-700" // <— color for pending
      : "bg-gray-200 text-gray-700"; // archived / others

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
