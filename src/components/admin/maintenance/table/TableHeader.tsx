"use client";
import * as React from "react";

export default function TableHeader() {
  return (
    <thead className="text-xs uppercase tracking-wide text-neutral-500">
      <tr>
        <th className="px-3 py-2 text-left w-8"></th>
        <th className="px-3 py-2 text-left">Vehicle</th>
        <th className="px-3 py-2 text-left">Type</th>
        <th className="px-3 py-2 text-left">Status</th>
        <th className="px-3 py-2 text-left">Attachments</th>
        <th className="px-3 py-2 text-left">Cost</th>
        <th className="px-3 py-2 text-left">Date</th>
        <th className="px-3 py-2 text-left">Next Due</th>
        <th className="px-3 py-2 text-left">Actions</th>
      </tr>
    </thead>
  );
}
