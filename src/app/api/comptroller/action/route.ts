// src/app/api/comptroller/action/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get comptroller user info
    const { data: comptrollerUser } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!comptrollerUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes, editedBudget } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[Comptroller Action] ${action} by ${comptrollerUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Approve and send to HR
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "pending_hr",
          current_approver_role: "hr",
          comptroller_approved_at: getPhilippineTimestamp(),
          comptroller_approved_by: comptrollerUser.id,
          comptroller_signature: signature || null,
          comptroller_comments: notes || null,
          comptroller_edited_budget: editedBudget || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: "pending_comptroller",
        new_status: "pending_hr",
        comments: notes || "Approved by comptroller",
      });

      console.log(`[Comptroller Approve] ✅ Request ${requestId} approved, sent to HR`);
      
      return NextResponse.json({
        ok: true,
        message: "Request approved and sent to HR",
      });

    } else if (action === "reject") {
      // Reject and send back to user
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejection_stage: "comptroller",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: comptrollerUser.id,
          rejection_reason: notes || "Rejected by comptroller",
          comptroller_rejected_at: getPhilippineTimestamp(),
          comptroller_rejected_by: comptrollerUser.id,
          comptroller_rejection_reason: notes || "Budget not approved",
          comptroller_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: "pending_comptroller",
        new_status: "rejected",
        comments: notes || "Rejected by comptroller",
      });

      console.log(`[Comptroller Reject] ❌ Request ${requestId} rejected, sent back to user`);
      
      return NextResponse.json({
        ok: true,
        message: "Request rejected and sent back to user",
      });

    } else if (action === "edit_budget") {
      // Just update the edited budget without changing status
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          comptroller_edited_budget: editedBudget,
          comptroller_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Edit Budget] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      console.log(`[Comptroller Edit Budget] 💰 Budget edited for request ${requestId}`);
      
      return NextResponse.json({
        ok: true,
        message: "Budget updated successfully",
      });

    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("[Comptroller Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
