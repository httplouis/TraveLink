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

    // Get executive user
    const { data: execUser, error: execError } = await supabase
      .from("users")
      .select("id, name, email")
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

    if (action === "approve") {
      // Approve request - set status to 'approved' (final approval)
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "approved",
          exec_approved_at: getPhilippineTimestamp(),
          exec_approved_by: execUser.id,
          exec_signature: signature,
          exec_comments: notes || null,
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Failed to approve request:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: execUser.id,
        previous_status: "pending_exec",
        new_status: "approved",
        comments: notes || "Approved by Executive",
      });

      return NextResponse.json({ ok: true, message: "Request approved successfully" });
    } else if (action === "reject") {
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
        previous_status: "pending_exec",
        new_status: "rejected",
        comments: notes || "Rejected by Executive",
      });

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
