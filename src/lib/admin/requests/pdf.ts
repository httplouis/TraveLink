// src/lib/admin/requests/pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminRequest } from "@/lib/admin/requests/store";

export function generateRequestPDF(req: AdminRequest) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text("Travel Order", 105, 20, { align: "center" });

  // Basic info table
  autoTable(doc, {
    startY: 30,
    head: [["Field", "Details"]],
    body: [
      ["Date", req.travelOrder?.date || ""],
      ["Requesting Person", req.travelOrder?.requestingPerson || ""],
      ["Department", req.travelOrder?.department || ""],
      ["Destination", req.travelOrder?.destination || ""],
      ["Departure Date", req.travelOrder?.departureDate || ""],
      ["Return Date", req.travelOrder?.returnDate || ""],
      ["Purpose of Travel", req.travelOrder?.purposeOfTravel || ""],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // Costs
  const costRows = Object.entries(req.travelOrder?.costs || {}).map(([k, v]) => {
    if (typeof v === "number") return [k, `₱${v.toFixed(2)}`];
    return [k, String(v)];
  });

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 60) + 5,
    head: [["Travel Cost Item", "Amount"]],
    body: costRows,
    theme: "grid",
    styles: { fontSize: 10 },
  });

  // Endorsements
  doc.setFontSize(12);
  let y = ((doc as any).lastAutoTable?.finalY || 120) + 15;

  doc.text("Endorsed By:", 14, y);
  y += 10;
  doc.text("__________________________", 14, y);
  y += 6;
  doc.text("Engr. Maria DeptHead", 14, y);
  y += 15;

  doc.text("For Travel Cost: If none, proceed to School Service Request", 14, y);
  y += 15;
  doc.text("Recommending Approval:", 14, y);
  y += 10;
  doc.text("__________________________", 14, y);
  y += 6;
  doc.text("CARLOS JAYRON A. REMIENDO (Comptroller)", 14, y);
  y += 15;

  doc.text("Noted:", 14, y);
  y += 10;
  doc.text("__________________________", 14, y);
  y += 6;
  doc.text("HR Director", 14, y);
  y += 15;

  doc.text("Recommended for Approval:", 14, y);
  y += 10;
  doc.text("__________________________", 14, y);
  y += 6;
  doc.text("VP/COO", 14, y);
  y += 15;

  doc.text("Approved:", 14, y);
  y += 10;
  doc.text("__________________________", 14, y);
  y += 6;
  doc.text("President", 14, y);

  // Save
  doc.save(`TravelOrder_${req.id}.pdf`);
}
