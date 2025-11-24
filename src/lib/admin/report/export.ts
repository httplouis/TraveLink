"use client";

import type { TripRow } from "./types";

export function toCSV(rows: TripRow[]) {
  const header = ["ID","Type","Department","Purpose","Date","Status","Vehicle","Driver","Budget (₱)","KM"];
  const body = rows.map(r => [
    r.id, 
    r.requestType === "seminar" ? "Seminar" : "Travel Order",
    r.department, 
    r.purpose, 
    r.date, 
    r.status, 
    r.vehicleCode, 
    r.driver,
    r.budget ? `₱${r.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱0.00",
    String(r.km)
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

type ExportHistory = { type: "CSV" | "Excel" | "PDF" | "Print"; at: string; count: number; filename?: string };

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

// Excel export using XLSX library (if available) or CSV fallback
export function downloadExcel(rows: TripRow[], filename = "travilink-report.xlsx") {
  try {
    // Try to use XLSX library if available
    if (typeof window !== "undefined" && (window as any).XLSX) {
      const XLSX = (window as any).XLSX;
      const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
        "ID": r.id,
        "Type": r.requestType === "seminar" ? "Seminar" : "Travel Order",
        "Department": r.department,
        "Purpose": r.purpose,
        "Date": r.date,
        "Status": r.status,
        "Vehicle": r.vehicleCode,
        "Driver": r.driver,
        "Budget (₱)": r.budget || 0,
        "KM": r.km
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, filename);
      saveHistory({ type: "Excel", at: new Date().toISOString(), count: rows.length, filename });
    } else {
      // Fallback to CSV if XLSX not available
      console.warn("XLSX library not available, falling back to CSV");
      downloadCSV(rows, filename.replace('.xlsx', '.csv'));
    }
  } catch (err) {
    console.error("Excel export failed:", err);
    // Fallback to CSV
    downloadCSV(rows, filename.replace('.xlsx', '.csv'));
  }
}

// PDF export using jsPDF and autoTable (if available) or print fallback
export function downloadPDF(rows: TripRow[], tableId: string, filename = "travilink-report.pdf") {
  try {
    // Try to use jsPDF library if available
    if (typeof window !== "undefined" && (window as any).jspdf && (window as any).jspdf.autoTable) {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("TraviLink Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      // Add table
      doc.autoTable({
        head: [["ID", "Type", "Department", "Purpose", "Date", "Status", "Vehicle", "Driver", "Budget", "KM"]],
        body: rows.map(r => [
          r.id,
          r.requestType === "seminar" ? "Seminar" : "Travel",
          r.department,
          r.purpose.substring(0, 30) + (r.purpose.length > 30 ? "..." : ""),
          r.date,
          r.status,
          r.vehicleCode,
          r.driver,
          r.budget ? `₱${r.budget.toFixed(2)}` : "₱0.00",
          String(r.km)
        ]),
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [122, 31, 42] },
      });
      
      doc.save(filename);
      saveHistory({ type: "PDF", at: new Date().toISOString(), count: rows.length, filename });
    } else {
      // Fallback to print
      console.warn("jsPDF library not available, falling back to print");
      printElementById(tableId);
    }
  } catch (err) {
    console.error("PDF export failed:", err);
    // Fallback to print
    printElementById(tableId);
  }
}
