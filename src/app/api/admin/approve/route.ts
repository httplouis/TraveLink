// src/app/api/admin/approve/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role for admin operations
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile (try users table first, fallback to auth user)
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    // Use profile if exists, otherwise use auth user data
    const userId = profile?.id || user.id;
    const userName = profile?.name || user.email || "Admin User";
    
    console.log("[POST /api/admin/approve] User:", { userId, userName, hasProfile: !!profile });

    // Parse request body
    const body = await request.json();
    const { 
      requestId, 
      signature, 
      driver, 
      vehicle, 
      adminNotes,
      requiresComptroller,
      editedBudget, // NEW: Admin can edit budget before sending to comptroller
      nextApproverId, // NEW: Choice-based sending
      nextApproverRole // NEW: 'comptroller' or 'hr'
    } = body;

    if (!requestId || !signature) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // MANDATORY: Admin notes are required (minimum 20 characters)
    if (!adminNotes || adminNotes.trim().length < 20) {
      return NextResponse.json({ 
        ok: false, 
        error: "Admin notes are mandatory and must be at least 20 characters long" 
      }, { status: 400 });
    }

    // Get request
    const { data: req, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();
    
    // Check vehicle/driver availability if assigned
    if (driver || vehicle) {
      const { checkBothAvailability } = await import("@/lib/availability/check");
      const availability = await checkBothAvailability(
        vehicle || null,
        driver || null,
        req.travel_start_date,
        req.travel_end_date,
        requestId // Exclude current request from conflicts
      );
      
      if (!availability.bothAvailable) {
        const errors: string[] = [];
        if (!availability.vehicle.available) {
          errors.push(availability.vehicle.message || "Vehicle is not available");
          if (availability.vehicle.conflicts.length > 0) {
            errors.push(`Conflicts with: ${availability.vehicle.conflicts.map(c => c.requestNumber).join(", ")}`);
          }
        }
        if (!availability.driver.available) {
          errors.push(availability.driver.message || "Driver is not available");
          if (availability.driver.conflicts.length > 0) {
            errors.push(`Conflicts with: ${availability.driver.conflicts.map(c => c.requestNumber).join(", ")}`);
          }
        }
        
        return NextResponse.json({
          ok: false,
          error: errors.join(". "),
          conflicts: {
            vehicle: availability.vehicle.conflicts,
            driver: availability.driver.conflicts
          }
        }, { status: 400 });
      }
    }

    if (fetchError || !req) {
      console.error("[POST /api/admin/approve] Request fetch error:", fetchError);
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Verify status is ready for admin approval
    const validStatuses = ["head_approved", "pending_admin", "admin_received"];
    if (!validStatuses.includes(req.status)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Request is in ${req.status} status, not ready for admin approval` 
      }, { status: 400 });
    }

    const { getPhilippineTimestamp } = await import("@/lib/datetime");
    const now = getPhilippineTimestamp();

    // Determine next status based on budget and choice-based sending
    // If nextApproverRole is provided, use it; otherwise fall back to requiresComptroller logic
    let nextStatus: string;
    let nextApproverRoleFinal: string;
    
    if (nextApproverRole) {
      // Choice-based sending
      nextApproverRoleFinal = nextApproverRole;
      nextStatus = nextApproverRole === "comptroller" ? "pending_comptroller" : "pending_hr";
    } else {
      // Fallback to original logic
      nextApproverRoleFinal = requiresComptroller ? "comptroller" : "hr";
      nextStatus = requiresComptroller ? "pending_comptroller" : "pending_hr";
    }

    // Update request with admin approval
    const updateData: any = {
      status: nextStatus,
      current_approver_role: nextApproverRoleFinal,
      admin_approved_at: now,
      admin_processed_at: now, // For tracking timeline
      admin_approved_by: userId,
      admin_processed_by: userId, // For tracking timeline
      admin_signature: signature,
      admin_notes: adminNotes || null,
      admin_comments: adminNotes || null, // For tracking timeline
      assigned_driver_id: driver || null,
      assigned_vehicle_id: vehicle || null,
      updated_at: now,
    };

    // If admin edited budget, store it (comptroller will see this)
    if (editedBudget) {
      updateData.edited_budget = editedBudget;
      updateData.budget_edited_by = userId;
      updateData.budget_edited_at = now;
    }

    // Set next approver ID if provided (choice-based sending)
    if (nextApproverId) {
      if (nextApproverRoleFinal === "comptroller") {
        updateData.next_comptroller_id = nextApproverId;
      } else if (nextApproverRoleFinal === "hr") {
        updateData.next_hr_id = nextApproverId;
      }
    }

    console.log(`[POST /api/admin/approve] Approving request ${requestId}: ${req.status} → ${nextStatus}`);
    console.log(`[POST /api/admin/approve] 🖊️ Signature length:`, signature?.length || 0);
    console.log(`[POST /api/admin/approve] 📝 Update data:`, JSON.stringify(updateData, null, 2));

    const { error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[POST /api/admin/approve] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log to request_history with complete tracking
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "admin_approved",
      actor_id: userId,
      actor_role: "admin",
      previous_status: req.status,
      new_status: nextStatus,
      comments: adminNotes || `Admin approved by ${userName}, sent to ${nextApproverRoleFinal === 'comptroller' ? 'Comptroller' : 'HR'}`,
      metadata: {
        signature_at: now,
        signature_time: now, // Track signature time
        receive_time: req.created_at || now, // Track when request was received
        submission_time: req.created_at || null, // Track original submission time
        sent_to: nextApproverRoleFinal,
        sent_to_id: nextApproverId || null,
        edited_budget: editedBudget || null,
        driver_assigned: driver || null,
        vehicle_assigned: vehicle || null,
        approval_time: now
      }
    });

    // Create notifications
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");
      
      // Notify requester
      if (req.requester_id) {
        await createNotification({
          user_id: req.requester_id,
          notification_type: "request_approved",
          title: "Request Approved by Admin",
          message: `Your travel order request ${req.request_number || ''} has been approved by Admin and is now with ${nextApproverRoleFinal === 'comptroller' ? 'Comptroller' : 'HR'}.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/submissions?view=${requestId}`,
          action_label: "View Request",
          priority: "normal",
        });
      }

      // Notify next approver (Comptroller or HR)
      if (nextApproverId) {
        await createNotification({
          user_id: nextApproverId,
          notification_type: "request_pending_signature",
          title: "Request Requires Your Approval",
          message: `A travel order request ${req.request_number || ''} has been sent to you for approval.`,
          related_type: "request",
          related_id: requestId,
          action_url: nextApproverRoleFinal === "comptroller" ? `/comptroller/inbox?view=${requestId}` : `/hr/inbox?view=${requestId}`,
          action_label: "Review Request",
          priority: "high",
        });
      }
    } catch (notifError: any) {
      console.error("[Admin Approve] Failed to create notifications:", notifError);
    }

    console.log(`[Admin Approve] ✅ Request ${requestId} approved, sent to ${nextApproverRoleFinal}`);

    return NextResponse.json({ 
      ok: true, 
      data: { 
        id: requestId, 
        status: nextStatus,
        message: `Request approved and sent to ${nextApproverRoleFinal === 'comptroller' ? 'Comptroller' : 'HR'}`
      } 
    });

  } catch (error: any) {
    console.error("[POST /api/admin/approve] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
