// src/app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile - try with department join first
    let profile: any = null;
    let profileError: any = null;

    // Try to fetch with department join
    const profileResult = await supabase
      .from("users")
      .select(`
        id, 
        email,
        name,
        department_id, 
        is_head, 
        is_hr, 
        is_exec,
        department:departments(id, code, name, parent_department_id)
      `)
      .eq("auth_user_id", user.id)
      .single();

    profile = profileResult.data;
    profileError = profileResult.error;

    // If join failed, try without join (fallback)
    if (profileError || !profile) {
      console.warn("[/api/requests/submit] Department join failed, trying without join");
      const simpleResult = await supabase
        .from("users")
        .select("id, email, name, department_id, is_head, is_hr, is_exec")
        .eq("auth_user_id", user.id)
        .single();
      
      profile = simpleResult.data;
      profileError = simpleResult.error;
      
      // If we got profile without join, manually fetch department
      if (profile && profile.department_id) {
        const { data: dept } = await supabase
          .from("departments")
          .select("id, code, name, parent_department_id")
          .eq("id", profile.department_id)
          .single();
        
        if (dept) {
          profile.department = dept;
        }
      }
    }

    if (profileError) {
      console.error("[/api/requests/submit] Profile fetch error:", profileError);
      return NextResponse.json({ 
        ok: false, 
        error: "Profile not found: " + profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      console.error("[/api/requests/submit] No profile data returned for user:", user.id);
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Check if department has parent (for office hierarchy)
    const hasParentDepartment = !!(profile.department as any)?.parent_department_id;

    // Extract request data from body
    const travelOrder = body.travelOrder ?? body.payload?.travelOrder ?? {};
    const costs = travelOrder.costs ?? {};
    const vehicleMode = body.vehicleMode ?? "owned"; // "owned", "institutional", "rent"
    const reason = body.reason ?? "visit"; // "visit", "seminar", "official", etc.

    // Get the department ID from the selected department in the form
    let departmentId = profile.department_id;
    let selectedDepartment: any = profile.department;
    
    console.log(`[/api/requests/submit] Initial dept: ${(profile.department as any)?.name} (${departmentId})`);
    console.log(`[/api/requests/submit] Form selected dept: ${travelOrder.department}`);
    
    if (travelOrder.department && travelOrder.department !== (profile.department as any)?.name) {
      // User selected a different department - look it up
      // Try multiple search strategies to handle different name formats
      let deptData = null;
      
      // Strategy 1: Exact match
      const { data: exactMatch } = await supabase
        .from("departments")
        .select("id, code, name, parent_department_id")
        .eq("name", travelOrder.department)
        .maybeSingle();
      
      if (exactMatch) {
        deptData = exactMatch;
      } else {
        // Strategy 2: Extract code from format "Name (CODE)" and search by code
        const codeMatch = travelOrder.department.match(/\(([^)]+)\)$/);
        if (codeMatch) {
          const code = codeMatch[1];
          console.log(`[/api/requests/submit] Trying to find by code: ${code}`);
          const { data: codeSearch } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .eq("code", code)
            .maybeSingle();
          
          if (codeSearch) {
            deptData = codeSearch;
          }
        }
        
        // Strategy 3: Search by name using ILIKE (case-insensitive partial match)
        if (!deptData) {
          const searchName = travelOrder.department.replace(/\s*\([^)]*\)\s*$/, '').trim();
          console.log(`[/api/requests/submit] Trying ILIKE search: ${searchName}`);
          const { data: likeSearch } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .ilike("name", `%${searchName}%`)
            .maybeSingle();
          
          if (likeSearch) {
            deptData = likeSearch;
          }
        }
      }
      
      if (deptData) {
        departmentId = deptData.id;
        selectedDepartment = deptData;
        console.log(`[/api/requests/submit] ✅ Using selected department: ${deptData.name} (${deptData.code}) (${deptData.id})`);
      } else {
        console.warn(`[/api/requests/submit] ⚠️ Could not find department: ${travelOrder.department}`);
        // Fall back to requester's department
        console.warn(`[/api/requests/submit] 🔄 Falling back to requester's department`);
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ Using requester's own department`);
    }

    // Determine request type
    const requestType = reason === "seminar" ? "seminar" : "travel_order";
    
    // Calculate budget
    const hasBudget = costs && Object.keys(costs).length > 0;
    
    console.log("[/api/requests/submit] Costs data:", costs);
    console.log("[/api/requests/submit] Has budget:", hasBudget);
    const expenseBreakdown = hasBudget ? [
      { item: "Food", amount: parseFloat(costs.food || 0), description: "Meals" },
      { item: "Accommodation", amount: parseFloat(costs.accommodation || 0), description: "Lodging" },
      { item: "Transportation", amount: parseFloat(costs.rentVehicles || 0), description: "Vehicle rental" },
      { item: "Driver Allowance", amount: parseFloat(costs.driversAllowance || 0), description: "Driver costs" },
      { item: "Other", amount: parseFloat(costs.otherAmount || 0), description: costs.otherLabel || "Miscellaneous" },
    ].filter(item => item.amount > 0) : [];
    
    const totalBudget = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // Determine if vehicle needed
    const needsVehicle = vehicleMode === "institutional" || vehicleMode === "rent";
    
    // Get preferred driver/vehicle suggestions from schoolService
    console.log("[/api/requests/submit] Full body:", JSON.stringify(body, null, 2));
    const schoolService = body.schoolService || {};
    console.log("[/api/requests/submit] School Service data:", schoolService);
    const preferredDriverId = schoolService.preferredDriver || null;
    const preferredVehicleId = schoolService.preferredVehicle || null;
    console.log("[/api/requests/submit] Preferred driver ID:", preferredDriverId);
    console.log("[/api/requests/submit] Preferred vehicle ID:", preferredVehicleId);

    // Check if requester is a head
    const requesterIsHead = profile.is_head === true;

    // Determine initial status using workflow engine
    const initialStatus = WorkflowEngine.getInitialStatus(requesterIsHead);

    // Parse travel dates
    const travelStartDate = travelOrder.date || travelOrder.dateFrom || new Date().toISOString();
    const travelEndDate = travelOrder.dateTo || travelOrder.date || travelStartDate;

    // Prepare participants (simplified for now)
    const participants = travelOrder.participants || [];
    
    // Determine if this is a representative submission
    const requestingPersonName = travelOrder.requestingPerson || profile.name || profile.email || "Unknown";
    const submitterName = profile.name || profile.email || "Unknown";
    const isRepresentative = requestingPersonName.trim().toLowerCase() !== submitterName.trim().toLowerCase();

    // Build request object
    const requestData = {
      request_type: requestType,
      title: travelOrder.purposeOfTravel || travelOrder.purpose || "Travel Request",
      purpose: travelOrder.purposeOfTravel || travelOrder.purpose || "",
      destination: travelOrder.destination || "",
      
      travel_start_date: travelOrder.departureDate || travelOrder.date || new Date().toISOString(),
      travel_end_date: travelOrder.returnDate || travelOrder.dateTo || travelOrder.date || new Date().toISOString(),
      
      // Requester = person who needs the travel (from form)
      requester_id: profile.id,
      requester_name: requestingPersonName,
      requester_signature: travelOrder.requesterSignature || null,
      requester_is_head: requesterIsHead,
      department_id: departmentId,
      
      // Submitter = account that clicked submit (logged in user)
      submitted_by_user_id: profile.id,
      submitted_by_name: submitterName,
      is_representative: isRepresentative,
      // Only include parent_department_id if the column exists (optional for now)
      ...((selectedDepartment as any)?.parent_department_id ? { 
        parent_department_id: (selectedDepartment as any).parent_department_id 
      } : {}),
      
      participants: participants,
      head_included: participants.some((p: any) => p.is_head) || requesterIsHead,
      
      has_budget: hasBudget,
      total_budget: totalBudget,
      expense_breakdown: expenseBreakdown,
      
      needs_vehicle: needsVehicle,
      vehicle_type: vehicleMode === "rent" ? "Rental" : vehicleMode === "institutional" ? "University Vehicle" : null,
      needs_rental: vehicleMode === "rent",
      
      // Preferred suggestions (faculty can suggest, admin decides)
      preferred_driver_id: preferredDriverId,
      preferred_vehicle_id: preferredVehicleId,
      
      status: initialStatus,
      current_approver_role: WorkflowEngine.getApproverRole(initialStatus),
    };

    // Insert request with retry logic for duplicate key errors
    let data: any = null;
    let error: any = null;
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from("requests")
        .insert(requestData)
        .select("*")
        .single();
      
      data = result.data;
      error = result.error;
      
      // If success, break out
      if (!error) {
        console.log(`[/api/requests/submit] Success on attempt ${attempt}`);
        break;
      }
      
      // If duplicate key error (race condition), retry
      if (error.code === '23505' && error.message?.includes('request_number')) {
        console.log(`[/api/requests/submit] Duplicate request_number on attempt ${attempt}, retrying...`);
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
        continue;
      }
      
      // For other errors, don't retry
      console.error("[/api/requests/submit] Insert error:", error);
      break;
    }

    if (error) {
      console.error("[/api/requests/submit] Insert failed after retries:", error);
      
      // Convert database errors to user-friendly messages
      let userFriendlyError = "Failed to submit request. Please try again.";
      
      if (error.code === '23505') {
        userFriendlyError = "Failed to generate unique request number. Please try again.";
      } else if (error.message?.includes('valid_dates')) {
        userFriendlyError = "Invalid dates: Return date must be on or after departure date. Please check your travel dates.";
      } else if (error.message?.includes('check constraint')) {
        // Generic constraint violation
        if (error.message.includes('budget')) {
          userFriendlyError = "Invalid budget amount. Please check your expense breakdown.";
        } else if (error.message.includes('date')) {
          userFriendlyError = "Invalid dates. Please ensure departure and return dates are valid and in the future.";
        } else {
          userFriendlyError = "Invalid data provided. Please check all required fields.";
        }
      } else if (error.code === '23503') {
        // Foreign key violation
        userFriendlyError = "Invalid department or user information. Please refresh the page and try again.";
      } else if (error.message?.includes('not null')) {
        // NOT NULL constraint
        userFriendlyError = "Missing required information. Please fill in all required fields.";
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: userFriendlyError
      }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Failed to create request" }, { status: 500 });
    }

    // Log creation in history
    await supabase.from("request_history").insert({
      request_id: data.id,
      action: "created",
      actor_id: profile.id,
      actor_role: requesterIsHead ? "head" : "faculty",
      previous_status: "draft",
      new_status: initialStatus,
      comments: "Request created and submitted",
    });

    console.log("[/api/requests/submit] Request created:", data.id, "Status:", initialStatus);

    return NextResponse.json({ ok: true, data });

  } catch (error: any) {
    console.error("[/api/requests/submit] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
