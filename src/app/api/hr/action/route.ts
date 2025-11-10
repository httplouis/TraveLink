import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * POST /api/hr/action
 * Approve or reject a request as HR
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get HR user info
    const { data: hrUser } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!hrUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[HR Action] ${action} by ${hrUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Routing logic: ALL requests go to VP first
      // VP and President are mandatory sequential approvers
      const newStatus = "pending_vp";
      const execLevel = "vp";
      const approverRole = "vp";
      const message = "Request approved and sent to VP";

      // Approve and route to VP
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: newStatus,
          exec_level: execLevel,
          current_approver_role: approverRole,
          hr_approved_at: getPhilippineTimestamp(),
          hr_approved_by: hrUser.id,
          hr_signature: signature || null,
          hr_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[HR Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: hrUser.id,
        actor_role: "hr",
        previous_status: "pending_hr",
        new_status: newStatus,
        comments: notes || `Approved by HR, routed to ${execLevel.toUpperCase()}`,
      });

      console.log(`[HR Approve] ✅ Request ${requestId} approved, sent to ${execLevel.toUpperCase()}`);
      
      return NextResponse.json({
        ok: true,
        message: message,
      });

    } else if (action === "reject") {
      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: hrUser.id,
          rejection_reason: notes || "Rejected by HR",
          rejection_stage: "hr",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[HR Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: hrUser.id,
        actor_role: "hr",
        previous_status: "pending_hr",
        new_status: "rejected",
        comments: notes || "Rejected by HR",
      });

      console.log(`[HR Reject] ❌ Request ${requestId} rejected`);
      
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
    console.error("[HR Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
