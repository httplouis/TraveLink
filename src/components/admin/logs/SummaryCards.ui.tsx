"use client";
import * as React from "react";

const brand = "#7a0019";

export function SummaryCards({
  total, info, warning, error, topActions, trend7d
}: {
  total: number;
  info: number;
  warning: number;
  error: number;
  topActions: [string, number][];
  trend7d: { day: string; count: number }[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card title="Total Logs" value={total} />
      <Card title="Info" value={info} pillClass="bg-gray-100 text-gray-700" />
      <Card title="Warnings" value={warning} pillClass="bg-amber-100 text-amber-700" />
      <Card title="Errors" value={error} pillClass="bg-rose-100 text-rose-700" />

      {/* Trend card spans full width */}
      <div className="md:col-span-2 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Activity (last 7 days)</h3>
        </div>
        <MiniBar data={trend7d} />
      </div>

      {/* Top actions */}
      <div className="md:col-span-2 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Top Actions</h3>
        </div>
        <ul className="space-y-2">
          {topActions.map(([name, cnt]) => (
            <li key={name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-600">{name}</div>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full" style={{ width: `${Math.min(100, (cnt / (topActions[0]?.[1] || 1)) * 100)}%`, background: brand }} />
              </div>
              <div className="w-10 text-right text-sm">{cnt}</div>
            </li>
          ))}
          {topActions.length === 0 && <div className="text-sm text-gray-500">No data</div>}
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value, pillClass }: { title: string; value: number; pillClass?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</div>
      {pillClass && <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs ${pillClass}`}>today</div>}
    </div>
  );
}

// simple bar chart (no external lib)
function MiniBar({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="grid grid-cols-7 gap-2 items-end h-24">
      {data.map(d => (
        <div key={d.day} className="flex flex-col items-center gap-1">
          <div
            className="w-full rounded"
            style={{ height: `${(d.count / max) * 96}%`, background: brand }}
            title={`${d.day}: ${d.count}`}
          />
          <div className="text-[10px] text-gray-500">{d.day.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}
