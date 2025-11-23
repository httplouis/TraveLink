// src/app/api/admin/approve/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendDriverTravelNotification } from "@/lib/sms/sms-service";
import { extractInitials } from "@/lib/utils/pdf-helpers";

export async function POST(request: Request) {
  try {
    // Create a direct Supabase client with service role key to bypass RLS
    // This ensures we can fetch and update requests regardless of RLS policies
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Use regular client to read cookies for authentication
    const supabase = await createSupabaseServerClient(false);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile (try users table first, fallback to auth user)
    // Use service role client to bypass RLS
    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    // Use profile if exists, otherwise use auth user data
    const userId = profile?.id || user.id;
    const userName = profile?.name || user.email || "Admin User";
    
    console.log("[POST /api/admin/approve] User:", { userId, userName, hasProfile: !!profile });

    // Verify admin access
    if (!profile || !profile.is_admin) {
      return NextResponse.json({ 
        ok: false, 
        error: "Access denied. Admin role required." 
      }, { status: 403 });
    }

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
      nextApproverRole, // NEW: 'comptroller' or 'hr'
      sendNotifications = true // NEW: Optional email/notification sending (default: true)
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

    // Get request using service role client to bypass RLS
    console.log("[POST /api/admin/approve] Fetching request:", requestId);
    const { data: req, error: fetchError } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();
    
    console.log("[POST /api/admin/approve] Request fetch result:", {
      found: !!req,
      error: fetchError?.message,
      requestId
    });
    
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
    // If nextApproverId is provided, fetch user's actual role to determine correct status
    let nextStatus: string;
    let nextApproverRoleFinal: string;
    
    if (nextApproverId && nextApproverRole) {
      // Fetch user's actual role to determine correct routing
      // Use service role client to bypass RLS
      try {
        const { data: approverUser } = await supabaseServiceRole
          .from("users")
          .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
          .eq("id", nextApproverId)
          .single();
        
        if (approverUser) {
          // Determine status based on user's actual role
          if (approverUser.is_comptroller || approverUser.role === "comptroller") {
            nextStatus = "pending_comptroller";
            nextApproverRoleFinal = "comptroller";
          } else if (approverUser.is_hr || approverUser.role === "hr") {
            nextStatus = "pending_hr";
            nextApproverRoleFinal = "hr";
          } else if (approverUser.is_admin || approverUser.role === "admin") {
            nextStatus = "pending_admin";
            nextApproverRoleFinal = "admin";
          } else if (approverUser.is_vp || approverUser.role === "exec") {
            nextStatus = "pending_exec";
            nextApproverRoleFinal = "vp";
          } else if (approverUser.is_president || approverUser.exec_type === "president") {
            nextStatus = "pending_exec";
            nextApproverRoleFinal = "president";
          } else {
            // Use role from selection
            nextApproverRoleFinal = nextApproverRole;
            nextStatus = nextApproverRole === "comptroller" ? "pending_comptroller" : "pending_hr";
          }
        } else {
          // User not found - use role from selection
          nextApproverRoleFinal = nextApproverRole;
          nextStatus = nextApproverRole === "comptroller" ? "pending_comptroller" : "pending_hr";
        }
      } catch (err) {
        console.error("[Admin Approve] Error fetching approver user:", err);
        // Fallback to role from selection
        nextApproverRoleFinal = nextApproverRole;
        nextStatus = nextApproverRole === "comptroller" ? "pending_comptroller" : "pending_hr";
      }
    } else if (nextApproverRole) {
      // Choice-based sending without user ID
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
    // Note: Don't set next_comptroller_id or next_hr_id - allow all comptrollers/HRs to see it
    // Only set specific IDs for VP and President (they have different roles)
    if (nextApproverId) {
      // Store approver ID based on their actual role
      if (nextApproverRoleFinal === "comptroller") {
        // Don't set next_comptroller_id - allow all comptrollers to see it
        // updateData.next_comptroller_id = nextApproverId;
      } else if (nextApproverRoleFinal === "hr") {
        // Don't set next_hr_id - allow all HRs to see it
        // updateData.next_hr_id = nextApproverId;
      } else if (nextApproverRoleFinal === "admin") {
        // Don't set next_admin_id - allow all admins to see it
        // updateData.next_admin_id = nextApproverId;
      } else if (nextApproverRoleFinal === "vp") {
        updateData.next_vp_id = nextApproverId;
      } else if (nextApproverRoleFinal === "president") {
        updateData.next_president_id = nextApproverId;
      } else if (nextApproverRoleFinal === "head") {
        updateData.next_head_id = nextApproverId;
      }
    }

    // Update workflow_metadata with routing information
    const workflowMetadata: any = req.workflow_metadata || {};
    
    // IMPORTANT: For comptroller, hr, and admin - don't set next_approver_id
    // This allows ALL users in that role to see the request
    if (nextApproverRoleFinal === "comptroller" || nextApproverRoleFinal === "hr" || nextApproverRoleFinal === "admin") {
      // Clear any existing next_approver_id to ensure all users in that role can see it
      workflowMetadata.next_approver_id = null;
      workflowMetadata.next_approver_role = nextApproverRoleFinal;
      // Explicitly clear role-specific IDs
      workflowMetadata.next_comptroller_id = null;
      workflowMetadata.next_hr_id = null;
      workflowMetadata.next_admin_id = null;
    } else if (nextApproverId && nextApproverRoleFinal) {
      // For other roles (VP, President, Head), set the specific approver ID
      workflowMetadata.next_approver_id = nextApproverId;
      workflowMetadata.next_approver_role = nextApproverRoleFinal;
      
      // Store role-specific IDs for inbox filtering
      if (nextApproverRoleFinal === "vp") {
        workflowMetadata.next_vp_id = nextApproverId;
      } else if (nextApproverRoleFinal === "president") {
        workflowMetadata.next_president_id = nextApproverId;
      } else if (nextApproverRoleFinal === "head") {
        workflowMetadata.next_head_id = nextApproverId;
      }
    }
    
    updateData.workflow_metadata = workflowMetadata;
    
    console.log("[POST /api/admin/approve] Workflow metadata:", JSON.stringify(workflowMetadata, null, 2));

    console.log(`[POST /api/admin/approve] Approving request ${requestId}: ${req.status} → ${nextStatus}`);
    console.log(`[POST /api/admin/approve] 🖊️ Signature length:`, signature?.length || 0);
    console.log(`[POST /api/admin/approve] 📝 Update data:`, JSON.stringify(updateData, null, 2));

    // Use service role client to update request (bypass RLS)
    // Update request number if driver is assigned (to include driver name in format)
    if (driver) {
      try {
        // Get driver name
        const { data: driverInfo } = await supabaseServiceRole
          .from("users")
          .select("name")
          .eq("id", driver)
          .single();
        
        if (driverInfo?.name) {
          // Use database function to update request number with driver
          const { data: newRequestNumber, error: rpcError } = await supabaseServiceRole
            .rpc('update_request_number_with_driver', {
              p_request_id: requestId,
              p_driver_name: driverInfo.name
            });
          
          if (rpcError) {
            console.warn("[POST /api/admin/approve] Failed to update request number with driver via RPC:", rpcError);
            // Fallback: manual update
            const existingNumber = req.request_number || '';
            const parts = existingNumber.split('-');
            if (parts.length >= 3) {
              const year = parts[1];
              const sequence = parts[2];
              const requesterName = req.requester_name || "UNKNOWN";
              const participantCount = Array.isArray(req.participants) ? req.participants.length : 0;
              const isSingleRequester = participantCount <= 1;
              const requesterPart = isSingleRequester 
                ? extractInitials(requesterName)
                : requesterName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
              const driverPart = driverInfo.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
              updateData.request_number = `TO-${year}-${sequence}-${requesterPart}-${driverPart}`;
            }
          } else if (newRequestNumber) {
            updateData.request_number = newRequestNumber;
          }
        }
      } catch (err) {
        console.warn("[POST /api/admin/approve] Failed to update request number with driver:", err);
        // Continue without updating request number
      }
    }

    const { error: updateError } = await supabaseServiceRole
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[POST /api/admin/approve] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Send SMS to driver if driver is assigned
    if (driver) {
      try {
        // Fetch driver and requester info for SMS
        const { data: driverInfo } = await supabaseServiceRole
          .from("users")
          .select("name, phone_number, contact_number")
          .eq("id", driver)
          .single();

        const { data: requesterInfo } = await supabaseServiceRole
          .from("users")
          .select("name, phone_number, contact_number")
          .eq("id", req.requester_id)
          .single();

        if (driverInfo && (driverInfo.phone_number || driverInfo.contact_number)) {
          const driverPhone = driverInfo.phone_number || driverInfo.contact_number;
          const requesterName = requesterInfo?.name || req.requester_name || "Requester";
          const requesterPhone = requesterInfo?.phone_number || requesterInfo?.contact_number || req.requester_contact_number || "";

          await sendDriverTravelNotification({
            driverPhone,
            requesterName,
            requesterPhone,
            travelDate: req.travel_start_date,
            destination: req.destination || "",
            pickupLocation: req.pickup_location || null,
            pickupTime: req.pickup_time || null,
            pickupPreference: req.pickup_preference || "pickup",
            requestNumber: req.request_number || `TO-${requestId.substring(0, 8)}`,
          });

          console.log(`[Admin Approve] 📱 SMS sent to driver ${driverInfo.name} (${driverPhone})`);
        } else {
          console.warn(`[Admin Approve] ⚠️ Driver ${driver} has no phone number, SMS not sent`);
        }
      } catch (smsError: any) {
        // Don't fail the approval if SMS fails
        console.error("[Admin Approve] Failed to send SMS to driver:", smsError);
      }
    }

    // Log to request_history with complete tracking
    // Use service role client to bypass RLS
    await supabaseServiceRole.from("request_history").insert({
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

    // Create notifications (only if sendNotifications is true)
    if (sendNotifications) {
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
    } else {
      console.log("[Admin Approve] ⚠️ Notifications disabled by admin - skipping email/notification sending");
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
