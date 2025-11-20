import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;
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

    // Load PDF template from public folder based on request type
    const isSeminar = request.request_type === 'seminar';
    const templateFileName = isSeminar 
      ? 'Seminar-Application_Rev06_May2024 (2).pdf'
      : 'Travel-Order_Rev12_Jan2024.pdf';
    
    const templatePath = path.join(process.cwd(), 'public', templateFileName);
    
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      console.error(`[PDF] Template file not found: ${templatePath}`);
      return NextResponse.json(
        { ok: false, error: `PDF template not found: ${templateFileName}` },
        { status: 500 }
      );
    }
    
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
    
    // Fill in data based on request type (Travel Order vs Seminar Application)
    const reqName = requesterName || request.requester_name || "Unknown";
    let deptName = department?.name || "Unknown";
    
    if (isSeminar) {
      // ===== SEMINAR APPLICATION TEMPLATE =====
      // Extract seminar data
      const seminarData = request.seminar_data || {};
      const seminarTitle = seminarData.title || request.title || "";
      const trainingCategory = seminarData.trainingCategory || seminarData.category || "";
      const dateFrom = seminarData.dateFrom || request.travel_start_date || "";
      const dateTo = seminarData.dateTo || request.travel_end_date || "";
      const venue = seminarData.venue || request.destination || "";
      const modality = seminarData.modality || "";
      
      // SEMINAR APPLICATION SIGNATURE COORDINATES
      // These coordinates are based on the Seminar-Application_Rev06_May2024 template
      // If the template changes, these coordinates need to be updated
      // To find exact coordinates:
      // 1. Open the PDF template in a PDF editor (Adobe Acrobat, PDFtk, etc.)
      // 2. Measure the signature box positions from the bottom-left corner (0,0)
      // 3. Update the coordinates below
      // Note: PDF coordinates use bottom-left as origin, so top = PAGE_H - y
      // Applicant Name
      if (multiDeptRequesters.length > 0) {
        const allNames = [reqName, ...multiDeptRequesters.map((r: any) => r.name)].filter(Boolean);
        drawInRect(allNames.join(", "), 150, 180, 210, 14, 9);
      } else {
        drawInRect(reqName, 150, 180, 210, 14, 10);
      }
      
      // Department
      if (multiDeptRequesters.length > 0) {
        const allDepts = new Set([deptName]);
        multiDeptRequesters.forEach((r: any) => {
          if (r.department) allDepts.add(r.department);
        });
        deptName = Array.from(allDepts).join(", ");
      }
      drawInRect(deptName, 450, 169, 146, 42, 10);
      
      // Training Title
      drawInRect(seminarTitle, 150, 205, 446, 32, 10);
      
      // Training Category
      drawInRect(trainingCategory, 150, 235, 210, 14, 10);
      
      // Dates
      if (dateFrom) drawInRect(fmtLongDate(dateFrom), 150, 250, 210, 14, 10);
      if (dateTo) drawInRect(fmtLongDate(dateTo), 450, 250, 150, 14, 10);
      
      // Venue
      drawInRect(venue, 150, 265, 446, 26, 10);
      
      // Modality
      drawInRect(modality, 150, 290, 210, 14, 10);
      
      // Estimated Costs
      const registrationCost = seminarData.registrationCost || 0;
      const totalAmount = seminarData.totalAmount || request.total_budget || 0;
      
      if (registrationCost > 0) {
        drawInRect(`Registration Cost: Php ${registrationCost.toLocaleString()}`, 150, 310, 446, 10, 9);
      }
      
      // Breakdown items
      if (seminarData.breakdown && Array.isArray(seminarData.breakdown)) {
        let costY = 325;
        seminarData.breakdown.slice(0, 5).forEach((item: any) => {
          const label = item.label || item.category || "Other";
          const amount = item.amount || 0;
          if (amount > 0) {
            drawInRect(`${label}: Php ${amount.toLocaleString()}`, 150, costY, 446, 8, 8);
            costY += 8;
          }
        });
        
        // Total
        if (totalAmount > 0) {
          drawInRect(`Total Amount: Php ${totalAmount.toLocaleString()}`, 150, costY + 4, 446, 10, 9, true);
        }
      } else if (totalAmount > 0) {
        drawInRect(`Total Amount: Php ${totalAmount.toLocaleString()}`, 150, 325, 446, 10, 9, true);
      }
      
    } else {
      // ===== TRAVEL ORDER TEMPLATE =====
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
    // Position: "School Transportation Coordinator" or "Approved by" section
    if (request.admin_signature) {
      const adminSigY = isSeminar ? 455 : 455; // Adjust if Seminar template differs
      await drawSignature(request.admin_signature, 340, adminSigY, 200, 34);
    }
    
    // President/COO signature (Approved by section)
    if (presidentApproverName) {
      const presidentNameY = isSeminar ? 550 : 550;
      drawInRect(presidentApproverName, 125, presidentNameY, 260, 14, 10);
    }
    if (request.president_signature) {
      const presidentSigY = isSeminar ? 530 : 530;
      await drawSignature(request.president_signature, 85, presidentSigY, 180, 34);
    }
    
    // Executive signature (fallback if president_signature not available)
    if (!request.president_signature && request.exec_signature) {
      if (execApproverName) {
        drawInRect(execApproverName, 125, 550, 260, 14, 10);
      }
      await drawSignature(request.exec_signature, 85, 530, 180, 34);
    }
    
    // Comptroller signature and name (For Travel Cost - Recommending Approval)
    // Position: Right side, "Recommending Approval" section
    if (comptrollerApproverName) {
      const comptrollerNameY = isSeminar ? 600 : 600;
      drawInRect(comptrollerApproverName, 480, comptrollerNameY, 200, 14, 10);
    }
    if (request.comptroller_signature) {
      const comptrollerSigY = isSeminar ? 570 : 570;
      await drawSignature(request.comptroller_signature, 480, comptrollerSigY, 150, 30);
    }
    
    // Comptroller recommended amount if exists
    if (request.comptroller_edited_budget) {
      const recAmount = `Rec Amt: ${request.comptroller_edited_budget.toLocaleString()} subject to liquidation`;
      const recAmountY = isSeminar ? 620 : 620;
      drawInRect(recAmount, 480, recAmountY, 200, 14, 9);
    }
    
    // VP signatures (Recommending Approval section)
    // First VP - Position: Left side, "Recommending Approval" section
    if (vpApproverName) {
      const vpNameY = isSeminar ? 750 : 750;
      drawInRect(vpApproverName, 125, vpNameY, 260, 14, 10);
    }
    if (request.vp_signature) {
      const vpSigY = isSeminar ? 730 : 730;
      await drawSignature(request.vp_signature, 85, vpSigY, 180, 34);
    }
    
    // Second VP (if both VPs approved - for multi-department requests)
    if (request.both_vps_approved && vp2ApproverName) {
      const vp2NameY = isSeminar ? 700 : 700;
      drawInRect(vp2ApproverName, 125, vp2NameY, 260, 14, 10);
    }
    if (request.vp2_signature) {
      const vp2SigY = isSeminar ? 680 : 680;
      await drawSignature(request.vp2_signature, 85, vp2SigY, 180, 34);
    }
    
    // HR Director signature (Noted by section)
    // Position: Left side, "Noted by" section
    if (hrApproverName) {
      const hrNameY = isSeminar ? 650 : 650;
      drawInRect(hrApproverName, 125, hrNameY, 260, 14, 10);
    }
    if (request.hr_signature) {
      const hrSigY = isSeminar ? 630 : 630;
      await drawSignature(request.hr_signature, 85, hrSigY, 180, 34);
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
        const docTitle = isSeminar ? 'Seminar Application' : 'Travel Order';
        newPage.drawText(
          `${docTitle} - Participants (Page ${pageNum + 1})`,
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
