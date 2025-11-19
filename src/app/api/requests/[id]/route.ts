// Get full request details by ID
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Fetch full request details with all approver information
    const { data: request, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(
          id, name, email, profile_picture, phone_number, 
          position_title, department_id,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        department:departments!department_id(id, code, name),
        submitted_by:users!submitted_by_user_id(
          id, name, email, profile_picture, phone_number, position_title
        ),
        head_approver:users!head_approved_by(
          id, name, email, profile_picture, phone_number, position_title,
          department_id, is_head, is_vp,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        parent_head_approver:users!parent_head_approved_by(
          id, name, email, profile_picture, phone_number, position_title,
          department_id, is_head, is_vp,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        vp_approver:users!vp_approved_by(
          id, name, email, profile_picture, phone_number, position_title,
          department_id, is_head, is_vp,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        admin_approver:users!admin_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        comptroller_approver:users!comptroller_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        hr_approver:users!hr_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        vp_approver:users!vp_approved_by(
          id, name, email, profile_picture, phone_number, position_title,
          department_id, is_head, is_vp,
          department:departments!users_department_id_fkey(id, name, code)
        ),
        vp2_approver:users!vp2_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        president_approver:users!president_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        ),
        exec_approver:users!exec_approved_by(
          id, name, email, profile_picture, phone_number, position_title
        )
      `)
      .eq("id", requestId)
      .single();

    if (error) {
      console.error("[GET /api/requests/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Fetch driver and vehicle names if IDs are present
    console.log(`[GET /api/requests/${requestId}] Preferred driver ID:`, request.preferred_driver_id);
    console.log(`[GET /api/requests/${requestId}] Preferred vehicle ID:`, request.preferred_vehicle_id);
    
    if (request.preferred_driver_id || request.preferred_vehicle_id) {
      // Fetch driver name
      if (request.preferred_driver_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching driver name for ID:`, request.preferred_driver_id);
        const { data: driver, error: driverError } = await supabase
          .from("users")
          .select("name")
          .eq("id", request.preferred_driver_id)
          .single();
        
        if (driverError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching driver:`, driverError);
        }
        
        if (driver) {
          request.preferred_driver_name = driver.name;
          console.log(`[GET /api/requests/${requestId}] Driver name found:`, driver.name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Driver not found for ID:`, request.preferred_driver_id);
        }
      }

      // Fetch vehicle name
      if (request.preferred_vehicle_id) {
        console.log(`[GET /api/requests/${requestId}] Fetching vehicle for ID:`, request.preferred_vehicle_id);
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select("vehicle_name, plate_number")
          .eq("id", request.preferred_vehicle_id)
          .single();
        
        if (vehicleError) {
          console.error(`[GET /api/requests/${requestId}] Error fetching vehicle:`, vehicleError);
        }
        
        if (vehicle) {
          request.preferred_vehicle_name = `${vehicle.vehicle_name} • ${vehicle.plate_number}`;
          console.log(`[GET /api/requests/${requestId}] Vehicle found:`, request.preferred_vehicle_name);
        } else {
          console.warn(`[GET /api/requests/${requestId}] Vehicle not found for ID:`, request.preferred_vehicle_id);
        }
      }
    } else {
      console.log(`[GET /api/requests/${requestId}] No driver or vehicle preferences set`);
    }

    // Parse seminar_data if it's a string
    if (request.seminar_data && typeof request.seminar_data === 'string') {
      try {
        request.seminar_data = JSON.parse(request.seminar_data);
      } catch (e) {
        console.warn(`[GET /api/requests/${requestId}] Failed to parse seminar_data:`, e);
      }
    }

    // Parse expense_breakdown if it's a string (JSONB from database)
    if (request.expense_breakdown && typeof request.expense_breakdown === 'string') {
      try {
        request.expense_breakdown = JSON.parse(request.expense_breakdown);
        console.log(`[GET /api/requests/${requestId}] Parsed expense_breakdown:`, request.expense_breakdown);
      } catch (e) {
        console.warn(`[GET /api/requests/${requestId}] Failed to parse expense_breakdown:`, e);
      }
    }

    // Log expense_breakdown for debugging
    console.log(`[GET /api/requests/${requestId}] Expense breakdown:`, {
      type: typeof request.expense_breakdown,
      isArray: Array.isArray(request.expense_breakdown),
      length: Array.isArray(request.expense_breakdown) ? request.expense_breakdown.length : null,
      value: request.expense_breakdown
    });

    return NextResponse.json({ ok: true, data: request });
  } catch (err: any) {
    console.error("[GET /api/requests/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/requests/[id]
 * Update request details (admin only - for assigning vehicles, drivers, editing budget, etc.)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Parse request body first to check if it's a cancellation
    const body = await req.json();
    const isCancellation = body.status === "cancelled";

    // Get request to verify it exists and check permissions
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, status, requester_id, submitted_by_user_id")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user is admin OR the requester (for cancellation)
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "comptroller@mseuf.edu.ph"];
    const isAdmin = adminEmails.includes(profile.email) || profile.is_admin;
    
    const isRequester = request.requester_id === profile.id || request.submitted_by_user_id === profile.id;
    
    // Allow cancellation if user is requester AND request is still pending
    if (isCancellation && isRequester && (request.status.startsWith("pending_") || request.status === "draft")) {
      // Requester can cancel their own pending requests - allow this
    } else if (!isAdmin) {
      return NextResponse.json({ 
        ok: false, 
        error: "Only admins can update requests" 
      }, { status: 403 });
    }

    // Parse request body fields
    const {
      assigned_driver_id,
      assigned_vehicle_id,
      admin_notes,
      admin_comments,
      total_budget,
      expense_breakdown,
      cost_justification,
      // Allow updating other fields as needed
      ...otherFields
    } = body;

    // Build update object - only allow specific fields to be updated
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Admin can assign driver and vehicle
    if (assigned_driver_id !== undefined) {
      updateData.assigned_driver_id = assigned_driver_id || null;
    }
    if (assigned_vehicle_id !== undefined) {
      updateData.assigned_vehicle_id = assigned_vehicle_id || null;
    }

    // Admin can add notes/comments
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes || null;
    }
    if (admin_comments !== undefined) {
      updateData.admin_comments = admin_comments || null;
    }

    // Admin can edit budget (for budget adjustments)
    if (total_budget !== undefined) {
      updateData.total_budget = total_budget;
    }
    if (expense_breakdown !== undefined) {
      updateData.expense_breakdown = expense_breakdown;
    }
    if (cost_justification !== undefined) {
      updateData.cost_justification = cost_justification || null;
    }

    // Allow other safe fields to be updated
    const allowedFields = [
      'admin_processed_at',
      'admin_processed_by',
      'admin_signature',
      'needs_vehicle',
      'needs_rental',
      'has_budget',
      'status', // Allow status updates (for cancellation by requester)
    ];

    for (const field of allowedFields) {
      if (otherFields[field] !== undefined) {
        updateData[field] = otherFields[field];
      }
    }

    // If cancelling, add cancellation metadata
    if (isCancellation && isRequester) {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = profile.id;
      updateData.cancellation_reason = body.cancellation_reason || "Cancelled by requester";
    }

    // Update request
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("[PATCH /api/requests/[id]] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log update in history
    const actorRole = isCancellation && isRequester ? "requester" : "admin";
    const action = isCancellation ? "cancelled" : "updated";
    const comments = isCancellation 
      ? (body.cancellation_reason || "Cancelled by requester")
      : (admin_comments || admin_notes || "Request updated by admin");
    
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: action,
      actor_id: profile.id,
      actor_role: actorRole,
      previous_status: request.status,
      new_status: updateData.status || request.status,
      comments: comments,
      metadata: {
        updated_fields: Object.keys(updateData),
        update_time: new Date().toISOString(),
        cancelled_by_requester: isCancellation && isRequester,
      }
    });

    console.log("[PATCH /api/requests/[id]] Request updated:", requestId, "By:", profile.email);

    return NextResponse.json({ 
      ok: true, 
      data: updated,
      message: "Request updated successfully"
    });

  } catch (err: any) {
    console.error("[PATCH /api/requests/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
