// src/app/api/requests/[id]/reject/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await req.json();
    const requestId = params.id;
    
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ 
        ok: false, 
        error: "Rejection reason is required" 
      }, { status: 400 });
    }
    
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, is_head, is_hr, is_exec")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get request
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user can reject at current stage
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "comptroller@mseuf.edu.ph"];
    const isAdmin = adminEmails.includes(profile.email);

    const canApprove = WorkflowEngine.canApprove(
      "faculty",
      profile.is_head,
      profile.is_hr,
      profile.is_exec,
      isAdmin,
      request.status
    );

    if (!canApprove) {
      return NextResponse.json({ 
        ok: false, 
        error: "You are not authorized to reject this request at its current stage" 
      }, { status: 403 });
    }

    // Update request to rejected
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        status: "rejected",
        rejected_at: now,
        rejected_by: profile.id,
        rejection_reason: reason,
        rejection_stage: request.status,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("[/api/requests/[id]/reject] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log in history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "rejected",
      actor_id: profile.id,
      actor_role: request.current_approver_role,
      previous_status: request.status,
      new_status: "rejected",
      comments: reason,
      metadata: { rejection_stage: request.status },
    });

    console.log("[/api/requests/[id]/reject] Request rejected:", requestId, "By:", profile.email);

    return NextResponse.json({ 
      ok: true, 
      data: updated,
      message: "Request rejected"
    });

  } catch (error: any) {
    console.error("[/api/requests/[id]/reject] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
