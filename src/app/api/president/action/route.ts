import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get President user info
    const { data: presidentUser } = await supabase
      .from("users")
      .select("id, name, is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!presidentUser?.is_president) {
      return NextResponse.json({ ok: false, error: "President role required" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[President Action] ${action} by ${presidentUser.name} on request ${requestId}`);

    // Get request details for notifications (will be fetched again in approve/reject if needed)

    if (action === "approve") {
      // Get request to check current status
      const { data: request } = await supabase
        .from("requests")
        .select("*, requester:users!requester_id(role, is_head, exec_type)")
        .eq("id", requestId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const now = getPhilippineTimestamp();
      
      // President is the final approver - mark as fully approved
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "approved",
          current_approver_role: null,
          president_approved_at: now,
          president_approved_by: presidentUser.id,
          president_signature: signature || null,
          president_comments: notes || null,
          final_approved_at: now,
          updated_at: now,
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[President Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      await supabase.from("request_history").insert({
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
          sent_to: "requester",
          final_approval: true,
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
            message: `Your travel order request ${request.request_number || ''} has been fully approved by the President. You can now download the approval form.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Details",
            priority: "high",
          });
        }

        // Notify all admins
        const { data: admins } = await supabase
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
      // Reject request
      const { error: updateError } = await supabase
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
      const { data: request } = await supabase
        .from("requests")
        .select("requester_id, request_number")
        .eq("id", requestId)
        .single();

      const now = getPhilippineTimestamp();

      // Log to request history with complete tracking
      await supabase.from("request_history").insert({
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
