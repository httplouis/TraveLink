import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import {
  extractInitials,
  formatPDFFilename,
  formatApprovalTimestamp,
  formatApproverInfo,
} from "@/lib/utils/pdf-helpers";

// Route segment config to ensure proper handling
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Fetch related data with full user info (name, title, department, position)
    const fetchUserInfo = async (userId: string | null) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("users")
        .select(`
          id,
          name,
          position_title,
          department:departments!users_department_id_fkey(
            id,
            name,
            code
          )
        `)
        .eq("id", userId)
        .single();
      
      if (!data) return null;
      
      // Handle department - it might be an object or array
      const dept = Array.isArray(data.department) ? data.department[0] : data.department;
      
      return {
        name: data.name || null,
        title: data.position_title || null,
        department: dept?.name || dept?.code || null,
        position: data.position_title || null,
      };
    };

    // Backward compatibility
    const fetchUserName = async (userId: string | null) => {
      const info = await fetchUserInfo(userId);
      return info?.name || null;
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

    // Fetch all related data including VP signatures with full user info
    const [
      requesterInfo,
      department,
      headApproverInfo,
      parentHeadApproverInfo,
      adminProcessorInfo,
      comptrollerApproverInfo,
      hrApproverInfo,
      vpApproverInfo,
      vp2ApproverInfo,
      presidentApproverInfo,
      execApproverInfo,
      assignedVehicle,
      assignedDriverName,
    ] = await Promise.all([
      fetchUserInfo(request.requester_id),
      fetchDepartment(request.department_id),
      fetchUserInfo(request.head_approved_by),
      fetchUserInfo(request.parent_head_approved_by),
      fetchUserInfo(request.admin_processed_by || request.admin_approved_by),
      fetchUserInfo(request.comptroller_approved_by),
      fetchUserInfo(request.hr_approved_by),
      fetchUserInfo(request.vp_approved_by),
      fetchUserInfo(request.vp2_approved_by),
      fetchUserInfo(request.president_approved_by),
      fetchUserInfo(request.exec_approved_by),
      fetchVehicle(request.assigned_vehicle_id),
      fetchUserName(request.assigned_driver_id),
    ]);

    // Extract names for backward compatibility
    const requesterName = requesterInfo?.name || request.requester_name || "Unknown";
    const headApproverName = headApproverInfo?.name;
    const parentHeadApproverName = parentHeadApproverInfo?.name;
    const adminProcessorName = adminProcessorInfo?.name;
    const comptrollerApproverName = comptrollerApproverInfo?.name;
    const hrApproverName = hrApproverInfo?.name;
    const vpApproverName = vpApproverInfo?.name;
    const vp2ApproverName = vp2ApproverInfo?.name;
    const presidentApproverName = presidentApproverInfo?.name;
    const execApproverName = execApproverInfo?.name;

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
          departmentCode: inv.department?.code || null,
          signature: inv.signature,
          confirmed_at: inv.confirmed_at,
        }));
      }
    } catch (err) {
      console.error("[PDF] Error fetching multi-department requesters:", err);
    }

    // Fetch head endorsement invitations for timestamps and comments
    let headEndorsements: any[] = [];
    try {
      const { data: headInvitations } = await supabase
        .from("head_endorsement_invitations")
        .select(`
          *,
          head:users!head_user_id(id, name, email),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: true });
      
      if (headInvitations) {
        headEndorsements = headInvitations.map((inv: any) => ({
          name: inv.head?.name || 'Unknown',
          signature: inv.signature,
          confirmed_at: inv.confirmed_at,
          comments: inv.comments || null,
        }));
      }
    } catch (err) {
      console.error("[PDF] Error fetching head endorsements:", err);
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

    // Format date and time (Philippines timezone)
    const fmtDateTime = (dateStr: string | null | undefined) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        // Convert to Philippines timezone (UTC+8)
        const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
        
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Manila",
        }).format(date);
      } catch (err) {
        console.error("[PDF] Error formatting date/time:", err);
        return "";
      }
    };

    // Cost category labels mapping
    const COST_LABELS: Record<string, string> = {
      food: "Food",
      driversAllowance: "Driver's allowance",
      rentVehicles: "Rent vehicles",
      hiredDrivers: "Hired drivers",
      accommodation: "Accommodation",
      total: "Total",
    };

    // Get display label for expense category
    const getExpenseLabel = (category: string | null | undefined, label: string | null | undefined): string => {
      // If there's a custom label, use it
      if (label && label.trim()) return label;
      // If category matches a known key, use the mapped label
      if (category && COST_LABELS[category]) return COST_LABELS[category];
      // If category is already a display name, use it
      if (category && Object.values(COST_LABELS).includes(category)) return category;
      // Try to match category with case-insensitive comparison
      if (category) {
        const lowerCategory = category.toLowerCase();
        for (const [key, value] of Object.entries(COST_LABELS)) {
          if (key.toLowerCase() === lowerCategory || value.toLowerCase() === lowerCategory) {
            return value;
          }
        }
        // If category looks like a valid name (not empty, has letters), use it
        if (category.trim().length > 0 && /[a-zA-Z]/.test(category)) {
          return category;
        }
      }
      // Fallback to "Other" only if category is truly missing
      return "Other";
    };

    // Get department acronym (prefer code, otherwise abbreviate name)
    const getDeptAcronym = (dept: { name?: string; code?: string } | null | undefined): string => {
      if (!dept) return "";
      if (dept.code) return dept.code.toUpperCase();
      // Fallback: try to extract acronym from name
      const name = dept.name || "";
      if (name.includes("College of Computing")) return "CCMS";
      if (name.includes("Human Resource")) return "HRD";
      if (name.includes("College of Engineering")) return "CENG";
      // Default: return first letters of words
      return name.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 10);
    };

    // Remove duplicate names from requester list
    const removeDuplicateNames = (requesters: Array<{ name: string; [key: string]: any }>): Array<{ name: string; [key: string]: any }> => {
      const seen = new Set<string>();
      return requesters.filter(req => {
        const normalized = req.name.trim().toUpperCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
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
          const displayLabel = getExpenseLabel(item.category, item.label);
          const amount = item.amount || 0;
          if (amount > 0) {
            drawInRect(`${displayLabel}: Php ${amount.toLocaleString()}`, 150, costY, 446, 8, 8);
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
      // Collect all requesters (primary + additional), remove duplicates
      // Primary requester signature should be included if available
      const allRequesters: Array<{ name: string; signature?: string | null; confirmed_at?: string | null }> = [
        { 
          name: reqName, 
          signature: request.requester_signature || null, 
          confirmed_at: request.requester_signed_at || request.created_at 
        },
        ...multiDeptRequesters.map((r: any) => ({
          name: r.name,
          signature: r.signature || null,
          confirmed_at: r.confirmed_at || null,
        }))
      ];
      const uniqueRequesters = removeDuplicateNames(allRequesters);
      
      // Limit to 6 requesters per page for main page
      const MAX_REQUESTERS_PER_PAGE = 6;
      const mainPageRequesters = uniqueRequesters.slice(0, MAX_REQUESTERS_PER_PAGE);
      const extraRequesters = uniqueRequesters.slice(MAX_REQUESTERS_PER_PAGE);
      
      // Draw requesting persons in 2-column layout (up to 6 per page)
      // Layout: 2 columns, 3 rows max
      const requesterBoxWidth = 100; // Width per requester box
      const requesterBoxHeight = 20; // Height per requester box
      const requesterStartX = 150;
      const requesterStartY = 180;
      const requesterColSpacing = 120; // Space between columns
      const requesterRowSpacing = 25; // Space between rows
      
      // Use for...of loop to properly handle async/await
      for (let idx = 0; idx < mainPageRequesters.length; idx++) {
        const req = mainPageRequesters[idx];
        const col = idx % 2; // 0 or 1
        const row = Math.floor(idx / 2); // 0, 1, or 2
        const x = requesterStartX + (col * requesterColSpacing);
        const y = requesterStartY - (row * requesterRowSpacing);
        
        // Draw name
        drawInRect(req.name, x, y, requesterBoxWidth, 10, 9);
        
        // Draw signature if available (larger box for better visibility)
        if (req.signature) {
          await drawSignature(req.signature, x + requesterBoxWidth - 60, y - 10, 60, 25);
        }
      }
      
      // Created date
      drawInRect(fmtLongDate(request.created_at), 100, 123, 150, 14, 10);
      
      // Department(s) - use acronyms, display vertically if multiple
      const allDeptCodes = new Set<string>();
      if (department?.code) allDeptCodes.add(department.code.toUpperCase());
      multiDeptRequesters.forEach((r: any) => {
        if (r.departmentCode) allDeptCodes.add(r.departmentCode.toUpperCase());
        else if (r.department) {
          // Try to get code from department name
          const deptInfo = { name: r.department, code: undefined };
          const acronym = getDeptAcronym(deptInfo);
          if (acronym) allDeptCodes.add(acronym);
        }
      });
      
      // If no codes found, use department names and convert to acronyms
      if (allDeptCodes.size === 0) {
        if (department) {
          const deptAcronym = getDeptAcronym(department);
          if (deptAcronym) allDeptCodes.add(deptAcronym);
        }
        multiDeptRequesters.forEach((r: any) => {
          if (r.department) {
            const deptInfo = { name: r.department, code: undefined };
            const acronym = getDeptAcronym(deptInfo);
            if (acronym) allDeptCodes.add(acronym);
          }
        });
      }
      
      // Display departments vertically
      const deptList = Array.from(allDeptCodes);
      if (deptList.length > 0) {
        const deptText = deptList.join("\n");
        // Draw each department on a new line
        deptList.forEach((dept, idx) => {
          drawInRect(dept, 450, 169 - (idx * 12), 146, 12, 10);
        });
      } else {
        // Fallback to original department name
        drawInRect(deptName, 450, 169, 146, 42, 10);
      }
      
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
          const displayLabel = getExpenseLabel(item.category, item.label);
          const amount = item.amount || 0;
          if (amount > 0) {
            const costText = `${displayLabel} - Php ${amount.toLocaleString()}`;
            drawInRect(costText, 150, costY, 446, 8, 8);
            costY += 8;
          }
        });
        
        // Total if available
        if (request.total_budget) {
          drawInRect(`Total: Php ${request.total_budget.toLocaleString()}`, 150, costY + 4, 446, 10, 9, true);
        }
      } else {
        // Fallback: Try to build expense breakdown from individual cost fields if expense_breakdown is not available
        const costs: any = {};
        if (request.food) costs.food = request.food;
        if (request.drivers_allowance) costs.driversAllowance = request.drivers_allowance;
        if (request.rent_vehicles) costs.rentVehicles = request.rent_vehicles;
        if (request.hired_drivers) costs.hiredDrivers = request.hired_drivers;
        if (request.accommodation) costs.accommodation = request.accommodation;
        
        let costY = 295;
        const costItems = [
          { category: 'food', amount: costs.food },
          { category: 'driversAllowance', amount: costs.driversAllowance },
          { category: 'rentVehicles', amount: costs.rentVehicles },
          { category: 'hiredDrivers', amount: costs.hiredDrivers },
          { category: 'accommodation', amount: costs.accommodation },
        ].filter(item => item.amount && item.amount > 0);
        
        costItems.forEach((item) => {
          const displayLabel = getExpenseLabel(item.category, null);
          const costText = `${displayLabel} - Php ${item.amount.toLocaleString()}`;
          drawInRect(costText, 150, costY, 446, 8, 8);
          costY += 8;
        });
        
        // Total if available
        if (request.total_budget) {
          drawInRect(`Total: Php ${request.total_budget.toLocaleString()}`, 150, costY + 4, 446, 10, 9, true);
        }
      }
      
      // Create additional pages for extra requesters (beyond 6 on main page)
      if (extraRequesters.length > 0) {
        const REQUESTERS_PER_PAGE = 6; // Same limit as main page
        const totalPages = Math.ceil(extraRequesters.length / REQUESTERS_PER_PAGE);
        
        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          const newPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
          const startIdx = pageNum * REQUESTERS_PER_PAGE;
          const endIdx = Math.min(startIdx + REQUESTERS_PER_PAGE, extraRequesters.length);
          const pageRequesters = extraRequesters.slice(startIdx, endIdx);
          
          // Draw page header
          const headerFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
          const docTitle = 'Travel Order';
          const requestNumber = request.request_number || request.file_code || 'N/A';
          newPage.drawText(
            `${docTitle} - Requesting Persons (Page ${pageNum + 2})`,
            {
              x: 50,
              y: PAGE_H - 30,
              size: 12,
              font: headerFont,
              color: rgb(0, 0, 0),
            }
          );
          newPage.drawText(
            `Request Number: ${requestNumber}`,
            {
              x: 50,
              y: PAGE_H - 45,
              size: 10,
              font: font,
              color: rgb(0, 0, 0),
            }
          );
          
          // Draw requesters table
          let yPos = PAGE_H - 80;
          const rowHeight = 50; // More space for signature
          const nameColX = 50;
          const sigColX = 300;
          const dateColX = 500;
          
          // Table header
          newPage.drawText("Requesting Person", { x: nameColX, y: yPos, size: 10, font: headerFont });
          newPage.drawText("Signature", { x: sigColX, y: yPos, size: 10, font: headerFont });
          newPage.drawText("Date/Time", { x: dateColX, y: yPos, size: 10, font: headerFont });
          yPos -= 20;
          
          // Draw header line
          newPage.drawLine({
            start: { x: 50, y: yPos },
            end: { x: PAGE_W - 50, y: yPos },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
          yPos -= 15;
          
          // Draw requesters
          const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          for (const requester of pageRequesters) {
            // Draw name
            newPage.drawText(requester.name || "—", { 
              x: nameColX, 
              y: yPos, 
              size: 9, 
              font: regularFont 
            });
            
            // Draw signature if available
            if (requester.signature) {
              try {
                const base64 = requester.signature.split(',')[1];
                const sigBytes = Buffer.from(base64, 'base64');
                const isPng = requester.signature.startsWith('data:image/png');
                const img = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
                
                const sigWidth = 120;
                const sigHeight = 30;
                const scale = Math.min(sigWidth / img.width, sigHeight / img.height);
                
                newPage.drawImage(img, {
                  x: sigColX,
                  y: yPos - 10,
                  width: img.width * scale,
                  height: img.height * scale,
                  opacity: 0.95,
                });
              } catch (err) {
                console.error('Error embedding requester signature:', err);
              }
            }
            
            // Draw date/time if available
            if (requester.confirmed_at) {
              const dateTimeText = fmtDateTime(requester.confirmed_at);
              newPage.drawText(dateTimeText, { 
                x: dateColX, 
                y: yPos, 
                size: 8, 
                font: regularFont 
              });
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
    }
    
    // Helper function to draw signature with date/time and comments
    const drawSignatureWithMetadata = async (
      signature: string | null,
      name: string | null | undefined,
      timestamp: string | null | undefined,
      comments: string | null | undefined,
      sigX: number,
      sigY: number,
      sigW: number,
      sigH: number,
      nameX: number,
      nameY: number,
      nameW: number
    ) => {
      if (!signature && !name) return;
      
      // Draw signature
      if (signature) {
        await drawSignature(signature, sigX, sigY, sigW, sigH);
      }
      
      // Draw name
      if (name) {
        drawInRect(name, nameX, nameY, nameW, 14, 10);
      }
      
      // Draw date/time next to signature (right side)
      if (timestamp) {
        const dateTimeText = fmtDateTime(timestamp);
        const dateTimeX = sigX + sigW + 5; // 5px spacing from signature
        const dateTimeY = sigY + (sigH / 2) - 7; // Center vertically with signature
        drawInRect(dateTimeText, dateTimeX, dateTimeY, 120, 12, 8);
      }
      
      // Draw comments below signature if available
      if (comments && comments.trim()) {
        const commentsY = sigY - sigH - 5; // 5px below signature box
        // Wrap comments if too long
        const maxWidth = sigW + 120; // Signature width + date/time width
        const commentsLines = comments.split('\n').slice(0, 3); // Max 3 lines
        commentsLines.forEach((line, idx) => {
          if (line.trim()) {
            drawInRect(line.trim(), sigX, commentsY - (idx * 10), maxWidth, 10, 8);
          }
        });
      }
    };

    // Head name and signature (LEFT) - Department Head endorsement
    const headTimestamp = request.head_approved_at || headEndorsements[0]?.confirmed_at || null;
    const headComments = request.head_comments || headEndorsements[0]?.comments || null;
    await drawSignatureWithMetadata(
      request.head_signature || headEndorsements[0]?.signature || null,
      headApproverName,
      headTimestamp,
      headComments,
      85, 380, 180, 34, // Signature box
      125, 400, 260 // Name position
    );
    
    // Parent Head signature if exists (for parent department approval)
    if (parentHeadApproverName && request.parent_head_signature) {
      const parentHeadTimestamp = request.parent_head_approved_at || null;
      const parentHeadComments = request.parent_head_comments || null;
      await drawSignatureWithMetadata(
        request.parent_head_signature,
        parentHeadApproverName,
        parentHeadTimestamp,
        parentHeadComments,
        85, 340, 180, 34, // Signature box
        125, 360, 260 // Name position
      );
    }
    
    // Driver and vehicle
    if (assignedDriverName) {
      drawInRect(assignedDriverName, 110, 470, 210, 14, 10);
    }
    if (assignedVehicle) {
      drawInRect(`${assignedVehicle.model} (${assignedVehicle.plate_number})`, 110, 485, 210, 14, 10);
    }
    
    // Transportation Coordinator signature (RIGHT)
    // Position: "School Transportation Coordinator" or "Approved by" section
    const adminTimestamp = request.admin_approved_at || request.admin_processed_at || null;
    const adminComments = request.admin_notes || request.admin_comments || null;
    await drawSignatureWithMetadata(
      request.admin_signature || null,
      adminProcessorName,
      adminTimestamp,
      adminComments,
      340, 455, 200, 34, // Signature box
      430, 515, 260 // Name position
    );
    
    // President/COO signature (Approved by section)
    const presidentTimestamp = request.president_approved_at || null;
    const presidentComments = request.president_comments || null;
    await drawSignatureWithMetadata(
      request.president_signature || null,
      presidentApproverName,
      presidentTimestamp,
      presidentComments,
      85, 530, 180, 34, // Signature box
      125, 550, 260 // Name position
    );
    
    // Executive signature (fallback if president_signature not available)
    if (!request.president_signature && request.exec_signature) {
      const execTimestamp = request.exec_approved_at || null;
      const execComments = request.exec_comments || null;
      await drawSignatureWithMetadata(
        request.exec_signature,
        execApproverName,
        execTimestamp,
        execComments,
        85, 530, 180, 34, // Signature box
        125, 550, 260 // Name position
      );
    }
    
    // Comptroller signature and name (For Travel Cost - Recommending Approval)
    // Position: Right side, "Recommending Approval" section
    const comptrollerTimestamp = request.comptroller_approved_at || null;
    const comptrollerComments = request.comptroller_comments || null;
    await drawSignatureWithMetadata(
      request.comptroller_signature || null,
      comptrollerApproverName,
      comptrollerTimestamp,
      comptrollerComments,
      480, 570, 150, 30, // Signature box
      480, 600, 200 // Name position
    );
    
    // Comptroller recommended amount if exists
    if (request.comptroller_edited_budget) {
      const recAmount = `Rec Amt: ${request.comptroller_edited_budget.toLocaleString()} subject to liquidation`;
      const recAmountY = isSeminar ? 620 : 620;
      drawInRect(recAmount, 480, recAmountY, 200, 14, 9);
    }
    
    // VP signatures (Recommending Approval section)
    // First VP - Position: Left side, "Recommending Approval" section
    const vpTimestamp = request.vp_approved_at || null;
    const vpComments = request.vp_comments || null;
    await drawSignatureWithMetadata(
      request.vp_signature || null,
      vpApproverName,
      vpTimestamp,
      vpComments,
      85, 730, 180, 34, // Signature box
      125, 750, 260 // Name position
    );
    
    // Second VP (if both VPs approved - for multi-department requests)
    if (request.both_vps_approved && vp2ApproverName) {
      const vp2Timestamp = request.vp2_approved_at || null;
      const vp2Comments = request.vp2_comments || null;
      await drawSignatureWithMetadata(
        request.vp2_signature || null,
        vp2ApproverName,
        vp2Timestamp,
        vp2Comments,
        85, 680, 180, 34, // Signature box
        125, 700, 260 // Name position
      );
    }
    
    // HR Director signature (Noted by section)
    // Position: Left side, "Noted by" section
    const hrTimestamp = request.hr_approved_at || null;
    const hrComments = request.hr_comments || null;
    await drawSignatureWithMetadata(
      request.hr_signature || null,
      hrApproverName,
      hrTimestamp,
      hrComments,
      85, 630, 180, 34, // Signature box
      125, 650, 260 // Name position
    );
    

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Convert to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Format PDF filename: TO-2025-{number}-{initials}.pdf
    const filename = formatPDFFilename(
      request.request_number || request.file_code,
      requesterName,
      request.request_type
    );

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]/pdf] Error:", err);
    console.error("[GET /api/requests/[id]/pdf] Error stack:", err?.stack);
    console.error("[GET /api/requests/[id]/pdf] Error name:", err?.name);
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `${err?.message || "Failed to generate PDF"}\nStack: ${err?.stack || 'No stack trace'}`
      : err?.message || "Failed to generate PDF";
    
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
