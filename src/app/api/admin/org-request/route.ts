// src/app/api/admin/org-request/route.ts
/**
 * POST /api/admin/org-request
 * Handle org requests with face-to-face admin entry
 * Skips some steps (head approval, etc.) and goes directly to admin processing
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";
import { createNotification } from "@/lib/notifications/helpers";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get admin user info
    const { data: adminUser } = await supabase
      .from("users")
      .select("id, name, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Request details
      requestingPerson,
      department,
      destination,
      purpose,
      travelStartDate,
      travelEndDate,
      participants = [],
      
      // Budget (optional for org requests)
      totalBudget = 0,
      expenseBreakdown = [],
      
      // Vehicle (optional)
      needsVehicle = false,
      vehicleType,
      assignedVehicleId,
      assignedDriverId,
      
      // Admin notes (required for manual entry)
      adminNotes,
      signature
    } = body;

    // Validate required fields
    if (!requestingPerson || !destination || !purpose || !travelStartDate || !travelEndDate) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: requestingPerson, destination, purpose, travelStartDate, travelEndDate"
      }, { status: 400 });
    }

    // MANDATORY: Admin notes are required for manual entry
    if (!adminNotes || adminNotes.trim().length < 20) {
      return NextResponse.json({
        ok: false,
        error: "Admin notes are mandatory for manual entry and must be at least 20 characters long"
      }, { status: 400 });
    }

    const now = getPhilippineTimestamp();

    // Find or create requester user (for org requests, may need to create placeholder)
    let requesterId: string;
    const { data: existingRequester } = await supabase
      .from("users")
      .select("id")
      .ilike("name", requestingPerson)
      .limit(1)
      .maybeSingle();

    if (existingRequester) {
      requesterId = existingRequester.id;
    } else {
      // For org requests, create a placeholder user if not found
      // In production, you might want to require the user to exist
      return NextResponse.json({
        ok: false,
        error: `User "${requestingPerson}" not found. Please ensure the requesting person exists in the system.`
      }, { status: 400 });
    }

    // Resolve department
    let departmentId: string | null = null;
    if (department) {
      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .or(`name.ilike.%${department}%,code.ilike.%${department}%`)
        .limit(1)
        .maybeSingle();
      
      if (dept) {
        departmentId = dept.id;
      }
    }

    // Generate request number
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const requestNumber = `ORG-${year}-${timestamp}`;

    // Determine initial status for org requests
    // Org requests skip head approval and go directly to admin
    // If has budget, goes to comptroller; otherwise goes to HR
    const hasBudget = totalBudget > 0 && expenseBreakdown.length > 0;
    const initialStatus = hasBudget ? "pending_comptroller" : "pending_hr";

    // Create request
    const requestData: any = {
      request_type: "travel_order",
      request_number: requestNumber,
      title: purpose,
      purpose: purpose,
      destination: destination,
      travel_start_date: travelStartDate,
      travel_end_date: travelEndDate,
      
      // Requester info
      requester_id: requesterId,
      requester_name: requestingPerson,
      requester_is_head: false, // Org requests are not from heads
      department_id: departmentId,
      
      // Submitter info (admin who manually entered)
      submitted_by_user_id: adminUser.id,
      submitted_by_name: adminUser.name,
      is_representative: false,
      is_org_request: true, // Flag for org requests
      
      // Participants
      participants: participants,
      head_included: false, // Org requests don't require head
      
      // Budget
      has_budget: hasBudget,
      total_budget: totalBudget,
      expense_breakdown: expenseBreakdown,
      
      // Vehicle
      needs_vehicle: needsVehicle,
      vehicle_type: vehicleType || null,
      assigned_vehicle_id: assignedVehicleId || null,
      assigned_driver_id: assignedDriverId || null,
      
      // Status - org requests skip head, go directly to admin/comptroller/HR
      status: initialStatus,
      current_approver_role: hasBudget ? "comptroller" : "hr",
      
      // Admin processing (already done since manual entry)
      admin_processed_at: now,
      admin_processed_by: adminUser.id,
      admin_comments: adminNotes,
      admin_signature: signature || null,
      admin_approved_at: now, // Admin already approved during manual entry
      admin_approved_by: adminUser.id,
    };

    const { data: createdRequest, error: createError } = await supabase
      .from("requests")
      .insert(requestData)
      .select()
      .single();

    if (createError) {
      console.error("[Admin Org Request] Create error:", createError);
      return NextResponse.json({ ok: false, error: createError.message }, { status: 500 });
    }

    // Log to request history
    await supabase.from("request_history").insert({
      request_id: createdRequest.id,
      action: "created_org_request",
      actor_id: adminUser.id,
      actor_role: "admin",
      previous_status: null,
      new_status: initialStatus,
      comments: `Org request manually entered by ${adminUser.name}. ${adminNotes}`,
      metadata: {
        submission_time: now,
        signature_time: now,
        receive_time: now,
        is_org_request: true,
        manual_entry: true,
        entered_by: adminUser.id,
        entered_by_name: adminUser.name
      }
    });

    // Log to audit_logs
    try {
      await supabase.from("audit_logs").insert({
        user_id: adminUser.id,
        action: "create_org_request_manual",
        entity_type: "request",
        entity_id: createdRequest.id,
        new_value: {
          request_number: requestNumber,
          request_type: "travel_order",
          status: initialStatus,
          destination: destination,
          purpose: purpose,
          requester_name: requestingPerson,
          is_org_request: true,
          manual_entry: true
        }
      });
    } catch (auditErr: any) {
      console.error("[Admin Org Request] Failed to log to audit_logs:", auditErr);
    }

    // Create notifications
    try {
      // Notify requester
      if (requesterId) {
        await createNotification({
          user_id: requesterId,
          notification_type: "request_created",
          title: "Travel Request Created",
          message: `A travel order request ${requestNumber} has been created for you by Transportation Management.`,
          related_type: "request",
          related_id: createdRequest.id,
          action_url: `/user/submissions?view=${createdRequest.id}`,
          action_label: "View Request",
          priority: "normal",
        });
      }

      // Notify next approver (Comptroller or HR)
      if (hasBudget) {
        // Notify comptroller
        const { data: comptrollers } = await supabase
          .from("users")
          .select("id")
          .eq("role", "comptroller")
          .eq("status", "active")
          .limit(1);

        if (comptrollers && comptrollers.length > 0) {
          await createNotification({
            user_id: comptrollers[0].id,
            notification_type: "request_pending_signature",
            title: "Org Request Requires Budget Review",
            message: `An org travel order request ${requestNumber} requires your budget review.`,
            related_type: "request",
            related_id: createdRequest.id,
            action_url: `/comptroller/inbox?view=${createdRequest.id}`,
            action_label: "Review Budget",
            priority: "high",
          });
        }
      } else {
        // Notify HR
        const { data: hrStaff } = await supabase
          .from("users")
          .select("id")
          .or("role.eq.hr,is_hr.eq.true")
          .eq("status", "active")
          .limit(1);

        if (hrStaff && hrStaff.length > 0) {
          await createNotification({
            user_id: hrStaff[0].id,
            notification_type: "request_pending_signature",
            title: "Org Request Requires Approval",
            message: `An org travel order request ${requestNumber} requires your approval.`,
            related_type: "request",
            related_id: createdRequest.id,
            action_url: `/hr/inbox?view=${createdRequest.id}`,
            action_label: "Review Request",
            priority: "high",
          });
        }
      }
    } catch (notifError: any) {
      console.error("[Admin Org Request] Failed to create notifications:", notifError);
    }

    console.log(`[Admin Org Request] ✅ Request ${requestNumber} created, status: ${initialStatus}`);

    return NextResponse.json({
      ok: true,
      data: {
        id: createdRequest.id,
        request_number: requestNumber,
        status: initialStatus,
        message: `Org request created successfully and sent to ${hasBudget ? 'Comptroller' : 'HR'}`
      }
    });

  } catch (error: any) {
    console.error("[Admin Org Request] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create org request" },
      { status: 500 }
    );
  }
}

