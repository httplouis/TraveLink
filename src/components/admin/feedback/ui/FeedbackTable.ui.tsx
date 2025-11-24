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

  // Ensure rows is always an array
  const safeRows = Array.isArray(rows) ? rows : [];

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
      {safeRows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No feedback received yet.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">User</th>
              <th className="p-2">Trip</th>
              <th className="p-2">Rating</th>
              <th className="p-2">Message</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((f) => (
            <tr key={f.id} className="border-b hover:bg-neutral-50">
              <td className="p-2">{f.user}</td>
              <td className="p-2 text-xs text-gray-600">
                {(f as any).trip_id ? `Trip #${(f as any).trip_id.slice(0, 8)}` : "—"}
              </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < (f.rating || 0) ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-2 truncate max-w-[300px]">{f.message}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  f.status === "NEW" ? "bg-blue-100 text-blue-700" :
                  f.status === "REVIEWED" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {f.status}
                </span>
              </td>
              <td className="p-2 text-xs text-gray-600">{new Date(f.createdAt).toLocaleString()}</td>
              <td className="p-2 space-x-2">
                <button
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                  onClick={() => onView(f)}
                >
                  View
                </button>
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={(e) => toggle(f.id, e.target.checked)}
                  className="cursor-pointer"
                />
              </td>
            </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
