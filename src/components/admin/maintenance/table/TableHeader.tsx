"use client";
import * as React from "react";

export default function TableHeader({
  allOnPageSelected,
  onToggleAll,
}: {
  allOnPageSelected: boolean;
  onToggleAll: (checked: boolean) => void;
}) {
  return (
    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
      <tr>
        <th className="w-10 p-2 text-left">
          <input
            type="checkbox"
            checked={allOnPageSelected}
            onChange={(e) => onToggleAll(e.currentTarget.checked)}
            aria-label="Select all on page"
          />
        </th>
        <th className="p-2 text-left">Vehicle</th>
        <th className="p-2 text-left">Plate</th>
        <th className="p-2 text-left">Type</th>
        <th className="p-2 text-left">Status</th>
        <th className="p-2 text-left">Cost</th>
        <th className="p-2 text-left">Date</th>
        <th className="p-2 text-right">Actions</th>
      </tr>
    </thead>
  );
}
