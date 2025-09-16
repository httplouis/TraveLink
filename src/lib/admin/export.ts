import type { RequestRow } from "@/lib/admin/types";

// converts rows to CSV string
export function rowsToCsv(rows: RequestRow[]): string {
  const header = ["ID","Department","Purpose","Date","Status","Requester","Vehicle","Driver"];
  const escape = (v: any) => {
    if (v === undefined || v === null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map(r => [
    r.id, r.dept, r.purpose, r.date, r.status, r.requester ?? "", r.vehicle ?? "", r.driver ?? ""
  ].map(escape).join(","));
  return [header.join(","), ...lines].join("\n");
}

// triggers a download on client
export function triggerDownload(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


// import { RequestRow } from "../types";

export function exportRequestsCsv(rows: RequestRow[], filename = "requests.csv") {
  const headers = ["ID","Department","Purpose","Date","Status","Requester","Vehicle","Driver"];
  const body = rows.map(r => [
    r.id, r.dept, quote(r.purpose), r.date, r.status,
    r.requester ?? "", r.vehicle ?? "", r.driver ?? ""
  ].join(","));
  const blob = new Blob(
    [headers.join(","), "\n", body.join("\n")],
    { type: "text/csv;charset=utf-8;" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function quote(s: string) {
  const needs = /[",\n]/.test(s);
  return needs ? `"${s.replace(/"/g,'""')}"` : s;
}
