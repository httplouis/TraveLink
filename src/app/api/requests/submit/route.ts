// src/app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { sendEmail, generateParticipantInvitationEmail } from "@/lib/email";
import crypto from "crypto";

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

    // Extract request data early to check if representative submission
    const travelOrder = body.travelOrder ?? body.payload?.travelOrder ?? {};
    const reason = body.reason ?? "visit";
    const isSeminar = reason === "seminar";
    
    // Quick check: might this be a representative submission?
    // For travel orders, check if requesting person is different from submitter
    const requestingPersonName = isSeminar
      ? (profile.name || profile.email || "Unknown")
      : (travelOrder.requestingPerson || profile.name || profile.email || "Unknown");
    const submitterName = profile.name || profile.email || "Unknown";
    const mightBeRepresentative = !isSeminar && 
      requestingPersonName.trim().toLowerCase() !== submitterName.trim().toLowerCase();

    // If might be representative, try to fetch requesting person's info
    let requestingPersonUser: any = null;
    if (mightBeRepresentative && travelOrder.requestingPerson) {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, is_head, role, department_id")
          .ilike("name", `%${travelOrder.requestingPerson}%`)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        
        if (userData) {
          requestingPersonUser = userData;
          console.log("[/api/requests/submit] ✅ Found requesting person:", userData.name, "Dept ID:", userData.department_id);
        }
      } catch (error) {
        console.warn("[/api/requests/submit] Could not fetch requesting person early:", error);
      }
    }

    // Validate department exists
    // For representative submissions: allow if requesting person has department OR form has department selected, even if submitter doesn't
    // For regular submissions: require submitter to have department
    if (!profile.department_id) {
      if (mightBeRepresentative && (requestingPersonUser?.department_id || travelOrder.department)) {
        // Representative submission: requesting person has department OR form has department selected, so allow it
        console.log("[/api/requests/submit] ℹ️ Submitter has no department, but representative submission detected:");
        console.log("  - Requesting person department_id:", requestingPersonUser?.department_id);
        console.log("  - Form selected department:", travelOrder.department);
        console.log("  - Allowing representative submission");
      } else {
        // Not representative OR requesting person also has no department - require submitter to have department
        console.error("[/api/requests/submit] User has no department assigned:", profile.email);
        return NextResponse.json({ 
          ok: false, 
          error: "Your account is not assigned to a department. Please contact your administrator to assign you to a department before submitting requests." 
        }, { status: 400 });
      }
    }

    // Check if department has parent (for office hierarchy)
    const hasParentDepartment = !!(profile.department as any)?.parent_department_id;

    // Extract request data from body (travelOrder and reason already extracted above)
    const costs = travelOrder.costs ?? {};
    const vehicleMode = body.vehicleMode ?? "owned"; // "owned", "institutional", "rent"

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
      { 
        item: "Food", 
        amount: parseFloat(costs.food || 0), 
        description: costs.foodDescription || "Meals" 
      },
      { 
        item: "Accommodation", 
        amount: parseFloat(costs.accommodation || 0), 
        description: costs.accommodationDescription || "Lodging" 
      },
      { 
        item: "Transportation", 
        amount: parseFloat(costs.rentVehicles || 0), 
        description: costs.rentVehiclesDescription || "Vehicle rental" 
      },
      { 
        item: "Driver Allowance", 
        amount: parseFloat(costs.driversAllowance || 0), 
        description: costs.driversAllowanceDescription || "Driver costs" 
      },
      { 
        item: "Hired Drivers", 
        amount: parseFloat(costs.hiredDrivers || 0), 
        description: costs.hiredDriversDescription || "Hired driver services" 
      },
      // Handle other expenses (from otherItems array)
      ...(Array.isArray(costs.otherItems) 
        ? costs.otherItems
            .filter((item: any) => item.amount && item.amount > 0)
            .map((item: any) => ({
              item: item.label || "Other",
              amount: parseFloat(item.amount || 0),
              description: item.description || item.label || "Miscellaneous"
            }))
        : costs.otherAmount && costs.otherAmount > 0
        ? [{
            item: "Other",
            amount: parseFloat(costs.otherAmount || 0),
            description: costs.otherLabel || "Miscellaneous"
          }]
        : []
      ),
    ].filter(item => item.amount > 0) : [];
    
    const totalBudget = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // Determine if vehicle needed
    const needsVehicle = vehicleMode === "institutional" || vehicleMode === "rent";
    
    // Get preferred driver/vehicle suggestions from schoolService
    console.log("[/api/requests/submit] ========== DRIVER/VEHICLE DEBUG ==========");
    console.log("[/api/requests/submit] Full body.schoolService:", JSON.stringify(body.schoolService, null, 2));
    const schoolService = body.schoolService || {};
    console.log("[/api/requests/submit] School Service keys:", Object.keys(schoolService));
    let preferredDriverId = schoolService.preferredDriver || null;
    let preferredVehicleId = schoolService.preferredVehicle || null;
    console.log("[/api/requests/submit] ✏️ Initial driver ID from client:", preferredDriverId);
    console.log("[/api/requests/submit] ✏️ Initial vehicle ID from client:", preferredVehicleId);
    console.log("[/api/requests/submit] ==========================================");

    // Validate driver exists if provided
    // Note: preferredDriverId is the USER ID (from /api/drivers response)
    if (preferredDriverId) {
      const { data: driverExists } = await supabase
        .from("drivers")
        .select("user_id")  // Only select user_id (drivers table has no "id" column!)
        .eq("user_id", preferredDriverId)
        .maybeSingle();
      
      if (!driverExists) {
        console.warn(`[/api/requests/submit] ⚠️ Driver with user_id ${preferredDriverId} not found in drivers table`);
        console.warn(`[/api/requests/submit] ⚠️ Setting preferred_driver_id to NULL to prevent FK error`);
        preferredDriverId = null;
      } else {
        console.log(`[/api/requests/submit] ✅ Driver with user_id ${preferredDriverId} validated successfully!`);
        console.log(`[/api/requests/submit] ✅ Will save preferred_driver_id = ${preferredDriverId}`);
        // Keep the user_id as preferred_driver_id (FK references users table)
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ No driver preference provided by client`);
    }

    // Validate vehicle exists if provided
    if (preferredVehicleId) {
      const { data: vehicleExists } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", preferredVehicleId)
        .maybeSingle();
      
      if (!vehicleExists) {
        console.warn(`[/api/requests/submit] ⚠️ Vehicle ID ${preferredVehicleId} not found in vehicles table`);
        console.warn(`[/api/requests/submit] ⚠️ Setting preferred_vehicle_id to NULL to prevent FK error`);
        preferredVehicleId = null;
      } else {
        console.log(`[/api/requests/submit] ✅ Vehicle ID ${preferredVehicleId} validated`);
        console.log(`[/api/requests/submit] ✅ Will save preferred_vehicle_id = ${preferredVehicleId}`);
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ No vehicle preference provided by client`);
    }

    // Note: isSeminar is already defined above (line 84) - do not redeclare
    
    // Check if requester (logged in user) is a head
    const requesterIsHead = profile.is_head === true;

    // Check if REQUESTING PERSON (from form) is a head
    // This is different from the submitter - the requesting person is who needs the travel
    // Note: requestingPersonUser may already be fetched in early check above
    let requestingPersonIsHead = false;
    if (!isSeminar && travelOrder.requestingPerson) {
      // If we already fetched requestingPersonUser in early check, use it
      if (requestingPersonUser) {
        requestingPersonIsHead = requestingPersonUser.is_head === true || requestingPersonUser.role === "head";
        console.log("[/api/requests/submit] ✅ Using previously fetched requesting person data");
      } else {
        // Otherwise, fetch it now
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("id, name, is_head, role, department_id")
            .ilike("name", `%${travelOrder.requestingPerson}%`)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
          
          if (userData) {
            requestingPersonUser = userData;
            requestingPersonIsHead = userData.is_head === true || userData.role === "head";
          }
        } catch (error) {
          console.warn("[/api/requests/submit] Could not check if requesting person is head:", error);
          // Default to false if check fails
          requestingPersonIsHead = false;
        }
      }
    } else if (isSeminar) {
      // For seminars, requesting person is the logged-in user
      requestingPersonIsHead = requesterIsHead;
      requestingPersonUser = profile;
    }

    // Determine initial status using workflow engine
    // If representative submission (requesting person ≠ submitter), send to requesting person first
    // If requesting person is NOT a head, send to their department head first
    // If requesting person IS a head, can go directly to admin
    const requestedStatus = body.status;
    let initialStatus: string;
    if (requestedStatus === "draft") {
      initialStatus = "draft";
    } else if (mightBeRepresentative && !isSeminar && travelOrder.requestingPerson) {
      // Representative submission: send to requesting person first for signature
      // Status: "pending_requester_signature" or "pending_head" (if requesting person is head)
      if (requestingPersonIsHead) {
        initialStatus = "pending_head"; // Requesting person is head, they can approve directly
      } else {
        initialStatus = "pending_requester_signature"; // Need requesting person's signature first
      }
    } else if (requestingPersonIsHead) {
      // Requesting person is a head, can go directly to admin
      initialStatus = "pending_admin";
    } else {
      // Requesting person is NOT a head, send to their department head first
      initialStatus = "pending_head";
    }
    const seminar = body.seminar || {};
    
    // Parse travel dates
    const travelStartDate = travelOrder.date || travelOrder.dateFrom || new Date().toISOString();
    const travelEndDate = travelOrder.dateTo || travelOrder.date || travelStartDate;

    // Prepare participants (simplified for now)
    const participants = travelOrder.participants || [];
    
    // Determine if this is a representative submission
    // Note: requestingPersonName, submitterName, and mightBeRepresentative already defined above
    // Use mightBeRepresentative as isRepresentative (they're the same check)
    const isRepresentative = mightBeRepresentative;

    // Build request object
    // For seminar requests, use seminar data; for travel orders, use travelOrder data
    
    const requestData = {
      request_type: requestType,
      // Title: use seminar_title for seminars, purposeOfTravel for travel orders
      title: isSeminar 
        ? (seminar.title || "Seminar Application")
        : (travelOrder.purposeOfTravel || travelOrder.purpose || "Travel Request"),
      // For seminars, also save seminar_title separately
      ...(isSeminar ? { seminar_title: seminar.title || "" } : {}),
      purpose: isSeminar 
        ? (seminar.title || "")
        : (travelOrder.purposeOfTravel || travelOrder.purpose || ""),
      destination: isSeminar 
        ? (seminar.venue || "")
        : (travelOrder.destination || ""),
      // For seminars, also save seminar_venue separately
      ...(isSeminar ? { seminar_venue: seminar.venue || "" } : {}),
      
      // Dates: use date_from/date_to for seminars, travel_start_date/travel_end_date for travel orders
      ...(isSeminar ? {
        date_from: seminar.dateFrom || new Date().toISOString(),
        date_to: seminar.dateTo || new Date().toISOString(),
        // Also set travel dates for compatibility
        travel_start_date: seminar.dateFrom || new Date().toISOString(),
        travel_end_date: seminar.dateTo || new Date().toISOString(),
      } : {
        travel_start_date: travelOrder.departureDate || travelOrder.date || new Date().toISOString(),
        travel_end_date: travelOrder.returnDate || travelOrder.dateTo || travelOrder.date || new Date().toISOString(),
      }),
      
      // Requester = person who needs the travel (from form)
      // If representative submission, use requesting person's ID; otherwise use submitter's ID
      requester_id: isRepresentative && !isSeminar && requestingPersonUser?.id 
        ? requestingPersonUser.id 
        : profile.id,
      requester_name: requestingPersonName,
      requester_signature: isSeminar 
        ? (seminar.requesterSignature || null)
        : (isRepresentative ? null : travelOrder.requesterSignature || null), // No signature if representative (requester signs later)
      requester_is_head: requestingPersonIsHead, // Use requesting person's head status, not submitter's
      department_id: isRepresentative && !isSeminar && requestingPersonUser?.department_id
        ? requestingPersonUser.department_id
        : departmentId, // Use requesting person's department if representative submission
      
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
      cost_justification: costs.justification || null,
      
      vehicle_mode: vehicleMode, // "owned", "institutional", or "rent"
      needs_vehicle: needsVehicle,
      vehicle_type: vehicleMode === "rent" ? "Rental" : vehicleMode === "institutional" ? "University Vehicle" : vehicleMode === "owned" ? "Personal Vehicle" : null,
      needs_rental: vehicleMode === "rent",
      
      // Preferred suggestions (faculty can suggest, admin decides)
      // Only include if they have values to avoid undefined in DB
      ...(preferredDriverId ? { preferred_driver_id: preferredDriverId } : {}),
      ...(preferredVehicleId ? { preferred_vehicle_id: preferredVehicleId } : {}),
      
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
      console.error("[/api/requests/submit] Error code:", error.code);
      console.error("[/api/requests/submit] Error message:", error.message);
      console.error("[/api/requests/submit] Error details:", error.details);
      console.error("[/api/requests/submit] Request data being inserted:", JSON.stringify(requestData, null, 2));
      
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
        // Foreign key violation - be more specific
        if (error.message?.includes('department')) {
          userFriendlyError = "Invalid department. Your account may not be properly configured. Please contact your administrator.";
        } else if (error.message?.includes('driver') || error.message?.includes('vehicle')) {
          userFriendlyError = "Invalid driver or vehicle selection. Please refresh the page and try again.";
        } else {
          userFriendlyError = "Invalid information provided. Please refresh the page and try again.";
        }
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

    // Auto-send participant invitations for seminar requests
    // This runs asynchronously and won't block the response
    if (reason === "seminar" && body.seminar?.participantInvitations) {
      const participantInvitations = Array.isArray(body.seminar.participantInvitations) 
        ? body.seminar.participantInvitations 
        : [];
      
      if (participantInvitations.length > 0) {
        console.log(`[/api/requests/submit] Auto-sending ${participantInvitations.length} participant invitations...`);
        
        // Process invitations asynchronously (fire and forget - don't block response)
        // Use Promise.resolve().then() to run after response is sent
        Promise.resolve().then(async () => {
          try {
            const invitationPromises = participantInvitations
              .filter((inv: any) => inv.email && !inv.invitationId) // Only send if email exists and not already sent
              .map(async (inv: any) => {
                try {
                  const token = crypto.randomBytes(32).toString('hex');
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
                  
                  const { data: invitation, error: inviteError } = await supabase
                    .from("participant_invitations")
                    .insert({
                      request_id: data.id,
                      email: inv.email.toLowerCase(),
                      invited_by: profile.id,
                      token,
                      expires_at: expiresAt.toISOString(),
                      status: 'pending',
                    })
                    .select()
                    .single();
                  
                  if (!inviteError && invitation) {
                    // Send email notification
                    // Fix: Properly handle baseUrl with fallback
                    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
                    if (!baseUrl && process.env.VERCEL_URL) {
                      baseUrl = `https://${process.env.VERCEL_URL}`;
                    }
                    if (!baseUrl) {
                      baseUrl = "http://localhost:3000";
                    }
                    const confirmationLink = `${baseUrl}/participants/confirm/${token}`;

                    const seminarTitle = body.seminar?.title || "Seminar/Training";
                    const requesterName = profile.name || "Requester";
                    const requesterProfilePicture = profile.profile_picture || null;
                    const dateFrom = body.seminar?.dateFrom || "";
                    const dateTo = body.seminar?.dateTo || "";

                    const emailHtml = generateParticipantInvitationEmail({
                      participantName: undefined,
                      requesterName,
                      requesterProfilePicture,
                      seminarTitle,
                      dateFrom,
                      dateTo,
                      confirmationLink,
                    });

                    const emailResult = await sendEmail({
                      to: inv.email.toLowerCase(),
                      subject: `Seminar Participation Invitation: ${seminarTitle}`,
                      html: emailHtml,
                    });

                    if (emailResult.success) {
                      console.log(`[/api/requests/submit] ✅ Invitation created and email sent to ${inv.email}`);
                    } else {
                      console.warn(`[/api/requests/submit] ⚠️ Invitation created but email failed for ${inv.email}:`, emailResult.error);
                    }
                  } else {
                    console.warn(`[/api/requests/submit] ⚠️ Failed to create invitation for ${inv.email}:`, inviteError?.message);
                  }
                } catch (err: any) {
                  console.error(`[/api/requests/submit] Error creating invitation for ${inv.email}:`, err.message);
                }
              });
            
            await Promise.allSettled(invitationPromises);
            console.log(`[/api/requests/submit] ✅ All participant invitations processed`);
          } catch (err: any) {
            console.error(`[/api/requests/submit] Error processing invitations:`, err.message);
          }
        });
      }
    }

    return NextResponse.json({ ok: true, data });

  } catch (error: any) {
    console.error("[/api/requests/submit] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
