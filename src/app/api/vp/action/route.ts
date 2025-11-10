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

    // Get VP user info
    const { data: vpUser } = await supabase
      .from("users")
      .select("id, name, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!vpUser?.is_vp) {
      return NextResponse.json({ ok: false, error: "VP role required" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[VP Action] ${action} by ${vpUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Routing logic: ALL VP-approved requests go to President
      // President is the final approver for all requests
      const newStatus = "pending_president";

      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: newStatus,
          current_approver_role: "president",
          exec_level: "president",
          vp_approved_at: getPhilippineTimestamp(),
          vp_approved_by: vpUser.id,
          vp_signature: signature || null,
          vp_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: "pending_vp",
        new_status: newStatus,
        comments: notes || "Approved by VP, forwarded to President",
      });

      console.log(`[VP Approve] ✅ Request ${requestId} approved, sent to President`);
      
      return NextResponse.json({
        ok: true,
        message: "Approved and sent to President",
      });

    } else if (action === "reject") {
      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: vpUser.id,
          rejection_reason: notes || "Rejected by VP",
          rejection_stage: "vp",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: "pending_vp",
        new_status: "rejected",
        comments: notes || "Rejected by VP",
      });

      console.log(`[VP Reject] ❌ Request ${requestId} rejected`);
      
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
    console.error("[VP Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
