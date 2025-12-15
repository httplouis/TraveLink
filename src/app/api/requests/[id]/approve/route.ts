// src/app/api/requests/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { comments, signature } = await req.json();
    
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;
    
    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[POST /api/requests/[id]/approve] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }
    
    // Use regular client for auth (NOT service role - it doesn't have session info)
    const authSupabase = await createSupabaseServerClient(false);
    // Use service role for database operations
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
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

    // Check if user can approve at current stage
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "comptroller@mseuf.edu.ph"];
    const isAdmin = adminEmails.includes(profile.email);

    const canApprove = WorkflowEngine.canApprove(
      "faculty", // Default role
      profile.is_head,
      profile.is_hr,
      profile.is_exec,
      isAdmin,
      request.status
    );

    if (!canApprove) {
      return NextResponse.json({ 
        ok: false, 
        error: "You are not authorized to approve this request at its current stage" 
      }, { status: 403 });
    }

    // Determine next status
    const nextStatus = WorkflowEngine.getNextStatus(
      request.status,
      request.requester_is_head,
      request.has_budget
    );

    // Build update object based on current status
    const now = new Date().toISOString();
    const updateData: any = {
      status: nextStatus,
      current_approver_role: WorkflowEngine.getApproverRole(nextStatus),
    };

    // Set appropriate approval timestamp and details
    switch (request.status) {
      case "pending_head":
        updateData.head_approved_at = now;
        updateData.head_approved_by = profile.id;
        updateData.head_signature = signature;
        updateData.head_comments = comments;
        break;
        
      case "pending_admin":
        updateData.admin_processed_at = now;
        updateData.admin_processed_by = profile.id;
        updateData.admin_comments = comments;
        break;
        
      case "pending_comptroller":
        updateData.comptroller_approved_at = now;
        updateData.comptroller_approved_by = profile.id;
        updateData.comptroller_comments = comments;
        break;
        
      case "pending_hr":
        updateData.hr_approved_at = now;
        updateData.hr_approved_by = profile.id;
        updateData.hr_signature = signature;
        updateData.hr_comments = comments;
        break;
        
      case "pending_exec":
        updateData.exec_approved_at = now;
        updateData.exec_approved_by = profile.id;
        updateData.exec_signature = signature;
        updateData.exec_comments = comments;
        if (nextStatus === "approved") {
          updateData.final_approved_at = now;
        }
        break;
    }

    // Update request
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("[/api/requests/[id]/approve] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log in history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "approved",
      actor_id: profile.id,
      actor_role: request.current_approver_role,
      previous_status: request.status,
      new_status: nextStatus,
      comments: comments || "Approved",
      metadata: { signature: signature ? "provided" : "none" },
    });

    console.log("[/api/requests/[id]/approve] Request approved:", requestId, "New status:", nextStatus);

    return NextResponse.json({ 
      ok: true, 
      data: updated,
      message: nextStatus === "approved" ? "Request fully approved!" : "Request approved and forwarded to next approver"
    });

  } catch (error: any) {
    console.error("[/api/requests/[id]/approve] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
