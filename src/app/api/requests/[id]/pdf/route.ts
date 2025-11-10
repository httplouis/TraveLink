import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

    // Get full request details
    const { data: request, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Fetch related data
    const fetchUserName = async (userId: string | null) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single();
      return data?.full_name || null;
    };

    const fetchDepartment = async (deptId: string | null) => {
      if (!deptId) return null;
      const { data } = await supabase
        .from("departments")
        .select("name, code")
        .eq("id", deptId)
        .single();
      return data || null;
    };

    const fetchVehicle = async (vehicleId: string | null) => {
      if (!vehicleId) return null;
      const { data } = await supabase
        .from("vehicles")
        .select("plate_number, model, vehicle_type")
        .eq("id", vehicleId)
        .single();
      return data || null;
    };

    // Fetch all related data
    const [
      requesterName,
      department,
      headApproverName,
      adminProcessorName,
      comptrollerApproverName,
      hrApproverName,
      execApproverName,
      assignedVehicle,
      assignedDriverName,
    ] = await Promise.all([
      fetchUserName(request.requester_id),
      fetchDepartment(request.department_id),
      fetchUserName(request.head_approved_by),
      fetchUserName(request.admin_processed_by),
      fetchUserName(request.comptroller_approved_by),
      fetchUserName(request.hr_approved_by),
      fetchUserName(request.exec_approved_by),
      fetchVehicle(request.assigned_vehicle_id),
      fetchUserName(request.assigned_driver_id),
    ]);

    // Load PDF template from public folder
    const templatePath = path.join(process.cwd(), 'public', 'Travel-Order_Rev12_Jan2024.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    
    // Load the PDF template
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const PAGE_W = page.getWidth();
    const PAGE_H = page.getHeight();
    
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Helper function to draw text using exact coordinates from pdfWithTemplate
    const drawInRect = (text: string, x: number, top: number, w: number, h: number, size: number = 10, bold: boolean = false) => {
      const PAD_X = 2;
      const xL = x + PAD_X;
      const f = bold ? fontBold : font;
      const baselineY = PAGE_H - (top + (h - size) / 2 + size);
      page.drawText(text, {
        x: xL,
        y: baselineY,
        size,
        font: f,
        color: rgb(0, 0, 0),
      });
    };
    
    // Helper to embed signature image
    const drawSignature = async (signatureDataUrl: string | null, x: number, top: number, w: number, h: number) => {
      if (!signatureDataUrl) return;
      try {
        const base64 = signatureDataUrl.split(',')[1];
        const sigBytes = Buffer.from(base64, 'base64');
        const isPng = signatureDataUrl.startsWith('data:image/png');
        const img = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        
        const y = PAGE_H - (top + h);
        const iw = img.width;
        const ih = img.height;
        const scale = Math.min(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = x + (w - dw) / 2;
        const dy = y + (h - dh) / 2;
        
        page.drawImage(img, {
          x: dx,
          y: dy,
          width: dw,
          height: dh,
          opacity: 0.95,
        });
      } catch (err) {
        console.error('Error embedding signature:', err);
      }
    };
    
    // Format date
    const fmtLongDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
      }).format(date);
    };
    
    // Fill in using exact coordinates from pdfWithTemplate.ts
    const reqName = requesterName || request.requester_name || "Unknown";
    const deptName = department?.name || "Unknown";
    
    // Created date
    drawInRect(fmtLongDate(request.created_at), 100, 123, 150, 14, 10);
    
    // Requesting person
    drawInRect(reqName, 150, 180, 210, 14, 10);
    
    // Department
    drawInRect(deptName, 450, 169, 146, 42, 10);
    
    // Destination
    drawInRect(request.destination || "", 150, 205, 446, 32, 10);
    
    // Departure and return dates
    drawInRect(fmtLongDate(request.travel_start_date), 150, 235, 210, 14, 10);
    drawInRect(fmtLongDate(request.travel_end_date), 450, 235, 150, 14, 10);
    
    // Purpose of travel
    drawInRect(request.purpose || "", 150, 260, 446, 26, 9);
    
    // Head name and signature (LEFT)
    if (headApproverName) {
      drawInRect(headApproverName, 125, 400, 260, 14, 10);
    }
    if (request.head_signature) {
      await drawSignature(request.head_signature, 85, 380, 180, 34);
    }
    
    // Driver and vehicle
    if (assignedDriverName) {
      drawInRect(assignedDriverName, 110, 470, 210, 14, 10);
    }
    if (assignedVehicle) {
      drawInRect(`${assignedVehicle.model} (${assignedVehicle.plate_number})`, 110, 485, 210, 14, 10);
    }
    
    // Admin/Coordinator signature (RIGHT)
    if (request.admin_signature) {
      await drawSignature(request.admin_signature, 340, 455, 200, 34);
    }
    
    // HR signature
    if (request.hr_signature) {
      await drawSignature(request.hr_signature, 200, 750, 150, 30);
    }
    
    // Executive signature
    if (request.exec_signature) {
      await drawSignature(request.exec_signature, 200, 820, 150, 30);
    }
    
    // Comptroller signature
    if (request.comptroller_signature) {
      await drawSignature(request.comptroller_signature, 480, 570, 150, 30);
    }
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Convert to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${request.request_number}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/pdf] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
