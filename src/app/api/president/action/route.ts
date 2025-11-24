import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    // First, use regular client to get authenticated user (has access to cookies/session)
    const supabase = await createSupabaseServerClient(false);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get President user info using regular client (RLS will apply)
    const { data: presidentUser } = await supabase
      .from("users")
      .select("id, name, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!presidentUser?.is_president) {
      return NextResponse.json({ ok: false, error: "President role required" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes, nextApproverId, nextApproverRole, returnReason, editedBudget } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[President Action] ${action} by ${presidentUser.name} on request ${requestId}`);

    // Get request details for notifications (will be fetched again in approve/reject if needed)

    if (action === "approve") {
      // Use service role client for database operations (bypass RLS)
      const supabaseServiceRole = await createSupabaseServerClient(true);
      
      // Get request to check current status
      const { data: request } = await supabaseServiceRole
        .from("requests")
        .select("*, requester:users!requester_id(role, is_head, exec_type)")
        .eq("id", requestId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const now = getPhilippineTimestamp();
      
      // Determine next status and approver based on selection
      let newStatus: string;
      let nextApproverRoleFinal: string | null = null;
      let updateData: any = {
        president_approved_at: now,
        president_approved_by: presidentUser.id,
        president_signature: signature || null,
        president_comments: notes || null,
        updated_at: now,
      };

      if (returnReason) {
        // Return to requester
        newStatus = "pending_requester";
        nextApproverRoleFinal = "requester";
        updateData.return_reason = returnReason;
      } else if (nextApproverId && nextApproverRole) {
          // User selected specific approver - fetch user's actual role to determine correct status
          try {
            const { data: approverUser } = await supabaseServiceRole
              .from("users")
              .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
              .eq("id", nextApproverId)
              .single();
          
          if (approverUser) {
            // Determine status based on user's actual role
            if (approverUser.is_comptroller || approverUser.role === "comptroller") {
              newStatus = "pending_comptroller";
              nextApproverRoleFinal = "comptroller";
              // Don't set next_comptroller_id - allow all comptrollers to see it
              // updateData.next_comptroller_id = nextApproverId;
            } else if (approverUser.is_hr || approverUser.role === "hr") {
              newStatus = "pending_hr";
              nextApproverRoleFinal = "hr";
              // Don't set next_hr_id - allow all HRs to see it
              // updateData.next_hr_id = nextApproverId;
            } else if (approverUser.is_admin || approverUser.role === "admin") {
              newStatus = "pending_admin";
              nextApproverRoleFinal = "admin";
              // Don't set next_admin_id - allow all admins to see it
              // updateData.next_admin_id = nextApproverId;
            } else if (approverUser.is_vp || approverUser.role === "exec") {
              newStatus = "pending_exec";
              nextApproverRoleFinal = "vp";
              updateData.next_vp_id = nextApproverId;
            } else {
              // Unknown role - use role from selection or default to approved
              if (nextApproverRole === "comptroller") {
                newStatus = "pending_comptroller";
                nextApproverRoleFinal = "comptroller";
                // Don't set next_comptroller_id - allow all comptrollers to see it
                // updateData.next_comptroller_id = nextApproverId;
              } else if (nextApproverRole === "hr") {
                newStatus = "pending_hr";
                nextApproverRoleFinal = "hr";
                // Don't set next_hr_id - allow all HRs to see it
                // updateData.next_hr_id = nextApproverId;
              } else {
                // Default to fully approved
                newStatus = "approved";
                updateData.final_approved_at = now;
              }
            }
          } else {
            // User not found - use role from selection
            if (nextApproverRole === "comptroller") {
              newStatus = "pending_comptroller";
              nextApproverRoleFinal = "comptroller";
              // Don't set next_comptroller_id - allow all comptrollers to see it
              // updateData.next_comptroller_id = nextApproverId;
            } else if (nextApproverRole === "hr") {
              newStatus = "pending_hr";
              nextApproverRoleFinal = "hr";
              // Don't set next_hr_id - allow all HRs to see it
              // updateData.next_hr_id = nextApproverId;
            } else {
              // Default to fully approved
              newStatus = "approved";
              updateData.final_approved_at = now;
            }
          }
        } catch (err) {
          console.error("[President Action] Error fetching approver user:", err);
          // Fallback to role-based logic
          if (nextApproverRole === "comptroller") {
            newStatus = "pending_comptroller";
            nextApproverRoleFinal = "comptroller";
            // Don't set next_comptroller_id - allow all comptrollers to see it
            // updateData.next_comptroller_id = nextApproverId;
          } else if (nextApproverRole === "hr") {
            newStatus = "pending_hr";
            nextApproverRoleFinal = "hr";
            // Don't set next_hr_id - allow all HRs to see it
            // updateData.next_hr_id = nextApproverId;
          } else {
            // Default to fully approved
            newStatus = "approved";
            updateData.final_approved_at = now;
          }
        }
      } else {
        // Default: fully approved (no selection means final approval)
        newStatus = "approved";
        updateData.final_approved_at = now;
      }

      updateData.status = newStatus;
      updateData.current_approver_role = nextApproverRoleFinal;

      // Update workflow_metadata with routing information
      const workflowMetadata: any = request.workflow_metadata || {};
      if (nextApproverId && nextApproverRoleFinal) {
        workflowMetadata.next_approver_id = nextApproverId;
        workflowMetadata.next_approver_role = nextApproverRoleFinal;
        // Store role-specific IDs for inbox filtering
        // Note: Don't set next_comptroller_id, next_hr_id, or next_admin_id - allow all to see it
        if (nextApproverRoleFinal === "comptroller") {
          // Don't set - allow all comptrollers to see it
          // workflowMetadata.next_comptroller_id = nextApproverId;
        } else if (nextApproverRoleFinal === "hr") {
          // Don't set - allow all HRs to see it
          // workflowMetadata.next_hr_id = nextApproverId;
        } else if (nextApproverRoleFinal === "admin") {
          // Don't set - allow all admins to see it
          // workflowMetadata.next_admin_id = nextApproverId;
        } else if (nextApproverRoleFinal === "vp") {
          workflowMetadata.next_vp_id = nextApproverId;
        } else if (nextApproverRoleFinal === "president") {
          workflowMetadata.next_president_id = nextApproverId;
        } else if (nextApproverRoleFinal === "head") {
          workflowMetadata.next_head_id = nextApproverId;
        }
      }
      if (returnReason) {
        workflowMetadata.return_reason = returnReason;
      }
      updateData.workflow_metadata = workflowMetadata;

      const { error: updateError } = await supabaseServiceRole
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[President Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      await supabaseServiceRole.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: presidentUser.id,
        actor_role: "president",
        previous_status: "pending_exec", // President status is pending_exec
        new_status: "approved",
        comments: notes || "Approved by President - Final Approval",
        metadata: {
          signature_at: now,
          signature_time: now, // Track signature time
          receive_time: request.created_at || now, // Track when request was received
          submission_time: request.created_at || null, // Track original submission time
          sent_to: nextApproverRoleFinal || "requester",
          final_approval: newStatus === "approved",
          requester_type: request.requester_is_head ? "head" : "faculty",
          head_included: request.head_included || false
        }
      });

      // Create notifications using helper
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        
        // Notify requester
        if (request.requester_id) {
          await createNotification({
            user_id: request.requester_id,
            notification_type: "request_approved",
            title: "Request Fully Approved",
            message: `Your travel order request ${request.request_number || ''} has been fully approved! The approval process is complete. You can now download the Travel Order PDF from your dashboard or submissions page.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View & Download PDF",
            priority: "high",
          });
        }

        // Notify next approver if not fully approved
        if (nextApproverId && nextApproverRoleFinal) {
          if (nextApproverRoleFinal === "comptroller") {
            await createNotification({
              user_id: nextApproverId,
              notification_type: "request_pending_signature",
              title: "Request Requires Your Review",
              message: `A travel order request ${request.request_number || ''} has been sent to you for budget review.`,
              related_type: "request",
              related_id: requestId,
              action_url: `/comptroller/review?view=${requestId}`,
              action_label: "Review Request",
              priority: "normal",
            });
          } else if (nextApproverRoleFinal === "hr") {
            await createNotification({
              user_id: nextApproverId,
              notification_type: "request_pending_signature",
              title: "Request Requires Your Review",
              message: `A travel order request ${request.request_number || ''} has been sent to you for review.`,
              related_type: "request",
              related_id: requestId,
              action_url: `/hr/inbox?view=${requestId}`,
              action_label: "Review Request",
              priority: "normal",
            });
          }
        }

        // Notify all admins if fully approved
        if (newStatus === "approved") {
          const { data: admins } = await supabaseServiceRole
            .from("users")
            .select("id")
            .eq("is_admin", true);

          if (admins && admins.length > 0) {
            for (const admin of admins) {
              await createNotification({
                user_id: admin.id,
                notification_type: "request_approved",
                title: "New Approved Request",
                message: `Travel order ${request.request_number || ''} has been fully approved and is ready for processing.`,
                related_type: "request",
                related_id: requestId,
                action_url: `/admin/requests`,
                action_label: "View Requests",
                priority: "high",
              });
            }
          }

          // Send SMS to driver if assigned and not already sent
          if (request.assigned_driver_id && !request.sms_notification_sent) {
            try {
              // Fetch driver details
              const { data: driver } = await supabaseServiceRole
                .from("users")
                .select("id, name, phone_number")
                .eq("id", request.assigned_driver_id)
                .single();

              // Fetch requester details
              const { data: requester } = await supabaseServiceRole
                .from("users")
                .select("id, name")
                .eq("id", request.requester_id)
                .single();

              if (driver && driver.phone_number && requester) {
                const { sendDriverTravelNotification } = await import("@/lib/sms/sms-service");
                
                const smsResult = await sendDriverTravelNotification({
                  driverPhone: driver.phone_number,
                  requesterName: requester.name || request.requester_name || "Unknown",
                  requesterPhone: request.requester_contact_number || "",
                  travelDate: request.travel_start_date,
                  destination: request.destination || "",
                  purpose: request.purpose || "",
                  pickupLocation: request.pickup_location || undefined,
                  pickupTime: request.pickup_time || undefined,
                  pickupPreference: request.pickup_preference as 'pickup' | 'self' | 'gymnasium' | undefined,
                  requestNumber: request.request_number || "",
                });

                if (smsResult.success) {
                  // Update SMS tracking fields
                  await supabaseServiceRole
                    .from("requests")
                    .update({
                      sms_notification_sent: true,
                      sms_sent_at: now,
                      driver_contact_number: driver.phone_number,
                    })
                    .eq("id", requestId);

                  console.log(`[President Approve] ✅ SMS sent to driver ${driver.name} (${driver.phone_number})`);
                } else {
                  console.error(`[President Approve] ❌ Failed to send SMS to driver:`, smsResult.error);
                }
              } else if (!driver?.phone_number) {
                console.warn(`[President Approve] ⚠️ Driver ${driver?.name || request.assigned_driver_id} has no phone number - SMS not sent`);
              }
            } catch (smsError: any) {
              console.error("[President Approve] Error sending SMS to driver:", smsError);
              // Don't fail the approval if SMS fails
            }
          }
        }
      } catch (notifError: any) {
        console.error("[President Approve] Failed to create notifications:", notifError);
      }

      // Trigger feedback notification (will check if trip is completed)
      try {
        const { triggerFeedbackNotification } = await import("@/lib/feedback/notifications");
        await triggerFeedbackNotification(requestId);
      } catch (feedbackError: any) {
        console.error("[President Approve] Failed to trigger feedback notification:", feedbackError);
        // Don't fail approval if feedback notification fails
      }
      
      console.log(`[President Approve] ✅ Request ${requestId} fully approved + notifications sent`);
      
      return NextResponse.json({
        ok: true,
        message: "Request fully approved",
      });

    } else if (action === "reject") {
      // Use service role client for database operations (bypass RLS)
      const supabaseServiceRole = await createSupabaseServerClient(true);
      
      // Reject request
      const { error: updateError } = await supabaseServiceRole
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: presidentUser.id,
          rejection_reason: notes || "Rejected by President",
          rejection_stage: "president",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[President Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Get request for notifications
      const { data: request } = await supabaseServiceRole
        .from("requests")
        .select("requester_id, request_number")
        .eq("id", requestId)
        .single();

      const now = getPhilippineTimestamp();

      // Log to request history with complete tracking
      await supabaseServiceRole.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: presidentUser.id,
        actor_role: "president",
        previous_status: "pending_exec", // President status is pending_exec
        new_status: "rejected",
        comments: notes || "Rejected by President",
        metadata: {
          signature_at: now,
          rejection_reason: notes || "No reason provided"
        }
      });

      // Create notification for requester
      if (request?.requester_id) {
        try {
          const { createNotification } = await import("@/lib/notifications/helpers");
          await createNotification({
            user_id: request.requester_id,
            notification_type: "request_rejected",
            title: "Request Rejected",
            message: `Your travel order request ${request.request_number || ''} has been rejected by the President. Reason: ${notes || "No reason provided"}`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Details",
            priority: "high",
          });
        } catch (notifError: any) {
          console.error("[President Reject] Failed to create notification:", notifError);
        }
      }

      console.log(`[President Reject] ❌ Request ${requestId} rejected + notification sent`);
      
      return NextResponse.json({
        ok: true,
        message: "Request rejected",
      });

    } else if (action === "edit_budget") {
      // Use service role client for database operations (bypass RLS)
      const supabaseServiceRole = await createSupabaseServerClient(true);
      
      // Just update the edited budget without changing status
      const { error: updateError } = await supabaseServiceRole
        .from("requests")
        .update({
          president_edited_budget: editedBudget,
          president_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[President Edit Budget] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      console.log(`[President Edit Budget] 💰 Budget edited for request ${requestId}`);
      
      return NextResponse.json({
        ok: true,
        message: "Budget updated successfully",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[President Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
