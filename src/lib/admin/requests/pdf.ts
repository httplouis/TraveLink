// src/lib/admin/requests/pdf.ts
import jsPDF from "jspdf";
import type { AdminRequest } from "@/lib/admin/requests/store";

// ==== helpers =============================================================

const MM = {
  PAGE_W: 210,
  PAGE_H: 297,
  MARGIN: 12,
};
const FONT = { base: "helvetica" as const };

function peso(n?: number | null) {
  const v = typeof n === "number" ? n : 0;
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function text(doc: jsPDF, s: string, x: number, y: number, opt?: jsPDF.TextOptionsLight) {
  doc.text(s, x, y, opt);
}

function labelValueRow(
  doc: jsPDF,
  x: number,
  y: number,
  wLabel: number,
  wValue: number,
  label: string,
  value: string,
  rowMinH = 8,
  padX = 2.5,
  padY = 2.8,
  boldLabel = true
) {
  // wrap value to fit in its box
  const avail = wValue - padX * 2;
  const lines = doc.splitTextToSize(value || "", avail);
  const h = Math.max(rowMinH, padY * 2 + lines.length * 4.2);

  // frame
  doc.rect(x, y, wLabel, h);
  doc.rect(x + wLabel, y, wValue, h);

  // label
  doc.setFont(FONT.base, boldLabel ? "bold" : "normal");
  doc.setFontSize(9);
  text(doc, label, x + padX, y + 4.8);

  // value
  doc.setFont(FONT.base, "normal");
  doc.setFontSize(9);
  doc.text(lines as string[], x + wLabel + padX, y + 4.8);
  return h;
}

function simpleRow(
  doc: jsPDF,
  x: number,
  y: number,
  wLeft: number,
  wRight: number,
  left: string,
  right: string,
  rowH = 8,
  padX = 2.5
) {
  doc.rect(x, y, wLeft, rowH);
  doc.rect(x + wLeft, y, wRight, rowH);

  doc.setFont(FONT.base, "normal");
  doc.setFontSize(9);
  text(doc, left, x + padX, y + 5);
  text(doc, right, x + wLeft + padX, y + 5);
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont(FONT.base, "bold");
  doc.setFontSize(10);
  text(doc, title, x, y);
  return y + 2.5;
}

/** Compute total of TravelCosts (handles otherItems + legacy single pair) */
function computeTravelTotal(req: AdminRequest) {
  const c = req.travelOrder?.costs || {};
  let total = 0;
  const add = (v?: number | null) => (typeof v === "number" ? (total += v) : total);
  add(c.food);
  add(c.driversAllowance);
  add(c.rentVehicles);
  add(c.hiredDrivers);
  add(c.accommodation);
  if (Array.isArray(c.otherItems)) c.otherItems.forEach((it) => add(it?.amount ?? 0));
  if (c.otherLabel && c.otherAmount) add(c.otherAmount);
  return total;
}

// ==== MAIN ================================================================

export function generateRequestPDF(req: AdminRequest) {
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFont(FONT.base, "normal");

  const X = MM.MARGIN;
  const W = MM.PAGE_W - MM.MARGIN * 2;

  // ========== Header (Logo + School name + Title) ==========
  // Logo (optional; safe kung wala)
  try {
    // NOTE: image must exist at /public/eulogo.png
    doc.addImage("/eulogo.png", "PNG", X, 10, 22, 22);
  } catch {
    // ignore if not found
  }

  doc.setFont(FONT.base, "bold");
  doc.setFontSize(12);
  text(doc, "ENVERGA UNIVERSITY FOUNDATION", X + W / 2, 14, { align: "center" });

  doc.setFontSize(10);
  doc.setFont(FONT.base, "normal");
  text(doc, "Lucena City", X + W / 2, 19, { align: "center" });

  doc.setFont(FONT.base, "bold");
  doc.setFontSize(13);
  text(doc, "TRAVEL ORDER", X + W / 2, 27, { align: "center" });

  // Left meta block (“QUALITY FORMS”)
  doc.setFont(FONT.base, "bold");
  doc.setFontSize(9);
  text(doc, "QUALITY FORMS", X, 10);
  doc.setFont(FONT.base, "normal");
  doc.setFontSize(8);
  text(doc, "Document Code: HRD-F-TO", X, 15);
  text(doc, "Revision No.: 12", X, 19);
  text(doc, "Department: HRD", X, 23);
  text(doc, "Effectivity Date: Jan 2024", X, 27);

  // thin line separator
  doc.setDrawColor(180);
  doc.line(X, 33, X + W, 33);
  doc.setDrawColor(0);

  let y = 40;

  // ========== TRAVEL REQUEST INFORMATION ==========
  y = drawSectionTitle(doc, "Travel Request Information", X, y);
  y += 4;

  const L = 48; // label col width
  const V = W - L; // value col width

  y += labelValueRow(doc, X, y, L, V, "Requesting Person", req.travelOrder?.requestingPerson || "________________");
  y += labelValueRow(doc, X, y, L, V, "Department", req.travelOrder?.department || "________________");
  y += labelValueRow(doc, X, y, L, V, "Destination", req.travelOrder?.destination || "________________");

  // dates: two rows to match template look
  const rowH = 8;
  doc.rect(X, y, L, rowH);
  doc.rect(X + L, y, V / 2, rowH);
  doc.rect(X + L + V / 2, y, V / 2, rowH);
  doc.setFont(FONT.base, "bold");
  doc.setFontSize(9);
  text(doc, "Departure Date", X + 2.5, y + 5);
  doc.setFont(FONT.base, "normal");
  text(doc, req.travelOrder?.departureDate || "__________", X + L + 2.5, y + 5);
  doc.setFont(FONT.base, "bold");
  text(doc, "Return Date", X + L + V / 2 + 2.5, y + 5);
  doc.setFont(FONT.base, "normal");
  text(doc, req.travelOrder?.returnDate || "__________", X + L + V / 2 + 25, y + 5);
  y += rowH;

  // purpose (taller cell)
  y += labelValueRow(
    doc,
    X,
    y,
    L,
    V,
    "Purpose of Travel",
    req.travelOrder?.purposeOfTravel || "__________________________________________________________________________________",
    14
  );
  y += 4;

  // ========== ESTIMATED TRAVEL COST ==========
  y = drawSectionTitle(doc, "Estimated Travel Cost", X, y);
  y += 4;

  const costRow = (label: string, value?: number | null) => {
    doc.rect(X, y, L, 8);
    doc.rect(X + L, y, V, 8);
    doc.setFont(FONT.base, "normal");
    doc.setFontSize(9);
    text(doc, label, X + 2.5, y + 5);
    text(doc, peso(value ?? 0), X + L + 2.5, y + 5);
    y += 8;
  };

  const c = req.travelOrder?.costs || {};
  costRow("Food", c.food);
  costRow("Driver's Allowance", c.driversAllowance);
  costRow("Rent Vehicles", c.rentVehicles);
  costRow("Hired Drivers", c.hiredDrivers);
  costRow("Accommodation", c.accommodation);

  // Legacy single-pair
  if (c.otherLabel && c.otherAmount) costRow(c.otherLabel, c.otherAmount);

  // Repeatable otherItems
  if (Array.isArray(c.otherItems)) {
    c.otherItems.forEach((it) => costRow(it?.label || "Other", it?.amount ?? 0));
  }

  // total row (bold)
  const total = computeTravelTotal(req);
  doc.setFont(FONT.base, "bold");
  doc.rect(X, y, L, 8);
  doc.rect(X + L, y, V, 8);
  text(doc, "Total", X + 2.5, y + 5);
  text(doc, peso(total), X + L + 2.5, y + 5);
  y += 12;

  // ========== ENDORSEMENTS / APPROVALS ==========
  y = drawSectionTitle(doc, "Endorsements / Approvals", X, y);
  y += 3;

  // 5 lines, with optional signature box at the right for Dept. Head
  const LINE_W = W;
  const sigBoxW = 40;
  const sigBoxH = 18;

  // Dept Head (with signature box at right)
  simpleRow(doc, X, y, L, LINE_W - L, "Endorsed By (Dept. Head):", req.travelOrder?.endorsedByHeadName || "________________");
  // Signature box right side
  doc.rect(X + W - sigBoxW, y + 2, sigBoxW - 2, sigBoxH);
  doc.setFont(FONT.base, "normal");
  doc.setFontSize(7);
  text(doc, "Signature", X + W - sigBoxW + (sigBoxW - 2) / 2, y + sigBoxH + 4, { align: "center" });

  // signature image if provided
  const sig = req.travelOrder?.endorsedByHeadSignature;
  if (sig) {
    try {
      doc.addImage(sig, "PNG", X + W - sigBoxW + 2, y + 3, sigBoxW - 6, sigBoxH - 3, undefined, "FAST");
    } catch {
      // ignore image load issues
    }
  }

  y += 8;
  simpleRow(doc, X, y, L, LINE_W - L, "Comptroller:", "Carlos Jayron A. Remiendo"); y += 8;
  simpleRow(doc, X, y, L, LINE_W - L, "HR Director:", "Dr. Maria Sylvia S. Avila");  y += 8;
  simpleRow(doc, X, y, L, LINE_W - L, "VP/COO:", "________________");                 y += 8;
  simpleRow(doc, X, y, L, LINE_W - L, "President:", "Naila E. Leveriza");             y += 14;

  // ========== SCHOOL SERVICE ASSIGNMENT ==========
  y = drawSectionTitle(doc, "School Service Assignment", X, y);
  y += 4;

  simpleRow(doc, X, y, L, W - L, "Driver", req.driver || "—");                       y += 8;
  simpleRow(doc, X, y, L, W - L, "Vehicle", req.vehicle || "—");                     y += 8;
  simpleRow(doc, X, y, L, W - L, "Transportation Coordinator", "Trizzia Maree Z. Casiño");
  y += 12;

  // ========== FOOTER NOTE ==========
  doc.setFont(FONT.base, "normal");
  doc.setFontSize(7);
  text(
    doc,
    "Note: Submit complete report within 5 days after travel. Copies distributed to HRD, Comptroller, Dept., and Transport Coordinator.",
    X,
    MM.PAGE_H - 12
  );

  doc.save(`${req.id}_TravelOrder.pdf`);
}
