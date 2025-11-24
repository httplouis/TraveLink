// src/app/api/requests/[id]/nudge/route.ts
/**
 * POST /api/requests/[id]/nudge
 * Send reminder notification to current approver
 * Rate limited: max 1 nudge per 24 hours per request
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { id: requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get request
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        status,
        requester_id,
        created_at,
        workflow_metadata,
        requester:requester_id(id, name, email)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user is the requester
    if (request.requester_id !== profile.id) {
      return NextResponse.json({ 
        ok: false, 
        error: "Only the requester can send nudges" 
      }, { status: 403 });
    }

    // Check if request is in a pending state
    if (!request.status.startsWith("pending_")) {
      return NextResponse.json({ 
        ok: false, 
        error: "Can only nudge for pending requests" 
      }, { status: 400 });
    }

    // Check rate limit: max 1 nudge per 24 hours
    const now = getPhilippineTimestamp();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: recentNudges } = await supabase
      .from("request_history")
      .select("created_at")
      .eq("request_id", requestId)
      .eq("action", "nudged")
      .eq("actor_id", profile.id)
      .gte("created_at", oneDayAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentNudges && recentNudges.length > 0) {
      return NextResponse.json({ 
        ok: false, 
        error: "You can only send one nudge per 24 hours. Please wait before sending another reminder." 
      }, { status: 429 });
    }

    // Determine current approver based on status
    let approverId: string | null = null;
    let approverRole: string = "";
    let approverName: string = "";
    let inboxUrl: string = "";

    const workflowMetadata = typeof request.workflow_metadata === 'string' 
      ? JSON.parse(request.workflow_metadata || '{}')
      : (request.workflow_metadata || {});

    switch (request.status) {
      case "pending_head":
        // Get department head
        const { data: deptHead } = await supabase
          .from("department_heads")
          .select("user_id, user:user_id(id, name)")
          .eq("department_id", workflowMetadata.department_id || request.requester?.department_id)
          .eq("is_active", true)
          .single();
        
        if (deptHead) {
          approverId = deptHead.user_id;
          approverRole = "Department Head";
          approverName = (deptHead.user as any)?.name || "Department Head";
          inboxUrl = "/head/inbox";
        }
        break;

      case "pending_admin":
        approverId = workflowMetadata.next_admin_id || null;
        approverRole = "Admin";
        approverName = "Admin";
        inboxUrl = "/admin/inbox";
        break;

      case "pending_comptroller":
        approverRole = "Comptroller";
        approverName = "Comptroller";
        inboxUrl = "/comptroller/inbox";
        break;

      case "pending_hr":
        approverRole = "HR";
        approverName = "HR";
        inboxUrl = "/hr/inbox";
        break;

      case "pending_exec":
      case "pending_vp":
      case "pending_president":
        approverId = workflowMetadata.next_vp_id || workflowMetadata.next_president_id || null;
        approverRole = request.status === "pending_president" ? "President" : "VP";
        approverName = approverRole;
        inboxUrl = request.status === "pending_president" ? "/president/inbox" : "/vp/inbox";
        break;
    }

    if (!approverId && approverRole !== "Comptroller" && approverRole !== "HR") {
      // Try to find approver by role
      const roleMap: Record<string, string> = {
        "Comptroller": "comptroller",
        "HR": "hr",
        "VP": "vp",
        "President": "president",
      };

      const { data: approvers } = await supabase
        .from("users")
        .select("id, name")
        .eq("role", roleMap[approverRole] || approverRole.toLowerCase())
        .limit(1);

      if (approvers && approvers.length > 0) {
        approverId = approvers[0].id;
        approverName = approvers[0].name;
      }
    }

    if (!approverId && approverRole !== "Comptroller" && approverRole !== "HR") {
      return NextResponse.json({ 
        ok: false, 
        error: "Could not determine current approver" 
      }, { status: 400 });
    }

    // Calculate days pending
    const requestDate = new Date(request.created_at);
    const daysPending = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create notification for approver
    const notificationTitle = "Reminder: Request Pending Your Approval";
    const notificationMessage = `Request ${request.request_number || ''} from ${(request.requester as any)?.name || 'Requester'} has been pending for ${daysPending} day${daysPending !== 1 ? 's' : ''}. Please review and take action.`;
    const priority = daysPending > 3 ? "high" : "normal";

    if (approverId) {
      await createNotification({
        user_id: approverId,
        notification_type: "request_reminder",
        title: notificationTitle,
        message: notificationMessage,
        related_type: "request",
        related_id: requestId,
        action_url: `${inboxUrl}?view=${requestId}`,
        action_label: "Review Request",
        priority: priority as any,
      });
    }

    // Log nudge action in request_history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "nudged",
      actor_id: profile.id,
      actor_role: "requester",
      previous_status: request.status,
      new_status: request.status, // Status doesn't change
      comments: `Reminder sent to ${approverRole}`,
      metadata: {
        nudged_at: now.toISOString(),
        approver_role: approverRole,
        approver_id: approverId,
        days_pending: daysPending,
      }
    });

    console.log(`[POST /api/requests/${requestId}/nudge] ✅ Nudge sent to ${approverRole} (${approverId})`);

    return NextResponse.json({ 
      ok: true, 
      message: `Reminder sent to ${approverRole}`,
      data: {
        approver_role: approverRole,
        approver_name: approverName,
        days_pending: daysPending,
      }
    });

  } catch (err: any) {
    console.error("[POST /api/requests/[id]/nudge] Unexpected error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err.message || "Internal server error" 
    }, { status: 500 });
  }
}

