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
import { PDF_COORDINATES } from "@/lib/utils/pdf-coordinates-helper";

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

    // Get full request details - use tracking API for consistency with submissions view
    // First, fetch the request directly for PDF generation
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
    
    // Also fetch tracking data to ensure timestamp consistency with submissions view
    // This ensures we use the same data source as the UI
    let trackingData: any = null;
    try {
      // Fetch tracking data using the same logic as tracking API
      // We'll use this for timestamps to ensure consistency
      const { data: trackingResponse } = await supabase
        .from("requests")
        .select(`
          head_approved_at,
          parent_head_approved_at,
          admin_processed_at,
          comptroller_approved_at,
          hr_approved_at,
          vp_approved_at,
          vp2_approved_at,
          president_approved_at,
          exec_approved_at
        `)
        .eq("id", requestId)
        .single();
      
      if (trackingResponse) {
        trackingData = trackingResponse;
      }
    } catch (err) {
      console.warn("[PDF] Error fetching tracking data, using request data directly:", err);
      // Fallback to using request data directly if tracking fetch fails
      trackingData = null;
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
        .select("plate_number, vehicle_name, model, type")
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
    let requesterInvitations: any[] = [];
    try {
      const { data: requesterInvitationsData } = await supabase
        .from("requester_invitations")
        .select(`
          *,
          user:users!user_id(id, name, email),
          department:departments!department_id(id, name, code)
        `)
        .eq("request_id", requestId)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: true });
      
      if (requesterInvitationsData) {
        requesterInvitations = requesterInvitationsData;
        multiDeptRequesters = requesterInvitationsData.map((inv: any) => ({
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
    
    // Helper to embed signature image - improved for better visibility
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
        // Use 90% of available space for better fit, but maintain aspect ratio
        const scale = Math.min((w * 0.9) / iw, (h * 0.9) / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        // Center the signature in the box
        const dx = x + (w - dw) / 2;
        const dy = y + (h - dh) / 2;
        
        page.drawImage(img, {
          x: dx,
          y: dy,
          width: dw,
          height: dh,
          opacity: 1.0, // Full opacity for better visibility
        });
      } catch (err) {
        console.error('Error embedding signature:', err);
      }
    };
    
    // Format date - matching reference format: "November 25, 2025"
    const fmtLongDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(date);
      } catch (err) {
        console.error("[PDF] Error formatting date:", err);
        return "";
      }
    };

    // Format date and time (Philippines timezone)
    // Format: "Nov 24, 2025, 3:12 PM" (matching reference)
    // IMPORTANT: Handle timestamps without timezone info (treat as UTC)
    // Some columns like vp_approved_at, president_approved_at may be stored as TIMESTAMP without timezone
    const fmtDateTime = (dateStr: string | null | undefined) => {
      if (!dateStr) return "";
      try {
        let adjustedDateStr = dateStr;
        
        // Check if timestamp has timezone info at the END of the string
        // Look for 'Z', '+HH:MM', or '-HH:MM' at the end (timezone offset)
        const hasTimezone = dateStr.endsWith('Z') || 
                            /[+-]\d{2}:?\d{2}$/.test(dateStr) ||
                            /[+-]\d{4}$/.test(dateStr);
        
        // If no timezone info and it looks like a timestamp (has time component with colons), treat as UTC
        if (!hasTimezone && dateStr.includes(':') && dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
          // PostgreSQL TIMESTAMP without timezone stores values as UTC
          // Convert space-separated format to ISO format and add 'Z' for UTC
          // "2025-11-24 10:56:24.62" -> "2025-11-24T10:56:24.62Z"
          adjustedDateStr = dateStr.replace(' ', 'T') + 'Z';
        }
        
        const date = new Date(adjustedDateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('[PDF fmtDateTime] Invalid date string:', dateStr, 'adjusted:', adjustedDateStr);
          return "";
        }
        
        return new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
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
    // Handles both old format (category/label) and new format (item/description)
    const getExpenseLabel = (
      category: string | null | undefined, 
      label: string | null | undefined,
      item: string | null | undefined,
      description: string | null | undefined
    ): string => {
      // Priority 1: Custom label/description (most specific)
      if (label && label.trim() && label.trim() !== "Other") return label.trim();
      if (description && description.trim() && description.trim() !== "Miscellaneous") return description.trim();
      
      // Priority 2: Item field (new format)
      if (item && item.trim() && item.trim() !== "Other") {
        const itemLower = item.toLowerCase();
        // Check if it matches a known category
        if (COST_LABELS[itemLower]) return COST_LABELS[itemLower];
        // Check case-insensitive match
        for (const [key, value] of Object.entries(COST_LABELS)) {
          if (key.toLowerCase() === itemLower || value.toLowerCase() === itemLower) {
            return value;
          }
        }
        // If item is a valid name, use it
        if (/[a-zA-Z]/.test(item)) return item;
      }
      
      // Priority 3: Category field (old format)
      if (category && category.trim() && category.trim() !== "Other") {
        const catLower = category.toLowerCase();
        if (COST_LABELS[catLower]) return COST_LABELS[catLower];
        for (const [key, value] of Object.entries(COST_LABELS)) {
          if (key.toLowerCase() === catLower || value.toLowerCase() === catLower) {
            return value;
          }
        }
        if (/[a-zA-Z]/.test(category)) return category;
      }
      
      // Fallback: Use description even if it's "Miscellaneous" or "Other"
      if (description && description.trim()) return description.trim();
      if (label && label.trim()) return label.trim();
      
      // Last resort: "Other"
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
          const displayLabel = getExpenseLabel(item.category, item.label, item.item, item.description);
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
      // Find main requester's confirmed_at from requester_invitations (matching submissions view logic)
      const mainRequesterInvitation = requesterInvitations?.find(
        (inv: any) => inv.user_id === request.requester_id
      );
      const mainRequesterConfirmedAt = mainRequesterInvitation?.confirmed_at || 
                                       request.requester_signed_at || 
                                       request.created_at;
      
      const allRequesters: Array<{ name: string; signature?: string | null; confirmed_at?: string | null }> = [
        { 
          name: reqName, 
          signature: request.requester_signature || null, 
          confirmed_at: mainRequesterConfirmedAt
        },
        ...multiDeptRequesters.map((r: any) => ({
          name: r.name,
          signature: r.signature || null,
          confirmed_at: r.confirmed_at || null,
        }))
      ];
      
      // If head approver is also a requester, ensure their head signature is used
      // This handles cases where someone is both requester and department head (e.g., Belson)
      if (headApproverName) {
        const headNameNormalized = headApproverName.trim().toUpperCase();
        const headSignature = request.head_signature || headEndorsements[0]?.signature || null;
        
        // Check if head is already in requesters list
        const headRequesterIndex = allRequesters.findIndex(r => 
          r.name.trim().toUpperCase() === headNameNormalized
        );
        
        if (headRequesterIndex >= 0) {
          // Head is already a requester - use head signature if requester doesn't have one
          if (!allRequesters[headRequesterIndex].signature && headSignature) {
            allRequesters[headRequesterIndex].signature = headSignature;
          }
        } else {
          // Head is not in requesters list - add them with head signature
          allRequesters.push({
            name: headApproverName,
            signature: headSignature,
            confirmed_at: request.head_signed_at || request.head_approved_at || headEndorsements[0]?.confirmed_at || null,
          });
        }
      }
      
      const uniqueRequesters = removeDuplicateNames(allRequesters);
      
      // Limit to 6 requesters per page for main page
      const MAX_REQUESTERS_PER_PAGE = 6;
      const mainPageRequesters = uniqueRequesters.slice(0, MAX_REQUESTERS_PER_PAGE);
      const extraRequesters = uniqueRequesters.slice(MAX_REQUESTERS_PER_PAGE);
      
      // Draw requesting persons in 2-column layout (up to 6 per page)
      // Layout: 2 columns, 3 rows max
      // Format: "NAME" with signature below and date/time next to name (matching reference)
      // Use coordinates from PDF_COORDINATES helper
      const reqCoords = PDF_COORDINATES.REQUESTING_PERSON;
      const requesterStartX = reqCoords.startX;
      const requesterStartY = reqCoords.startY;
      const requesterColSpacing = reqCoords.colSpacing;
      const requesterRowSpacing = reqCoords.rowSpacing;
      
      // Draw requesters vertically - signature BESIDE name (not below), NO date/time
      // Layout: Vertical list, signature to the right of each name
      // Can fit up to 6 requesters (15 points spacing each = 90 points total)
      for (let idx = 0; idx < mainPageRequesters.length; idx++) {
        const req = mainPageRequesters[idx];
        const baseX = requesterStartX;
        const baseY = requesterStartY - (idx * reqCoords.rowSpacing); // Vertical spacing
        
        // Draw name
        const nameX = baseX + reqCoords.name.offsetX;
        const nameY = baseY + reqCoords.name.offsetY;
        drawInRect(req.name, nameX, nameY, reqCoords.name.w, reqCoords.name.h, 9);
        
        // Draw signature BESIDE name (to the right)
        // Use individual requester signature position if available, otherwise use default
        if (req.signature) {
          const requesterSigPos = reqCoords.requesterSignatures?.[idx];
          const sigOffsetX = requesterSigPos?.offsetX ?? reqCoords.signature.offsetX;
          const sigOffsetY = requesterSigPos?.offsetY ?? reqCoords.signature.offsetY;
          const sigWidth = requesterSigPos?.w ?? reqCoords.sigWidth;
          const sigHeight = requesterSigPos?.h ?? reqCoords.sigHeight;
          
          const sigX = baseX + sigOffsetX;
          const sigY = baseY + sigOffsetY;
          await drawSignature(req.signature, sigX, sigY, sigWidth, sigHeight);
        }
        
        // NO date/time - removed as requested
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
      // Format: "Item name - Php amount" (matching reference image)
      // Use coordinates from PDF_COORDINATES helper
      if (request.expense_breakdown && Array.isArray(request.expense_breakdown)) {
        let costY = PDF_COORDINATES.COST_START_Y;
        const maxItems = PDF_COORDINATES.COST_MAX_ITEMS; // Use max items from helper
        const validItems = request.expense_breakdown
          .filter((item: any) => (item.amount || 0) > 0)
          .slice(0, maxItems);
        
        validItems.forEach((item: any) => {
          // Handle both old format (category/label) and new format (item/description)
          const displayLabel = getExpenseLabel(
            item.category, 
            item.label, 
            item.item, 
            item.description
          );
          const amount = item.amount || 0;
          // Format: "Item name - Php amount" (matching reference)
          const costText = `${displayLabel} - Php ${amount.toLocaleString()}`;
          drawInRect(costText, 150, costY, 446, 10, 9);
          costY += PDF_COORDINATES.COST_ITEM_SPACING; // Use spacing from helper
        });
        
        // Total if available - format: "Total: Php amount" (bold)
        // Show original/edited format if budget was changed
        if (request.total_budget) {
          let totalText = `Total: Php ${request.total_budget.toLocaleString()}`;
          
          // Check if budget was edited (by comptroller or president)
          const editedBudget = request.comptroller_edited_budget || request.president_edited_budget;
          if (editedBudget && editedBudget !== request.total_budget) {
            // Show original / edited format
            totalText = `Total: Php ${request.total_budget.toLocaleString()} / Php ${editedBudget.toLocaleString()}`;
          }
          
          drawInRect(totalText, 150, costY + 4, 446, 12, 10, true);
        }
      } else {
        // Fallback: Try to build expense breakdown from individual cost fields if expense_breakdown is not available
        const costs: any = {};
        if (request.food) costs.food = request.food;
        if (request.drivers_allowance) costs.driversAllowance = request.drivers_allowance;
        if (request.rent_vehicles) costs.rentVehicles = request.rent_vehicles;
        if (request.hired_drivers) costs.hiredDrivers = request.hired_drivers;
        if (request.accommodation) costs.accommodation = request.accommodation;
        
        let costY = PDF_COORDINATES.COST_START_Y; // Use coordinates from helper
        const costItems = [
          { category: 'food', amount: costs.food },
          { category: 'driversAllowance', amount: costs.driversAllowance },
          { category: 'rentVehicles', amount: costs.rentVehicles },
          { category: 'hiredDrivers', amount: costs.hiredDrivers },
          { category: 'accommodation', amount: costs.accommodation },
        ].filter(item => item.amount && item.amount > 0);
        
        costItems.forEach((item) => {
          const displayLabel = getExpenseLabel(item.category, null, null, null);
          // Format: "Item name - Php amount" (matching reference)
          const costText = `${displayLabel} - Php ${item.amount.toLocaleString()}`;
          drawInRect(costText, 150, costY, 446, 10, 9);
          costY += PDF_COORDINATES.COST_ITEM_SPACING; // Use spacing from helper
        });
        
        // Total if available - format: "Total: Php amount" (bold)
        // Show original/edited format if budget was changed
        if (request.total_budget) {
          let totalText = `Total: Php ${request.total_budget.toLocaleString()}`;
          
          // Check if budget was edited (by comptroller or president)
          const editedBudget = request.comptroller_edited_budget || request.president_edited_budget;
          if (editedBudget && editedBudget !== request.total_budget) {
            // Show original / edited format
            totalText = `Total: Php ${request.total_budget.toLocaleString()} / Php ${editedBudget.toLocaleString()}`;
          }
          
          drawInRect(totalText, 150, costY + 4, 446, 12, 10, true);
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
    
    // Helper function to draw signature with name, date/time, and comments
    // Format matches reference: Signature box with name below and date/time next to name
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
      nameW: number,
      commentsX?: number,
      commentsY?: number,
      commentsW?: number,
      commentsH?: number
    ) => {
      // Always draw name if provided, even without signature
      // Draw signature in the box (use full box size for better visibility)
      if (signature) {
        await drawSignature(signature, sigX, sigY, sigW, sigH);
      }
      
      // Draw name using the provided nameX coordinate (don't center, use exact position)
      if (name) {
        // Use the provided nameX coordinate directly (not centered)
        drawInRect(name, nameX, nameY, nameW, 12, 9);
      }
      
      // NOTE: Dates are now drawn separately on the right side using PDF_COORDINATES
      // This function only draws signature and name
      
      // Draw comments below name if available (using provided coordinates or default)
      if (comments && comments.trim()) {
        const commentsXPos = commentsX ?? sigX;
        const commentsYPos = commentsY ?? (nameY - 15);
        const commentsWidth = commentsW ?? sigW;
        const commentsHeight = commentsH ?? 20;
        
        // Split comments into sentences and lines
        // First, split by newlines
        const newlineSplit = comments.split('\n').filter(p => p.trim());
        let commentsLines: string[] = [];
        
        // For each newline-separated part, split by sentences
        newlineSplit.forEach(part => {
          const trimmed = part.trim();
          if (!trimmed) return;
          
          // Split by period followed by space (". ")
          // This will split "Sentence 1. Sentence 2." into ["Sentence 1.", "Sentence 2."]
          const sentences = trimmed.split(/\.\s+/).filter(s => s.trim());
          
          if (sentences.length > 1) {
            // Multiple sentences found - add period back to each except the last
            sentences.forEach((sentence, idx) => {
              const cleaned = sentence.trim();
              if (cleaned) {
                // Add period back (except for last sentence if original didn't end with period)
                const withPeriod = idx < sentences.length - 1 || trimmed.endsWith('.') 
                  ? (cleaned.endsWith('.') ? cleaned : cleaned + '.')
                  : cleaned;
                commentsLines.push(withPeriod);
              }
            });
          } else if (sentences.length === 1) {
            // Single sentence or no period found - add as is
            commentsLines.push(trimmed);
          }
        });
        
        // Limit to 2 lines max
        const finalLines = commentsLines.slice(0, 2);
        finalLines.forEach((line, idx) => {
          if (line.trim()) {
            drawInRect(line.trim(), commentsXPos, commentsYPos - (idx * 10), commentsWidth, 10, 7);
          }
        });
      }
    };

    // Head name and signature (LEFT) - Department Head endorsement
    // Position: "Indorsed by" section
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const headTimestamp = trackingData?.head_approved_at || request.head_approved_at || headEndorsements[0]?.confirmed_at || null;
    const headComments = request.head_comments || headEndorsements[0]?.comments || null;
    await drawSignatureWithMetadata(
      request.head_signature || headEndorsements[0]?.signature || null,
      headApproverName,
      null, // Don't draw date here, draw separately
      headComments,
      PDF_COORDINATES.APPROVALS.HEAD.sig.x,
      PDF_COORDINATES.APPROVALS.HEAD.sig.top,
      PDF_COORDINATES.APPROVALS.HEAD.sig.w,
      PDF_COORDINATES.APPROVALS.HEAD.sig.h,
      PDF_COORDINATES.APPROVALS.HEAD.name.x,
      PDF_COORDINATES.APPROVALS.HEAD.name.top,
      PDF_COORDINATES.APPROVALS.HEAD.name.w,
      PDF_COORDINATES.APPROVALS.HEAD.comments.x,
      PDF_COORDINATES.APPROVALS.HEAD.comments.top,
      PDF_COORDINATES.APPROVALS.HEAD.comments.w,
      PDF_COORDINATES.APPROVALS.HEAD.comments.h
    );
    // Draw Head date on the right side
    if (headTimestamp) {
      const dateText = fmtDateTime(headTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.HEAD.date.x, PDF_COORDINATES.APPROVALS.HEAD.date.top, PDF_COORDINATES.APPROVALS.HEAD.date.w, PDF_COORDINATES.APPROVALS.HEAD.date.h, 9);
    }
    
    // Parent Head signature if exists (for parent department approval)
    if (parentHeadApproverName && request.parent_head_signature) {
      // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
      const parentHeadTimestamp = trackingData?.parent_head_approved_at || request.parent_head_approved_at || null;
      const parentHeadComments = request.parent_head_comments || null;
      await drawSignatureWithMetadata(
        request.parent_head_signature,
        parentHeadApproverName,
        null, // Don't draw date here, draw separately
        parentHeadComments,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.sig.x,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.sig.top,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.sig.w,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.sig.h,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.name.x,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.name.top,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.name.w,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.comments.x,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.comments.top,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.comments.w,
        PDF_COORDINATES.APPROVALS.PARENT_HEAD.comments.h
      );
      // Draw Parent Head date on the right side
      if (parentHeadTimestamp) {
        const dateText = fmtDateTime(parentHeadTimestamp);
        drawInRect(dateText, PDF_COORDINATES.APPROVALS.PARENT_HEAD.date.x, PDF_COORDINATES.APPROVALS.PARENT_HEAD.date.top, PDF_COORDINATES.APPROVALS.PARENT_HEAD.date.w, PDF_COORDINATES.APPROVALS.PARENT_HEAD.date.h, 9);
      }
    }
    
    // Driver and vehicle - using coordinates from helper
    if (assignedDriverName) {
      drawInRect(assignedDriverName, PDF_COORDINATES.DRIVER.x, PDF_COORDINATES.DRIVER.top, PDF_COORDINATES.DRIVER.w, PDF_COORDINATES.DRIVER.h, 10);
    }
    if (assignedVehicle) {
      // Use vehicle_name as primary, fallback to model if vehicle_name is not available
      const vehicleDisplayName = assignedVehicle.vehicle_name || assignedVehicle.model || 'Vehicle';
      drawInRect(`${vehicleDisplayName} (${assignedVehicle.plate_number})`, PDF_COORDINATES.VEHICLE.x, PDF_COORDINATES.VEHICLE.top, PDF_COORDINATES.VEHICLE.w, PDF_COORDINATES.VEHICLE.h, 10);
    }
    
    // Transportation Coordinator signature (RIGHT)
    // Position: "School Transportation Coordinator" section
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const adminTimestamp = trackingData?.admin_processed_at || request.admin_processed_at || request.admin_approved_at || null;
    const adminComments = request.admin_notes || request.admin_comments || null;
    await drawSignatureWithMetadata(
      request.admin_signature || null,
      adminProcessorName || "TRIZZIA MAREE Z. CASIÑO",
      null, // Don't draw date here, draw separately
      adminComments,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.sig.x,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.sig.top,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.sig.w,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.sig.h,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.name.x,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.name.top,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.name.w,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.comments.x,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.comments.top,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.comments.w,
      PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.comments.h
    );
    // Draw Transportation Coordinator date on the right side
    if (adminTimestamp) {
      const dateText = fmtDateTime(adminTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.date.x, PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.date.top, PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.date.w, PDF_COORDINATES.APPROVALS.TRANSPORT_COORD.date.h, 9);
    }
    
    // President/COO signature (Approved by section)
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const presidentTimestamp = trackingData?.president_approved_at || request.president_approved_at || null;
    const presidentComments = request.president_comments || null;
    await drawSignatureWithMetadata(
      request.president_signature || null,
      presidentApproverName || "NAILA E. LEVERIZA",
      null, // Don't draw date here, draw separately
      presidentComments,
      PDF_COORDINATES.APPROVALS.PRESIDENT.sig.x,
      PDF_COORDINATES.APPROVALS.PRESIDENT.sig.top,
      PDF_COORDINATES.APPROVALS.PRESIDENT.sig.w,
      PDF_COORDINATES.APPROVALS.PRESIDENT.sig.h,
      PDF_COORDINATES.APPROVALS.PRESIDENT.name.x,
      PDF_COORDINATES.APPROVALS.PRESIDENT.name.top,
      PDF_COORDINATES.APPROVALS.PRESIDENT.name.w,
      PDF_COORDINATES.APPROVALS.PRESIDENT.comments.x,
      PDF_COORDINATES.APPROVALS.PRESIDENT.comments.top,
      PDF_COORDINATES.APPROVALS.PRESIDENT.comments.w,
      PDF_COORDINATES.APPROVALS.PRESIDENT.comments.h
    );
    // Draw President date on the right side
    if (presidentTimestamp) {
      const dateText = fmtDateTime(presidentTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.PRESIDENT.date.x, PDF_COORDINATES.APPROVALS.PRESIDENT.date.top, PDF_COORDINATES.APPROVALS.PRESIDENT.date.w, PDF_COORDINATES.APPROVALS.PRESIDENT.date.h, 9);
    }
    
    // Executive signature (fallback if president_signature not available)
    if (!request.president_signature && request.exec_signature) {
      // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
      const execTimestamp = trackingData?.exec_approved_at || request.exec_approved_at || null;
      const execComments = request.exec_comments || null;
      await drawSignatureWithMetadata(
        request.exec_signature,
        execApproverName,
        null, // Don't draw date here, draw separately
        execComments,
        PDF_COORDINATES.APPROVALS.PRESIDENT.sig.x,
        PDF_COORDINATES.APPROVALS.PRESIDENT.sig.top,
        PDF_COORDINATES.APPROVALS.PRESIDENT.sig.w,
        PDF_COORDINATES.APPROVALS.PRESIDENT.sig.h,
        PDF_COORDINATES.APPROVALS.PRESIDENT.name.x,
        PDF_COORDINATES.APPROVALS.PRESIDENT.name.top,
        PDF_COORDINATES.APPROVALS.PRESIDENT.name.w,
        PDF_COORDINATES.APPROVALS.PRESIDENT.comments.x,
        PDF_COORDINATES.APPROVALS.PRESIDENT.comments.top,
        PDF_COORDINATES.APPROVALS.PRESIDENT.comments.w,
        PDF_COORDINATES.APPROVALS.PRESIDENT.comments.h
      );
      // Draw Executive date on the right side (same as President)
      if (execTimestamp) {
        const dateText = fmtDateTime(execTimestamp);
        drawInRect(dateText, PDF_COORDINATES.APPROVALS.PRESIDENT.date.x, PDF_COORDINATES.APPROVALS.PRESIDENT.date.top, PDF_COORDINATES.APPROVALS.PRESIDENT.date.w, PDF_COORDINATES.APPROVALS.PRESIDENT.date.h, 9);
      }
    }
    
    // Comptroller signature and name (For Travel Cost - Recommending Approval)
    // Position: Right side, "Recommending Approval" section
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const comptrollerTimestamp = trackingData?.comptroller_approved_at || request.comptroller_approved_at || null;
    const comptrollerComments = request.comptroller_comments || null;
    const comptrollerName = comptrollerApproverName || "CARLOS JAYRON A. REMIENDO";
    const comptrollerSignature = request.comptroller_signature || null;
    
    // Debug logging for comptroller
    console.log("[PDF] Comptroller data:", {
      hasSignature: !!comptrollerSignature,
      name: comptrollerName,
      hasComments: !!comptrollerComments,
      comments: comptrollerComments,
      sigCoords: PDF_COORDINATES.APPROVALS.COMPTROLLER.sig,
      nameCoords: PDF_COORDINATES.APPROVALS.COMPTROLLER.name,
      commentsCoords: PDF_COORDINATES.APPROVALS.COMPTROLLER.comments,
    });
    
    await drawSignatureWithMetadata(
      comptrollerSignature,
      comptrollerName,
      null, // Don't draw date here, draw separately
      comptrollerComments,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.sig.x,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.sig.top,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.sig.w,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.sig.h,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.name.x,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.name.top,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.name.w,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.comments.x,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.comments.top,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.comments.w,
      PDF_COORDINATES.APPROVALS.COMPTROLLER.comments.h
    );
    // Draw Comptroller date on the right side
    if (comptrollerTimestamp) {
      const dateText = fmtDateTime(comptrollerTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.COMPTROLLER.date.x, PDF_COORDINATES.APPROVALS.COMPTROLLER.date.top, PDF_COORDINATES.APPROVALS.COMPTROLLER.date.w, PDF_COORDINATES.APPROVALS.COMPTROLLER.date.h, 9);
    }
    
    // Comptroller recommended amount if exists
    // Format: "Rec Amt: amount subject to liquidation" (matching reference)
    // Show original/edited format if budget was changed
    if (request.comptroller_edited_budget) {
      let recAmount = `Rec Amt: ${request.comptroller_edited_budget.toLocaleString()} subject to liquidation`;
      
      // If original budget exists and is different, show original / edited format
      if (request.total_budget && request.total_budget !== request.comptroller_edited_budget) {
        recAmount = `Rec Amt: ${request.total_budget.toLocaleString()} / ${request.comptroller_edited_budget.toLocaleString()} subject to liquidation`;
      }
      
      const recAmountY = isSeminar ? 620 : 620;
      drawInRect(recAmount, 480, recAmountY, 200, 12, 8);
      
      // Comptroller account if exists
      if (request.comptroller_account) {
        const accountText = `Account: ${request.comptroller_account}`;
        drawInRect(accountText, 480, recAmountY - 12, 200, 12, 8);
      }
    } else if (request.president_edited_budget && request.total_budget && request.total_budget !== request.president_edited_budget) {
      // If president edited budget but comptroller didn't, show it in the same location
      const recAmount = `Rec Amt: ${request.total_budget.toLocaleString()} / ${request.president_edited_budget.toLocaleString()} subject to liquidation`;
      const recAmountY = isSeminar ? 620 : 620;
      drawInRect(recAmount, 480, recAmountY, 200, 12, 8);
    }
    
    // VP signatures (Recommending Approval section)
    // First VP - Position: Left side, "Recommending Approval" section
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const vpTimestamp = trackingData?.vp_approved_at || request.vp_approved_at || null;
    const vpComments = request.vp_comments || null;
    await drawSignatureWithMetadata(
      request.vp_signature || null,
      vpApproverName,
      null, // Don't draw date here, draw separately
      vpComments,
      PDF_COORDINATES.APPROVALS.VP.sig.x,
      PDF_COORDINATES.APPROVALS.VP.sig.top,
      PDF_COORDINATES.APPROVALS.VP.sig.w,
      PDF_COORDINATES.APPROVALS.VP.sig.h,
      PDF_COORDINATES.APPROVALS.VP.name.x,
      PDF_COORDINATES.APPROVALS.VP.name.top,
      PDF_COORDINATES.APPROVALS.VP.name.w,
      PDF_COORDINATES.APPROVALS.VP.comments.x,
      PDF_COORDINATES.APPROVALS.VP.comments.top,
      PDF_COORDINATES.APPROVALS.VP.comments.w,
      PDF_COORDINATES.APPROVALS.VP.comments.h
    );
    // Draw VP date on the right side
    if (vpTimestamp) {
      const dateText = fmtDateTime(vpTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.VP.date.x, PDF_COORDINATES.APPROVALS.VP.date.top, PDF_COORDINATES.APPROVALS.VP.date.w, PDF_COORDINATES.APPROVALS.VP.date.h, 9);
    }
    
    // Second VP (if both VPs approved - for multi-department requests)
    if (request.both_vps_approved && vp2ApproverName) {
      // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
      const vp2Timestamp = trackingData?.vp2_approved_at || request.vp2_approved_at || null;
      const vp2Comments = request.vp2_comments || null;
      await drawSignatureWithMetadata(
        request.vp2_signature || null,
        vp2ApproverName,
        null, // Don't draw date here, draw separately
        vp2Comments,
        PDF_COORDINATES.APPROVALS.VP2.sig.x,
        PDF_COORDINATES.APPROVALS.VP2.sig.top,
        PDF_COORDINATES.APPROVALS.VP2.sig.w,
        PDF_COORDINATES.APPROVALS.VP2.sig.h,
        PDF_COORDINATES.APPROVALS.VP2.name.x,
        PDF_COORDINATES.APPROVALS.VP2.name.top,
        PDF_COORDINATES.APPROVALS.VP2.name.w,
        PDF_COORDINATES.APPROVALS.VP2.comments.x,
        PDF_COORDINATES.APPROVALS.VP2.comments.top,
        PDF_COORDINATES.APPROVALS.VP2.comments.w,
        PDF_COORDINATES.APPROVALS.VP2.comments.h
      );
      // Draw VP2 date on the right side
      if (vp2Timestamp) {
        const dateText = fmtDateTime(vp2Timestamp);
        drawInRect(dateText, PDF_COORDINATES.APPROVALS.VP2.date.x, PDF_COORDINATES.APPROVALS.VP2.date.top, PDF_COORDINATES.APPROVALS.VP2.date.w, PDF_COORDINATES.APPROVALS.VP2.date.h, 9);
      }
    }
    
    // HR Director signature (Noted by section)
    // Position: Left side, "Noted by" section
    // Use same timestamp as Approval Timeline (tracking API) - ensure consistency
    const hrTimestamp = trackingData?.hr_approved_at || request.hr_approved_at || null;
    const hrComments = request.hr_comments || null;
    await drawSignatureWithMetadata(
      request.hr_signature || null,
      hrApproverName || "DR. MARIA SYLVIA S. AVILA",
      null, // Don't draw date here, draw separately
      hrComments,
      PDF_COORDINATES.APPROVALS.HR.sig.x,
      PDF_COORDINATES.APPROVALS.HR.sig.top,
      PDF_COORDINATES.APPROVALS.HR.sig.w,
      PDF_COORDINATES.APPROVALS.HR.sig.h,
      PDF_COORDINATES.APPROVALS.HR.name.x,
      PDF_COORDINATES.APPROVALS.HR.name.top,
      PDF_COORDINATES.APPROVALS.HR.name.w,
      PDF_COORDINATES.APPROVALS.HR.comments.x,
      PDF_COORDINATES.APPROVALS.HR.comments.top,
      PDF_COORDINATES.APPROVALS.HR.comments.w,
      PDF_COORDINATES.APPROVALS.HR.comments.h
    );
    // Draw HR date on the right side
    if (hrTimestamp) {
      const dateText = fmtDateTime(hrTimestamp);
      drawInRect(dateText, PDF_COORDINATES.APPROVALS.HR.date.x, PDF_COORDINATES.APPROVALS.HR.date.top, PDF_COORDINATES.APPROVALS.HR.date.w, PDF_COORDINATES.APPROVALS.HR.date.h, 9);
    }
    

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
