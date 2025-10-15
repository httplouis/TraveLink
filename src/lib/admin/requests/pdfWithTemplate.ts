// src/lib/admin/requests/pdfWithTemplate.ts
import { PDFDocument, rgb } from "pdf-lib";
import type { AdminRequest } from "@/lib/admin/requests/store";

/**
 * Generate Travel Order PDF (Rev.12 Jan2024) using template
 */
export async function generateRequestPDF(req: AdminRequest) {
  try {
    // 1. Load template from public folder
    const templateUrl = "/Travel-Order_Rev12_Jan2024.pdf"; // <-- make sure nasa /public
    const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());

    // 2. Load into pdf-lib
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const font = await pdfDoc.embedFont("Helvetica");

    // Helper to draw text
    const draw = (text: string, x: number, y: number, size = 9) => {
      page.drawText(text || "—", {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    };

    // Helper for peso values (replace ₱ with PHP)
    const peso = (val: number | undefined | null) => `PHP ${val ?? 0}`;

    // === Fill Travel Order fields ===
    draw(req.travelOrder?.requestingPerson || "", 120, 670);
    draw(req.travelOrder?.department || "", 120, 650);
    draw(req.travelOrder?.destination || "", 120, 630);
    draw(req.travelOrder?.departureDate || "", 120, 610);
    draw(req.travelOrder?.returnDate || "", 120, 590);
    draw(req.travelOrder?.purposeOfTravel || "", 120, 570);

    // === Costs ===
    const costs = req.travelOrder?.costs || {};
    draw(peso(costs.food), 400, 520);
    draw(peso(costs.driversAllowance), 400, 500);
    draw(peso(costs.rentVehicles), 400, 480);
    draw(peso(costs.hiredDrivers), 400, 460);
    draw(peso(costs.accommodation), 400, 440);

    // === Endorsements ===
    draw(req.travelOrder?.endorsedByHeadName || "", 120, 400);
    draw(req.travelOrder?.endorsedByHeadDate || "", 120, 385);

    // === School Service ===
    draw(req.driver || "", 120, 350);
    draw(req.vehicle || "", 120, 335);

    // 3. Save as blob for download
   // 3. Save as blob for download
const pdfBytes = await pdfDoc.save();
const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = `${req.id}_TravelOrder.pdf`;
link.click();

URL.revokeObjectURL(url);

  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Failed to generate Travel Order PDF.");
  }
}
