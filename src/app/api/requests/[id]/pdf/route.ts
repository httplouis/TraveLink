import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const supabase = await createSupabaseServerClient(true);

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
        .select("name")
        .eq("id", userId)
        .single();
      return data?.name || null;
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

    // Fetch all related data including VP signatures
    const [
      requesterName,
      department,
      headApproverName,
      parentHeadApproverName,
      adminProcessorName,
      comptrollerApproverName,
      hrApproverName,
      vpApproverName,
      vp2ApproverName,
      presidentApproverName,
      execApproverName,
      assignedVehicle,
      assignedDriverName,
    ] = await Promise.all([
      fetchUserName(request.requester_id),
      fetchDepartment(request.department_id),
      fetchUserName(request.head_approved_by),
      fetchUserName(request.parent_head_approved_by),
      fetchUserName(request.admin_processed_by),
      fetchUserName(request.comptroller_approved_by),
      fetchUserName(request.hr_approved_by),
      fetchUserName(request.vp_approved_by),
      fetchUserName(request.vp2_approved_by),
      fetchUserName(request.president_approved_by),
      fetchUserName(request.exec_approved_by),
      fetchVehicle(request.assigned_vehicle_id),
      fetchUserName(request.assigned_driver_id),
    ]);

    // Fetch multiple requesters from requester_invitations
    let multiDeptRequesters: any[] = [];
    try {
      const { data: requesterInvitations } = await supabase
        .from("requester_invitations")
        .select(`
          *,
          user:users!user_id(id, name, email),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: true });
      
      if (requesterInvitations) {
        multiDeptRequesters = requesterInvitations.map((inv: any) => ({
          name: inv.name || inv.user?.name || 'Unknown',
          department: inv.department?.name || inv.department || 'Unknown',
          signature: inv.signature,
        }));
      }
    } catch (err) {
      console.error("[PDF] Error fetching multi-department requesters:", err);
    }

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
    let deptName = department?.name || "Unknown";
    
    // If multiple requesters, combine names and departments
    if (multiDeptRequesters.length > 0) {
      const allNames = [reqName, ...multiDeptRequesters.map((r: any) => r.name)].filter(Boolean);
      const allDepts = new Set([deptName]);
      multiDeptRequesters.forEach((r: any) => {
        if (r.department) allDepts.add(r.department);
      });
      deptName = Array.from(allDepts).join(", ");
      // Show all requesters' names
      const requestingPersons = allNames.join(", ");
      drawInRect(requestingPersons, 150, 180, 210, 14, 9); // Smaller font if multiple
    } else {
      drawInRect(reqName, 150, 180, 210, 14, 10);
    }
    
    // Created date
    drawInRect(fmtLongDate(request.created_at), 100, 123, 150, 14, 10);
    
    // Department(s) - show all if multiple
    drawInRect(deptName, 450, 169, 146, 42, 10);
    
    // Destination
    drawInRect(request.destination || "", 150, 205, 446, 32, 10);
    
    // Departure and return dates
    drawInRect(fmtLongDate(request.travel_start_date), 150, 235, 210, 14, 10);
    drawInRect(fmtLongDate(request.travel_end_date), 450, 235, 150, 14, 10);
    
    // Purpose of travel
    drawInRect(request.purpose || "", 150, 260, 446, 26, 9);
    
    // Travel Cost breakdown (if exists) - match template format
    if (request.expense_breakdown && Array.isArray(request.expense_breakdown)) {
      let costY = 295;
      const maxItems = 12; // Limit to fit on page
      request.expense_breakdown.slice(0, maxItems).forEach((item: any) => {
        const label = item.category || item.label || "Other";
        const amount = item.amount || 0;
        if (amount > 0) {
          const costText = `${label} - Php ${amount.toLocaleString()}`;
          drawInRect(costText, 150, costY, 446, 8, 8);
          costY += 8;
        }
      });
      
      // Total if available
      if (request.total_budget) {
        drawInRect(`Total: Php ${request.total_budget.toLocaleString()}`, 150, costY + 4, 446, 10, 9, true);
      }
    }
    
    // Head name and signature (LEFT) - Department Head endorsement
    if (headApproverName) {
      drawInRect(headApproverName, 125, 400, 260, 14, 10);
    }
    if (request.head_signature) {
      await drawSignature(request.head_signature, 85, 380, 180, 34);
    }
    
    // Parent Head signature if exists (for parent department approval)
    if (parentHeadApproverName && request.parent_head_signature) {
      // Draw below main head signature if parent head exists
      drawInRect(parentHeadApproverName, 125, 360, 260, 14, 10);
      await drawSignature(request.parent_head_signature, 85, 340, 180, 34);
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
    
    // President/COO signature (Approved by section)
    if (presidentApproverName) {
      drawInRect(presidentApproverName, 125, 550, 260, 14, 10);
    }
    if (request.president_signature) {
      await drawSignature(request.president_signature, 85, 530, 180, 34);
    }
    
    // Executive signature (fallback if president_signature not available)
    if (!request.president_signature && request.exec_signature) {
      if (execApproverName) {
        drawInRect(execApproverName, 125, 550, 260, 14, 10);
      }
      await drawSignature(request.exec_signature, 85, 530, 180, 34);
    }
    
    // Comptroller signature and name (For Travel Cost - Recommending Approval)
    if (comptrollerApproverName) {
      drawInRect(comptrollerApproverName, 480, 600, 200, 14, 10);
    }
    if (request.comptroller_signature) {
      await drawSignature(request.comptroller_signature, 480, 570, 150, 30);
    }
    
    // Comptroller recommended amount if exists
    if (request.comptroller_edited_budget) {
      const recAmount = `Rec Amt: ${request.comptroller_edited_budget.toLocaleString()} subject to liquidation`;
      drawInRect(recAmount, 480, 620, 200, 14, 9);
    }
    
    // VP signatures (Recommending Approval section)
    // First VP
    if (vpApproverName) {
      drawInRect(vpApproverName, 125, 750, 260, 14, 10);
    }
    if (request.vp_signature) {
      await drawSignature(request.vp_signature, 85, 730, 180, 34);
    }
    
    // Second VP (if both VPs approved - for multi-department requests)
    if (request.both_vps_approved && vp2ApproverName) {
      drawInRect(vp2ApproverName, 125, 700, 260, 14, 10);
    }
    if (request.vp2_signature) {
      await drawSignature(request.vp2_signature, 85, 680, 180, 34);
    }
    
    // HR Director signature (Noted by section)
    if (hrApproverName) {
      drawInRect(hrApproverName, 125, 650, 260, 14, 10);
    }
    if (request.hr_signature) {
      await drawSignature(request.hr_signature, 85, 630, 180, 34);
    }
    
    // Get all participants/requesters for multi-page support
    const allParticipants: Array<{ name: string; department: string; signature?: string | null }> = [];
    
    // Add primary requester
    if (requesterName) {
      allParticipants.push({
        name: requesterName,
        department: deptName,
        signature: request.requester_signature || null,
      });
    }
    
    // Add confirmed requesters from invitations
    if (multiDeptRequesters.length > 0) {
      multiDeptRequesters.forEach((r: any) => {
        allParticipants.push({
          name: r.name,
          department: r.department || deptName,
          signature: r.signature || null,
        });
      });
    }
    
    // If many participants, create additional pages
    const PARTICIPANTS_PER_PAGE = 8; // Max participants per page
    const needsMultiplePages = allParticipants.length > PARTICIPANTS_PER_PAGE;
    
    if (needsMultiplePages) {
      // Create additional pages for extra participants
      const totalPages = Math.ceil(allParticipants.length / PARTICIPANTS_PER_PAGE);
      
      for (let pageNum = 1; pageNum < totalPages; pageNum++) {
        const newPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
        const startIdx = pageNum * PARTICIPANTS_PER_PAGE;
        const endIdx = Math.min(startIdx + PARTICIPANTS_PER_PAGE, allParticipants.length);
        const pageParticipants = allParticipants.slice(startIdx, endIdx);
        
        // Draw page header
        const headerFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        newPage.drawText(
          `Travel Order - Participants (Page ${pageNum + 1})`,
          {
            x: 50,
            y: PAGE_H - 30,
            size: 12,
            font: headerFont,
            color: rgb(0, 0, 0),
          }
        );
        
        // Draw participants table
        let yPos = PAGE_H - 60;
        const rowHeight = 30;
        const colWidths = [200, 200, 150];
        
        // Table header
        newPage.drawText("Name", { x: 50, y: yPos, size: 10, font: headerFont });
        newPage.drawText("Department", { x: 250, y: yPos, size: 10, font: headerFont });
        newPage.drawText("Signature", { x: 450, y: yPos, size: 10, font: headerFont });
        yPos -= 20;
        
        // Draw line
        newPage.drawLine({
          start: { x: 50, y: yPos },
          end: { x: PAGE_W - 50, y: yPos },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        yPos -= 10;
        
        // Draw participants
        for (const participant of pageParticipants) {
          const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          newPage.drawText(participant.name || "—", { x: 50, y: yPos, size: 9, font: regularFont });
          newPage.drawText(participant.department || "—", { x: 250, y: yPos, size: 9, font: regularFont });
          
          // Draw signature if available
          if (participant.signature) {
            try {
              const base64 = participant.signature.split(',')[1];
              const sigBytes = Buffer.from(base64, 'base64');
              const isPng = participant.signature.startsWith('data:image/png');
              const img = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
              
              const sigWidth = 100;
              const sigHeight = 20;
              const scale = Math.min(sigWidth / img.width, sigHeight / img.height);
              
              newPage.drawImage(img, {
                x: 450,
                y: yPos - 5,
                width: img.width * scale,
                height: img.height * scale,
                opacity: 0.95,
              });
            } catch (err) {
              console.error('Error embedding participant signature:', err);
            }
          }
          
          yPos -= rowHeight;
          
          // Draw line between rows
          newPage.drawLine({
            start: { x: 50, y: yPos },
            end: { x: PAGE_W - 50, y: yPos },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          });
          yPos -= 5;
        }
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Convert to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Use file_code for filename if available, otherwise use request_number
    const filename = request.file_code || request.request_number || `request-${requestId}`;

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
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
