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

    // Create notifications
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");
      const approverRole = request.current_approver_role || "Approver";
      const approverRoleLabel = approverRole.charAt(0).toUpperCase() + approverRole.slice(1);
      
      // Notify requester
      if (request.requester_id) {
        const isFinalApproval = nextStatus === "approved";
        await createNotification({
          user_id: request.requester_id,
          notification_type: isFinalApproval ? "request_approved" : "request_status_change",
          title: isFinalApproval ? "Request Fully Approved" : `Request Approved by ${approverRoleLabel}`,
          message: isFinalApproval 
            ? `Your travel order request ${request.request_number || ""} has been fully approved!`
            : `Your travel order request ${request.request_number || ""} has been approved by ${approverRoleLabel} and is moving to the next stage.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/submissions?view=${requestId}`,
          action_label: "View Request",
          priority: isFinalApproval ? "high" : "normal",
        });
      }

      // Notify next approvers based on next status
      const nextApproverRole = WorkflowEngine.getApproverRole(nextStatus) as string;
      if (nextApproverRole && nextStatus !== "approved") {
        let roleFilter: any = {};
        let inboxUrl = "/inbox";
        
        if (nextApproverRole === "admin") {
          roleFilter = { is_admin: true };
          inboxUrl = `/admin/inbox?view=${requestId}`;
        } else if (nextApproverRole === "comptroller") {
          roleFilter = { is_comptroller: true };
          inboxUrl = `/comptroller/inbox?view=${requestId}`;
        } else if (nextApproverRole === "hr") {
          roleFilter = { is_hr: true };
          inboxUrl = `/hr/inbox?view=${requestId}`;
        } else if (nextApproverRole === "vp") {
          roleFilter = { is_vp: true };
          inboxUrl = `/vp/inbox?view=${requestId}`;
        } else if (nextApproverRole === "president" || nextApproverRole === "exec") {
          roleFilter = { is_president: true };
          inboxUrl = `/president/inbox?view=${requestId}`;
        }

        if (Object.keys(roleFilter).length > 0) {
          const { data: nextApprovers } = await supabase
            .from("users")
            .select("id")
            .match(roleFilter)
            .eq("status", "active");

          if (nextApprovers && nextApprovers.length > 0) {
            for (const approver of nextApprovers) {
              await createNotification({
                user_id: approver.id,
                notification_type: "request_pending_signature",
                title: `New Request from ${approverRoleLabel}`,
                message: `Request ${request.request_number || ""} has been approved by ${approverRoleLabel} and forwarded to you for review.`,
                related_type: "request",
                related_id: requestId,
                action_url: inboxUrl,
                action_label: "Review Request",
                priority: "high",
              });
            }
          }
        }
      }
    } catch (notifError: any) {
      console.error("[/api/requests/[id]/approve] Failed to create notifications:", notifError);
    }

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
