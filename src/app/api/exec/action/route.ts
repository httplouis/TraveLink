import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get executive user and check their role
    const { data: execUser, error: execError } = await supabase
      .from("users")
      .select("id, name, email, is_vp, is_president, is_exec")
      .eq("auth_user_id", user.id)
      .single();

    if (execError || !execUser) {
      return NextResponse.json({ ok: false, error: "Executive user not found" }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get current request status to determine which approval to set
    const { data: currentRequest } = await supabase
      .from("requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (!currentRequest) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Get full request details for notifications
      const { data: fullRequest } = await supabase
        .from("requests")
        .select("*, requester:users!requester_id(id, name, email)")
        .eq("id", requestId)
        .single();

      // Determine update based on current status and user role
      const updateData: any = {
        status: "approved",
        exec_comments: notes || null,
        final_approved_at: getPhilippineTimestamp(),
      };

      // Set appropriate approval based on status and role
      if (currentRequest.status === "pending_vp" && execUser.is_vp) {
        updateData.vp_approved_at = getPhilippineTimestamp();
        updateData.vp_approved_by = execUser.id;
        updateData.vp_signature = signature;
        updateData.status = "pending_president"; // VP approves, goes to President
      } else if (currentRequest.status === "pending_president" && execUser.is_president) {
        updateData.president_approved_at = getPhilippineTimestamp();
        updateData.president_approved_by = execUser.id;
        updateData.president_signature = signature;
        updateData.status = "approved"; // President is final
      } else if (currentRequest.status === "pending_exec" && execUser.is_exec) {
        updateData.exec_approved_at = getPhilippineTimestamp();
        updateData.exec_approved_by = execUser.id;
        updateData.exec_signature = signature;
        updateData.status = "approved"; // Exec is final (old workflow)
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: `Cannot approve request in ${currentRequest.status} status with your role` 
        }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("Failed to approve request:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log history
      const previousStatus = currentRequest.status;
      const newStatus = updateData.status;
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: execUser.id,
        actor_role: execUser.is_president ? "president" : execUser.is_vp ? "vp" : "exec",
        previous_status: previousStatus,
        new_status: newStatus,
        comments: notes || `Approved by ${execUser.is_president ? "President" : execUser.is_vp ? "VP" : "Executive"}`,
      });

      // Create notifications
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        const approverRole = execUser.is_president ? "President" : execUser.is_vp ? "VP" : "Executive";
        
        // Notify requester
        if (fullRequest?.requester_id) {
          const isFinalApproval = newStatus === "approved";
          await createNotification({
            user_id: fullRequest.requester_id,
            notification_type: isFinalApproval ? "request_approved" : "request_status_change",
            title: isFinalApproval ? "Request Fully Approved" : `Request Approved by ${approverRole}`,
            message: isFinalApproval 
              ? `Your travel order request ${fullRequest.request_number || ""} has been fully approved! You may now proceed with your travel.`
              : `Your travel order request ${fullRequest.request_number || ""} has been approved by ${approverRole} and is now with President for final approval.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: isFinalApproval ? "high" : "normal",
          });
        }

        // If VP approved and going to President, notify all presidents
        if (newStatus === "pending_president") {
          const { data: presidents } = await supabase
            .from("users")
            .select("id")
            .eq("is_president", true)
            .eq("status", "active");

          if (presidents && presidents.length > 0) {
            for (const president of presidents) {
              await createNotification({
                user_id: president.id,
                notification_type: "request_pending_signature",
                title: "New Request from VP",
                message: `VP has approved request ${fullRequest?.request_number || ""} and forwarded it to you for final approval.`,
                related_type: "request",
                related_id: requestId,
                action_url: `/president/inbox?view=${requestId}`,
                action_label: "Review Request",
                priority: "high",
              });
            }
          }
        }
      } catch (notifError: any) {
        console.error("[Exec Action] Failed to create notifications:", notifError);
      }

      return NextResponse.json({ ok: true, message: "Request approved successfully" });
    } else if (action === "reject") {
      // Get full request details for notifications
      const { data: fullRequest } = await supabase
        .from("requests")
        .select("*, requester:users!requester_id(id, name, email)")
        .eq("id", requestId)
        .single();

      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: execUser.id,
          rejection_reason: notes,
          rejection_stage: "executive",
          exec_comments: notes,
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Failed to reject request:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: execUser.id,
        actor_role: execUser.is_president ? "president" : execUser.is_vp ? "vp" : "exec",
        previous_status: currentRequest.status,
        new_status: "rejected",
        comments: notes || `Rejected by ${execUser.is_president ? "President" : execUser.is_vp ? "VP" : "Executive"}`,
      });

      // Notify requester about rejection
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        const approverRole = execUser.is_president ? "President" : execUser.is_vp ? "VP" : "Executive";
        
        if (fullRequest?.requester_id) {
          await createNotification({
            user_id: fullRequest.requester_id,
            notification_type: "request_rejected",
            title: "Request Rejected",
            message: `Your travel order request ${fullRequest.request_number || ""} has been rejected by ${approverRole}.${notes ? ` Reason: ${notes}` : ""}`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[Exec Action] Failed to create rejection notification:", notifError);
      }

      return NextResponse.json({ ok: true, message: "Request rejected successfully" });
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Exec action error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to process action" },
      { status: 500 }
    );
  }
}
