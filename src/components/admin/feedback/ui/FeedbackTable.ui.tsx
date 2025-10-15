// src/components/admin/feedback/ui/FeedbackTable.ui.tsx
"use client";
import * as React from "react";
import type { Feedback } from "@/lib/admin/feedback/types";

type Props = {
  rows: Feedback[];
  onView: (f: Feedback) => void;
  onDelete: (ids: string[]) => void;
};

export default function FeedbackTable({ rows, onView, onDelete }: Props) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const n = new Set(prev);
      checked ? n.add(id) : n.delete(id);
      return n;
    });
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feedback</h2>
        {selected.size > 0 && (
          <button
            onClick={() => onDelete([...selected])}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white"
          >
            Delete ({selected.size})
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">User</th>
            <th className="p-2">Message</th>
            <th className="p-2">Status</th>
            <th className="p-2">Created</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-b hover:bg-neutral-50">
              <td className="p-2">{f.user}</td>
              <td className="p-2 truncate max-w-[300px]">{f.message}</td>
              <td className="p-2">{f.status}</td>
              <td className="p-2">{new Date(f.createdAt).toLocaleString()}</td>
              <td className="p-2 space-x-2">
                <button
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                  onClick={() => onView(f)}
                >
                  View
                </button>
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={(e) => toggle(f.id, e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
