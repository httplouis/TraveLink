import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { PDF_COORDINATES } from "@/lib/utils/pdf-coordinates-helper";

/**
 * DEBUG ENDPOINT: Fast PDF generation with coordinate grid overlay on actual template
 * 
 * This endpoint loads the actual PDF template and overlays a coordinate grid
 * so you can see where to place elements. Much faster than full PDF generation.
 * 
 * Usage: /api/requests/[id]/pdf-debug
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;
    
    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[GET /api/requests/[id]/pdf-debug] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(true);

    // Get request type to determine which template to use
    let request = null;
    let isSeminar = false;
    try {
      const { data } = await supabase
        .from("requests")
        .select("id, request_number, requester_name, destination, travel_start_date, travel_end_date, purpose, request_type")
        .eq("id", requestId)
        .single();
      request = data;
      isSeminar = request?.request_type === 'seminar';
    } catch (dbError) {
      // Continue even if request not found - default to travel order template
      console.warn("[PDF Debug] Request not found, using default template:", dbError);
    }

    // Load the actual PDF template
    const templateFileName = isSeminar 
      ? 'Seminar-Application_Rev06_May2024 (2).pdf'
      : 'Travel-Order_Rev12_Jan2024.pdf';
    const templatePath = path.join(process.cwd(), 'public', templateFileName);
    
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      console.error(`[PDF Debug] Template file not found: ${templatePath}`);
      return NextResponse.json(
        { ok: false, error: `PDF template not found: ${templateFileName}` },
        { status: 500 }
      );
    }
    
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF template (this shows the actual form structure)
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const PAGE_W = page.getWidth();
    const PAGE_H = page.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw coordinate grid OVER the template (semi-transparent so template is visible)
    const gridStep = 50;
    const gridColor = rgb(0.6, 0.6, 0.9);

    // Vertical lines (semi-transparent so template shows through)
    for (let x = 0; x <= PAGE_W; x += gridStep) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: PAGE_H },
        thickness: 0.3,
        color: gridColor,
        opacity: 0.4,
      });
      // Label (only every 100 to avoid clutter)
      if (x % 100 === 0 || x === 0) {
        page.drawText(`${x}`, {
          x: x + 2,
          y: PAGE_H - 15,
          size: 7,
          font,
          color: rgb(0.3, 0.3, 0.7),
        });
      }
    }

    // Horizontal lines (semi-transparent so template shows through)
    for (let y = 0; y <= PAGE_H; y += gridStep) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: PAGE_W, y },
        thickness: 0.3,
        color: gridColor,
        opacity: 0.4,
      });
      // Label (convert to top-based, only every 100 to avoid clutter)
      const top = PAGE_H - y;
      if (top % 100 === 0 || top === 0 || top === PAGE_H) {
        page.drawText(`${top}`, {
          x: 2,
          y: y - 2,
          size: 7,
          font,
          color: rgb(0.3, 0.3, 0.7),
        });
      }
    }

    // Draw key reference points - USING COORDINATES FROM HELPER FILE
    // This way, when you change coordinates in pdf-coordinates-helper.ts,
    // you'll immediately see the changes here!
    const coords = PDF_COORDINATES;
    const keyPoints = [
      { x: coords.CREATED_DATE.x, top: coords.CREATED_DATE.top, label: "Created Date", w: coords.CREATED_DATE.w, h: coords.CREATED_DATE.h },
      { x: coords.REQUESTING_PERSON.startX, top: coords.REQUESTING_PERSON.startY, label: "Requesting Person Start" },
      { x: coords.REQUESTING_PERSON.startX + coords.REQUESTING_PERSON.name.offsetX, top: coords.REQUESTING_PERSON.startY + coords.REQUESTING_PERSON.name.offsetY, label: "Requester Name", w: coords.REQUESTING_PERSON.name.w, h: coords.REQUESTING_PERSON.name.h },
      { x: coords.REQUESTING_PERSON.startX + coords.REQUESTING_PERSON.signature.offsetX, top: coords.REQUESTING_PERSON.startY + coords.REQUESTING_PERSON.signature.offsetY, label: "Requester Sig", w: coords.REQUESTING_PERSON.signature.w, h: coords.REQUESTING_PERSON.signature.h },
      { x: coords.DEPARTMENT.x, top: coords.DEPARTMENT.top, label: "Department", w: coords.DEPARTMENT.w, h: coords.DEPARTMENT.h },
      { x: coords.DESTINATION.x, top: coords.DESTINATION.top, label: "Destination", w: coords.DESTINATION.w, h: coords.DESTINATION.h },
      { x: coords.DEPARTURE_DATE.x, top: coords.DEPARTURE_DATE.top, label: "Departure Date", w: coords.DEPARTURE_DATE.w, h: coords.DEPARTURE_DATE.h },
      { x: coords.RETURN_DATE.x, top: coords.RETURN_DATE.top, label: "Return Date", w: coords.RETURN_DATE.w, h: coords.RETURN_DATE.h },
      { x: coords.PURPOSE.x, top: coords.PURPOSE.top, label: "Purpose", w: coords.PURPOSE.w, h: coords.PURPOSE.h },
      { x: coords.DESTINATION.x, top: coords.COST_START_Y, label: "Cost Start" },
      { x: coords.APPROVALS.HEAD.sig.x, top: coords.APPROVALS.HEAD.sig.top, label: "Head Sig", w: coords.APPROVALS.HEAD.sig.w, h: coords.APPROVALS.HEAD.sig.h },
      { x: coords.APPROVALS.HEAD.name.x, top: coords.APPROVALS.HEAD.name.top, label: "Head Name", w: coords.APPROVALS.HEAD.name.w, h: coords.APPROVALS.HEAD.name.h },
      { x: coords.APPROVALS.HEAD.date.x, top: coords.APPROVALS.HEAD.date.top, label: "Head Date", w: coords.APPROVALS.HEAD.date.w, h: coords.APPROVALS.HEAD.date.h },
      { x: coords.APPROVALS.HEAD.comments.x, top: coords.APPROVALS.HEAD.comments.top, label: "Head Comments", w: coords.APPROVALS.HEAD.comments.w, h: coords.APPROVALS.HEAD.comments.h },
      { x: coords.APPROVALS.COMPTROLLER.sig.x, top: coords.APPROVALS.COMPTROLLER.sig.top, label: "Comptroller Sig", w: coords.APPROVALS.COMPTROLLER.sig.w, h: coords.APPROVALS.COMPTROLLER.sig.h },
      { x: coords.APPROVALS.COMPTROLLER.name.x, top: coords.APPROVALS.COMPTROLLER.name.top, label: "Comptroller Name", w: coords.APPROVALS.COMPTROLLER.name.w, h: coords.APPROVALS.COMPTROLLER.name.h },
      { x: coords.APPROVALS.COMPTROLLER.date.x, top: coords.APPROVALS.COMPTROLLER.date.top, label: "Comptroller Date", w: coords.APPROVALS.COMPTROLLER.date.w, h: coords.APPROVALS.COMPTROLLER.date.h },
      { x: coords.APPROVALS.COMPTROLLER.comments.x, top: coords.APPROVALS.COMPTROLLER.comments.top, label: "Comptroller Comments", w: coords.APPROVALS.COMPTROLLER.comments.w, h: coords.APPROVALS.COMPTROLLER.comments.h },
      { x: coords.APPROVALS.HR.sig.x, top: coords.APPROVALS.HR.sig.top, label: "HR Sig", w: coords.APPROVALS.HR.sig.w, h: coords.APPROVALS.HR.sig.h },
      { x: coords.APPROVALS.HR.name.x, top: coords.APPROVALS.HR.name.top, label: "HR Name", w: coords.APPROVALS.HR.name.w, h: coords.APPROVALS.HR.name.h },
      { x: coords.APPROVALS.HR.date.x, top: coords.APPROVALS.HR.date.top, label: "HR Date", w: coords.APPROVALS.HR.date.w, h: coords.APPROVALS.HR.date.h },
      { x: coords.APPROVALS.HR.comments.x, top: coords.APPROVALS.HR.comments.top, label: "HR Comments", w: coords.APPROVALS.HR.comments.w, h: coords.APPROVALS.HR.comments.h },
      { x: coords.APPROVALS.VP.sig.x, top: coords.APPROVALS.VP.sig.top, label: "VP Sig", w: coords.APPROVALS.VP.sig.w, h: coords.APPROVALS.VP.sig.h },
      { x: coords.APPROVALS.VP.name.x, top: coords.APPROVALS.VP.name.top, label: "VP Name", w: coords.APPROVALS.VP.name.w, h: coords.APPROVALS.VP.name.h },
      { x: coords.APPROVALS.VP.date.x, top: coords.APPROVALS.VP.date.top, label: "VP Date", w: coords.APPROVALS.VP.date.w, h: coords.APPROVALS.VP.date.h },
      { x: coords.APPROVALS.VP.comments.x, top: coords.APPROVALS.VP.comments.top, label: "VP Comments", w: coords.APPROVALS.VP.comments.w, h: coords.APPROVALS.VP.comments.h },
      { x: coords.APPROVALS.PRESIDENT.sig.x, top: coords.APPROVALS.PRESIDENT.sig.top, label: "President Sig", w: coords.APPROVALS.PRESIDENT.sig.w, h: coords.APPROVALS.PRESIDENT.sig.h },
      { x: coords.APPROVALS.PRESIDENT.name.x, top: coords.APPROVALS.PRESIDENT.name.top, label: "President Name", w: coords.APPROVALS.PRESIDENT.name.w, h: coords.APPROVALS.PRESIDENT.name.h },
      { x: coords.APPROVALS.PRESIDENT.date.x, top: coords.APPROVALS.PRESIDENT.date.top, label: "President Date", w: coords.APPROVALS.PRESIDENT.date.w, h: coords.APPROVALS.PRESIDENT.date.h },
      { x: coords.APPROVALS.PRESIDENT.comments.x, top: coords.APPROVALS.PRESIDENT.comments.top, label: "President Comments", w: coords.APPROVALS.PRESIDENT.comments.w, h: coords.APPROVALS.PRESIDENT.comments.h },
      { x: coords.APPROVALS.TRANSPORT_COORD.sig.x, top: coords.APPROVALS.TRANSPORT_COORD.sig.top, label: "Transport Coord Sig", w: coords.APPROVALS.TRANSPORT_COORD.sig.w, h: coords.APPROVALS.TRANSPORT_COORD.sig.h },
      { x: coords.APPROVALS.TRANSPORT_COORD.name.x, top: coords.APPROVALS.TRANSPORT_COORD.name.top, label: "Transport Coord Name", w: coords.APPROVALS.TRANSPORT_COORD.name.w, h: coords.APPROVALS.TRANSPORT_COORD.name.h },
      { x: coords.APPROVALS.TRANSPORT_COORD.date.x, top: coords.APPROVALS.TRANSPORT_COORD.date.top, label: "Transport Coord Date", w: coords.APPROVALS.TRANSPORT_COORD.date.w, h: coords.APPROVALS.TRANSPORT_COORD.date.h },
      { x: coords.DRIVER.x, top: coords.DRIVER.top, label: "Driver", w: coords.DRIVER.w, h: coords.DRIVER.h },
      { x: coords.VEHICLE.x, top: coords.VEHICLE.top, label: "Vehicle", w: coords.VEHICLE.w, h: coords.VEHICLE.h },
    ];

    keyPoints.forEach((point) => {
      const pdfY = PAGE_H - point.top;
      const crosshairColor = rgb(1, 0, 0);
      
      // Draw crosshair at the position
      page.drawLine({
        start: { x: point.x - 10, y: pdfY },
        end: { x: point.x + 10, y: pdfY },
        thickness: 1,
        color: crosshairColor,
      });
      page.drawLine({
        start: { x: point.x, y: pdfY - 10 },
        end: { x: point.x, y: pdfY + 10 },
        thickness: 1,
        color: crosshairColor,
      });

      // Draw bounding box if width/height are available
      if (point.w && point.h) {
        const boxY = PAGE_H - (point.top + point.h);
        page.drawRectangle({
          x: point.x,
          y: boxY,
          width: point.w,
          height: point.h,
          borderColor: rgb(0, 0.8, 0),
          borderWidth: 0.5,
          opacity: 0.2,
        });
      }

      // Draw label with background for better visibility
      const labelY = pdfY - 4;
      const labelText = point.label;
      const labelWidth = fontBold.widthOfTextAtSize(labelText, 7);
      
      // Draw white background behind label for visibility
      page.drawRectangle({
        x: point.x + 12,
        y: labelY - 8,
        width: labelWidth + 4,
        height: 10,
        color: rgb(1, 1, 1),
        opacity: 0.9,
      });
      
      page.drawText(labelText, {
        x: point.x + 14,
        y: labelY,
        size: 7,
        font: fontBold,
        color: rgb(1, 0, 0),
      });

      // Draw coordinates with background
      const coordText = point.w && point.h 
        ? `(${point.x}, ${point.top}) [${point.w}×${point.h}]`
        : `(${point.x}, ${point.top})`;
      const coordWidth = font.widthOfTextAtSize(coordText, 6);
      
      page.drawRectangle({
        x: point.x + 12,
        y: pdfY - 20,
        width: coordWidth + 4,
        height: 8,
        color: rgb(1, 1, 1),
        opacity: 0.9,
      });
      
      page.drawText(coordText, {
        x: point.x + 14,
        y: pdfY - 12,
        size: 6,
        font,
        color: rgb(0.5, 0, 0),
      });
    });

    // Draw sample text at key positions to show template structure
    // (coords already declared above)
    
    // Created Date
    const createdDateY = PAGE_H - coords.CREATED_DATE.top;
    page.drawText("Nov 24, 2025", {
      x: coords.CREATED_DATE.x,
      y: createdDateY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Requesting Person section - Show multiple requesters VERTICALLY (signature BESIDE name, NO date/time)
    const reqCoords = coords.REQUESTING_PERSON;
    
    // First requester (BELSON TAN) - First position
    const req1BaseX = reqCoords.startX;
    const req1BaseY = reqCoords.startY;
    const req1NameY = PAGE_H - (req1BaseY + reqCoords.name.offsetY);
    
    // Name removed for manual adjustment
    // Signature placeholder BESIDE name (to the right)
    const req1SigY = PAGE_H - (req1BaseY + reqCoords.signature.offsetY);
    page.drawRectangle({
      x: req1BaseX + reqCoords.signature.offsetX,
      y: req1SigY - reqCoords.sigHeight,
      width: reqCoords.sigWidth,
      height: reqCoords.sigHeight,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[Sig]", {
      x: req1BaseX + reqCoords.signature.offsetX + 5,
      y: req1SigY - reqCoords.sigHeight / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Second requester (JOSE LOUIS ROSALES) - Below first (15 points spacing)
    const req2BaseX = req1BaseX; // Same X position
    const req2BaseY = req1BaseY - reqCoords.rowSpacing; // Below first
    const req2NameY = PAGE_H - (req2BaseY + reqCoords.name.offsetY);
    const req2SigY = PAGE_H - (req2BaseY + reqCoords.signature.offsetY);
    
    // Name removed for manual adjustment
    // Signature placeholder BESIDE name (to the right)
    page.drawRectangle({
      x: req2BaseX + reqCoords.signature.offsetX,
      y: req2SigY - reqCoords.sigHeight,
      width: reqCoords.sigWidth,
      height: reqCoords.sigHeight,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[Jose Sig]", {
      x: req2BaseX + reqCoords.signature.offsetX + 5,
      y: req2SigY - reqCoords.sigHeight / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // NO date/time - removed as requested
    
    // Department
    const deptY = PAGE_H - coords.DEPARTMENT.top;
    page.drawText("CCMS", {
      x: coords.DEPARTMENT.x,
      y: deptY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Destination
    const destY = PAGE_H - coords.DESTINATION.top;
    page.drawText(request?.destination || "Asian Hospital and Medical Center, Muntinlupa", { 
      x: coords.DESTINATION.x, 
      y: destY, 
      size: 10, 
      font, 
      color: rgb(0, 0, 0) 
    });
    
    // Departure Date
    const depDateY = PAGE_H - coords.DEPARTURE_DATE.top;
    page.drawText("Nov 25, 2025", {
      x: coords.DEPARTURE_DATE.x,
      y: depDateY,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Return Date
    const retDateY = PAGE_H - coords.RETURN_DATE.top;
    page.drawText("Nov 26, 2025", {
      x: coords.RETURN_DATE.x,
      y: retDateY,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Purpose
    const purposeY = PAGE_H - coords.PURPOSE.top;
    page.drawText(request?.purpose || "Medical consultation and follow-up", {
      x: coords.PURPOSE.x,
      y: purposeY,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Travel Cost items - properly aligned using coordinates from helper
    let costY = PAGE_H - coords.COST_START_Y;
    // First cost item
    page.drawText("Meals during travel - Php 500", {
      x: 150,
      y: costY,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    // Second cost item
    costY -= coords.COST_ITEM_SPACING;
    page.drawText("Driver costs - Php 50", {
      x: 150,
      y: costY,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });
    // Total (with extra spacing)
    costY -= coords.COST_ITEM_SPACING + 4;
    page.drawText("Total: Php 550", {
      x: 150,
      y: costY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    
    // Approval sections with sample data
    // Head
    const headSigY = PAGE_H - coords.APPROVALS.HEAD.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.HEAD.sig.x,
      y: headSigY - coords.APPROVALS.HEAD.sig.h,
      width: coords.APPROVALS.HEAD.sig.w,
      height: coords.APPROVALS.HEAD.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[Head Signature]", {
      x: coords.APPROVALS.HEAD.sig.x + 5,
      y: headSigY - coords.APPROVALS.HEAD.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const headNameY = PAGE_H - coords.APPROVALS.HEAD.name.top;
    // Name removed for manual adjustment
    const headDateY = PAGE_H - coords.APPROVALS.HEAD.date.top;
    page.drawText("Nov 24, 2025, 6:45 AM", {
      x: coords.APPROVALS.HEAD.date.x,
      y: headDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    const headCommentsY = PAGE_H - coords.APPROVALS.HEAD.comments.top;
    page.drawText("Approved. Proceed to comptroller.", {
      x: coords.APPROVALS.HEAD.comments.x,
      y: headCommentsY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Comptroller
    const compSigY = PAGE_H - coords.APPROVALS.COMPTROLLER.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.COMPTROLLER.sig.x,
      y: compSigY - coords.APPROVALS.COMPTROLLER.sig.h,
      width: coords.APPROVALS.COMPTROLLER.sig.w,
      height: coords.APPROVALS.COMPTROLLER.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[Comptroller Sig]", {
      x: coords.APPROVALS.COMPTROLLER.sig.x + 5,
      y: compSigY - coords.APPROVALS.COMPTROLLER.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const compNameY = PAGE_H - coords.APPROVALS.COMPTROLLER.name.top;
    // Name removed for manual adjustment
    const compDateY = PAGE_H - coords.APPROVALS.COMPTROLLER.date.top;
    page.drawText("Nov 25, 2025, 1:45 AM", {
      x: coords.APPROVALS.COMPTROLLER.date.x,
      y: compDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    const compCommentsY = PAGE_H - coords.APPROVALS.COMPTROLLER.comments.top;
    page.drawText("Request approved. Budget reviewed.", {
      x: coords.APPROVALS.COMPTROLLER.comments.x,
      y: compCommentsY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    
    // HR
    const hrSigY = PAGE_H - coords.APPROVALS.HR.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.HR.sig.x,
      y: hrSigY - coords.APPROVALS.HR.sig.h,
      width: coords.APPROVALS.HR.sig.w,
      height: coords.APPROVALS.HR.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[HR Signature]", {
      x: coords.APPROVALS.HR.sig.x + 5,
      y: hrSigY - coords.APPROVALS.HR.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const hrNameY = PAGE_H - coords.APPROVALS.HR.name.top;
    // Name removed for manual adjustment
    const hrDateY = PAGE_H - coords.APPROVALS.HR.date.top;
    page.drawText("Nov 25, 2025, 2:00 PM", {
      x: coords.APPROVALS.HR.date.x,
      y: hrDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    const hrCommentsY = PAGE_H - coords.APPROVALS.HR.comments.top;
    page.drawText("Noted. Proceed to VP.", {
      x: coords.APPROVALS.HR.comments.x,
      y: hrCommentsY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    
    // VP
    const vpSigY = PAGE_H - coords.APPROVALS.VP.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.VP.sig.x,
      y: vpSigY - coords.APPROVALS.VP.sig.h,
      width: coords.APPROVALS.VP.sig.w,
      height: coords.APPROVALS.VP.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[VP Signature]", {
      x: coords.APPROVALS.VP.sig.x + 5,
      y: vpSigY - coords.APPROVALS.VP.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const vpNameY = PAGE_H - coords.APPROVALS.VP.name.top;
    // Name removed for manual adjustment
    const vpDateY = PAGE_H - coords.APPROVALS.VP.date.top;
    page.drawText("Nov 25, 2025, 3:00 PM", {
      x: coords.APPROVALS.VP.date.x,
      y: vpDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    const vpCommentsY = PAGE_H - coords.APPROVALS.VP.comments.top;
    page.drawText("Approved. All requirements met.", {
      x: coords.APPROVALS.VP.comments.x,
      y: vpCommentsY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    
    // President
    const presSigY = PAGE_H - coords.APPROVALS.PRESIDENT.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.PRESIDENT.sig.x,
      y: presSigY - coords.APPROVALS.PRESIDENT.sig.h,
      width: coords.APPROVALS.PRESIDENT.sig.w,
      height: coords.APPROVALS.PRESIDENT.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[President Sig]", {
      x: coords.APPROVALS.PRESIDENT.sig.x + 5,
      y: presSigY - coords.APPROVALS.PRESIDENT.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const presNameY = PAGE_H - coords.APPROVALS.PRESIDENT.name.top;
    // Name removed for manual adjustment
    const presDateY = PAGE_H - coords.APPROVALS.PRESIDENT.date.top;
    page.drawText("Nov 25, 2025, 4:00 PM", {
      x: coords.APPROVALS.PRESIDENT.date.x,
      y: presDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    const presCommentsY = PAGE_H - coords.APPROVALS.PRESIDENT.comments.top;
    page.drawText("Fully approved. All requirements met.", {
      x: coords.APPROVALS.PRESIDENT.comments.x,
      y: presCommentsY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Driver and Vehicle
    const driverY = PAGE_H - coords.DRIVER.top;
    page.drawText("CARLOS HERNANDEZ", {
      x: coords.DRIVER.x,
      y: driverY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    const vehicleY = PAGE_H - coords.VEHICLE.top;
    page.drawText("L300 Van (ABC-1234)", {
      x: coords.VEHICLE.x,
      y: vehicleY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Transport Coordinator
    const transSigY = PAGE_H - coords.APPROVALS.TRANSPORT_COORD.sig.top;
    page.drawRectangle({
      x: coords.APPROVALS.TRANSPORT_COORD.sig.x,
      y: transSigY - coords.APPROVALS.TRANSPORT_COORD.sig.h,
      width: coords.APPROVALS.TRANSPORT_COORD.sig.w,
      height: coords.APPROVALS.TRANSPORT_COORD.sig.h,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    page.drawText("[Transport Sig]", {
      x: coords.APPROVALS.TRANSPORT_COORD.sig.x + 5,
      y: transSigY - coords.APPROVALS.TRANSPORT_COORD.sig.h / 2 - 3,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const transNameY = PAGE_H - coords.APPROVALS.TRANSPORT_COORD.name.top;
    // Name removed for manual adjustment
    const transDateY = PAGE_H - coords.APPROVALS.TRANSPORT_COORD.date.top;
    page.drawText("Nov 24, 2025, 7:48 AM", {
      x: coords.APPROVALS.TRANSPORT_COORD.date.x,
      y: transDateY,
      size: 7,
      font,
      color: rgb(0, 0, 0),
    });

    // Instructions (with background box for visibility over template)
    const instructionY = PAGE_H - 30;
    page.drawRectangle({
      x: 45,
      y: instructionY - 50,
      width: 500,
      height: 45,
      color: rgb(1, 1, 1),
      opacity: 0.9,
      borderColor: rgb(0, 0, 1),
      borderWidth: 1,
    });
    page.drawText("COORDINATE GRID OVERLAY - Template visible underneath", {
      x: 50,
      y: instructionY,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0.8),
    });
    page.drawText("Red crosshairs = Current positions | Adjust in pdf-coordinates-helper.ts", {
      x: 50,
      y: instructionY - 15,
      size: 9,
      font,
      color: rgb(0, 0, 0.6),
    });
    page.drawText(`Template: ${templateFileName}`, {
      x: 50,
      y: instructionY - 30,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pdf-coordinates-debug.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[PDF Debug] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate debug PDF" },
      { status: 500 }
    );
  }
}

