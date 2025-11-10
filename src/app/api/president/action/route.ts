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

    // Get request details for notifications
    const { data: requestData } = await supabase
      .from("requests")
      .select("requester_id, request_number, purpose, travel_start_date, department_id")
      .eq("id", requestId)
      .single();

    if (action === "approve") {
      // President is the final approver - mark as fully approved
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "approved",
          current_approver_role: null,
          president_approved_at: getPhilippineTimestamp(),
          president_approved_by: presidentUser.id,
          president_signature: signature || null,
          president_comments: notes || null,
          final_approved_at: getPhilippineTimestamp(),
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[President Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: presidentUser.id,
        actor_role: "president",
        previous_status: "pending_president",
        new_status: "approved",
        comments: notes || "Approved by President - Final Approval",
      });

      // Create notification for REQUESTER
      if (requestData?.requester_id) {
        await supabase.from("notifications").insert({
          user_id: requestData.requester_id,
          notification_type: "request_approved",
          title: "🎉 Request Approved!",
          message: `Your travel order request ${requestData.request_number} has been fully approved by the President. You can now download the approval form.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/request/${requestId}`,
          action_label: "View Request",
          priority: "high",
        });
      }

      // Create notifications for ALL ADMINS
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("is_admin", true);

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          notification_type: "request_approved",
          title: "✅ New Approved Request",
          message: `Travel order ${requestData?.request_number} has been fully approved and is ready for processing.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/admin/requests/${requestId}`,
          action_label: "View Request",
          priority: "high",
        }));

        await supabase.from("notifications").insert(adminNotifications);
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

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: presidentUser.id,
        actor_role: "president",
        previous_status: "pending_president",
        new_status: "rejected",
        comments: notes || "Rejected by President",
      });

      // Create notification for REQUESTER
      if (requestData?.requester_id) {
        await supabase.from("notifications").insert({
          user_id: requestData.requester_id,
          notification_type: "request_rejected",
          title: "❌ Request Rejected",
          message: `Your travel order request ${requestData.request_number} has been rejected by the President. Reason: ${notes || "No reason provided"}`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/request/${requestId}`,
          action_label: "View Request",
          priority: "high",
        });
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
