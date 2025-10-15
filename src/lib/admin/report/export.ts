"use client";

import type { TripRow } from "./types";

export function toCSV(rows: TripRow[]) {
  const header = ["ID","Department","Purpose","Date","Status","Vehicle","Driver","KM"];
  const body = rows.map(r => [
    r.id, r.department, r.purpose, r.date, r.status, r.vehicleCode, r.driver, String(r.km)
  ]);
  const csv = [header, ...body]
    .map(a => a.map(s => `"${String(s).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

export function downloadCSV(rows: TripRow[], filename = "travilink-report.csv") {
  const blob = toCSV(rows);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  saveHistory({ type: "CSV", at: new Date().toISOString(), count: rows.length, filename });
}

export function printElementById(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  w.document.write(`<html><head><title>Print</title>
  <style>
    body{font-family: ui-sans-serif, system-ui; padding:16px;}
    table{width:100%; border-collapse: collapse;}
    th,td{border:1px solid #ddd; padding:8px; font-size:12px;}
    th{background:#f7f7f7; text-align:left;}
  </style>
  </head><body>${node.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
  saveHistory({ type: "Print", at: new Date().toISOString(), count: node.querySelectorAll("tbody tr").length });
}

type ExportHistory = { type: "CSV" | "Print"; at: string; count: number; filename?: string };

const KEY = "travilink_report_exports";

export function getHistory(): ExportHistory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

export function saveHistory(entry: ExportHistory) {
  try {
    const current = getHistory();
    localStorage.setItem(KEY, JSON.stringify([entry, ...current].slice(0, 25)));
  } catch {}
}
