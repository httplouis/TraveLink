"use client";
import * as React from "react";

export default function DriverRowActions({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50" onClick={onEdit}>Edit</button>
      {/* extend: View, Suspend, Reset Access */}
    </div>
  );
}
