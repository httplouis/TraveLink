"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown, Loader2 } from "lucide-react";

interface ExportButtonProps {
  data: any[];
  filename?: string;
  columns?: { key: string; label: string }[];
  title?: string;
  onExport?: (format: string) => Promise<void>;
}

export default function ExportButton({
  data,
  filename = "export",
  columns,
  title = "Export Data",
  onExport,
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = columns?.map((c) => c.label) || Object.keys(data[0]);
    const keys = columns?.map((c) => c.key) || Object.keys(data[0]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        keys
          .map((key) => {
            const value = row[key];
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains comma
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const printData = () => {
    if (!data || data.length === 0) return;

    const headers = columns?.map((c) => c.label) || Object.keys(data[0]);
    const keys = columns?.map((c) => c.key) || Object.keys(data[0]);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #7A0010; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${keys.map((key) => `<td>${row[key] ?? ""}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Total: ${data.length} records
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = async (format: string) => {
    setExporting(format);
    setShowMenu(false);

    try {
      if (onExport) {
        await onExport(format);
      } else {
        switch (format) {
          case "csv":
            exportToCSV();
            break;
          case "json":
            exportToJSON();
            break;
          case "print":
            printData();
            break;
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    { id: "csv", label: "Export as CSV", icon: <FileSpreadsheet className="h-4 w-4" /> },
    { id: "json", label: "Export as JSON", icon: <FileText className="h-4 w-4" /> },
    { id: "print", label: "Print", icon: <Printer className="h-4 w-4" /> },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={!data || data.length === 0 || !!exporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">Export</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
