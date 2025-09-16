"use client";
import * as React from "react";
import { Trash2, Eye } from "lucide-react";
import type { LogEntry } from "@/lib/admin/logs/types";

export function LogsTable({
  rows, selection, setSelection, onView, onDelete
}: {
  rows: LogEntry[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const all = rows.length > 0 && selection.length === rows.length;
  const toggleAll = () => setSelection(all ? [] : rows.map(r => r.id));
  const toggleOne = (id: string) => setSelection(selection.includes(id) ? selection.filter(x=>x!==id) : [...selection, id]);

  const sevBadge = (s: LogEntry["severity"]) =>
    s === "error" ? "bg-rose-100 text-rose-700" : s === "warning" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700";

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[1000px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="w-10 p-2"><input type="checkbox" checked={all} onChange={toggleAll}/></th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Actor</th>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Entity</th>
            <th className="p-2 text-left">Severity</th>
            <th className="p-2 text-left">Details</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t">
              <td className="p-2"><input type="checkbox" checked={selection.includes(r.id)} onChange={()=>toggleOne(r.id)}/></td>
              <td className="p-2 whitespace-nowrap">{new Date(r.timestampISO).toLocaleString()}</td>
              <td className="p-2">{r.actorName} <span className="text-gray-500">({r.actorType})</span></td>
              <td className="p-2">{r.action}</td>
              <td className="p-2">{r.entityType}{r.entityLabel ? ` • ${r.entityLabel}` : ""}</td>
              <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${sevBadge(r.severity)}`}>{r.severity}</span></td>
              <td className="p-2 max-w-[420px] truncate">{r.details ?? "-"}</td>
              <td className="p-2">
                <div className="flex justify-end gap-1.5">
                  <button onClick={()=>onView(r.id)} className="p-1.5 border rounded-md hover:bg-gray-50" title="View"><Eye size={16}/></button>
                  <button onClick={()=>onDelete(r.id)} className="p-1.5 border rounded-md hover:bg-gray-50" title="Delete"><Trash2 size={16}/></button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="p-6 text-center text-gray-500" colSpan={8}>No logs</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
