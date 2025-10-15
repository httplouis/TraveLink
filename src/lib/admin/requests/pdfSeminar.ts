// src/lib/admin/requests/pdfSeminar.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AdminRequest } from "@/lib/admin/requests/store";

/**
 * Generate the Seminar Application PDF (HRD-F-SA Rev.06 May2024)
 */
export function generateSeminarPDF(req: AdminRequest) {
  if (!req.seminar) {
    alert("No seminar data found for this request.");
    return;
  }

  const seminar = req.seminar;
  const doc = new jsPDF("p", "mm", "a4");

  // === Header ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("QUALITY FORMS", 10, 10);
  doc.text("SEMINAR APPLICATION", 105, 10, { align: "center" });
  doc.setFontSize(8);
  doc.text("Document Code: HRD-F-SA", 10, 16);
  doc.text("Revision No.: 06", 10, 20);
  doc.text("Department: HRD", 10, 24);
  doc.text("Effectivity Date: May 2024", 10, 28);

  // === Application Info ===
  doc.setFontSize(10);
  doc.text("Seminar / Training Information", 10, 40);

  autoTable(doc, {
    startY: 44,
    theme: "grid",
    headStyles: { fillColor: [122, 0, 16] },
    styles: { fontSize: 9, cellPadding: 2 },
    body: [
      ["Applicant Name", req.travelOrder?.requestingPerson || "—"],
      ["Department", req.travelOrder?.department || "—"],
      ["Training Title", seminar.title || "—"],
      ["Training Category", seminar.trainingCategory || "—"],
      ["Date From", seminar.dateFrom || "—"],
      ["Date To", seminar.dateTo || "—"],
      ["Venue", seminar.venue || "—"],
      ["Modality", seminar.modality || "—"],
    ],
  });

  // === Estimated Costs ===
  let y = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text("Estimated Costs", 10, y);

  const costRows: any[] = [];
  costRows.push(["Registration Cost", `₱${seminar.registrationCost ?? 0}`]);
  if (Array.isArray(seminar.breakdown)) {
    seminar.breakdown.forEach((item) => {
      costRows.push([item.label, `₱${item.amount ?? 0}`]);
    });
  }
  costRows.push(["Total Amount", `₱${seminar.totalAmount ?? 0}`]);

  autoTable(doc, {
    startY: y + 4,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    body: costRows,
  });

  // === Approvals ===
  y = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text("Endorsements / Approvals", 10, y);

  y += 6;
  doc.setFontSize(9);
  doc.text("Endorsed By (Dept. Head):", 10, y);
  doc.text(req.travelOrder?.endorsedByHeadName || "____________________", 70, y);

  y += 6;
  doc.text("Comptroller: Carlos Jayron A. Remiendo", 10, y);

  y += 6;
  doc.text("HR Director: Dr. Maria Sylvia S. Avila", 10, y);

  y += 6;
  doc.text("VP/COO: ____________________", 10, y);

  y += 6;
  doc.text("President: Naila E. Leveriza", 10, y);

  // === Notes ===
  doc.setFontSize(7);
  doc.text(
    "Note: Attach official invitation/program. Copies distributed to HRD, Comptroller, Dept., and Training Coordinator.",
    10,
    285
  );

  doc.save(`${req.id}_SeminarApplication.pdf`);
}
