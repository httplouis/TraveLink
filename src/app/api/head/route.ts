// src/app/api/head/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { getPhilippineTimestamp } from "@/lib/datetime";
import { createNotification } from "@/lib/notifications/helpers";

// GET /api/head  → list all pending_head for THIS head's departments
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error("[GET /api/head] Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "Profile not found: " + profileError.message }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.is_head) {
      console.log("[GET /api/head] User is not a head, returning empty list");
      return NextResponse.json({ ok: true, data: [] });
    }

    if (!profile.department_id) {
      console.log("[GET /api/head] Head has no department_id, returning empty list");
      return NextResponse.json({ ok: true, data: [] });
    }

    console.log(`[GET /api/head] Fetching requests for head: ${profile.email}, dept: ${profile.department_id}`);

    // Get requests for THIS head's department with status = pending_head or pending_parent_head
    // Also fetch request_history to get receive_time
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email, profile_picture, avatar_url, position_title),
        department:departments!department_id(id, name, code)
      `)
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", profile.department_id)
      .order("created_at", { ascending: false })
      .limit(50); // Limit to 50 most recent requests

    // Debug: Log profile picture data from database
    if (data && data.length > 0) {
      console.log("[GET /api/head] Sample requester data (first request):", {
        requester_id: data[0].requester_id,
        requester: data[0].requester,
        profile_picture: data[0].requester?.profile_picture,
        avatar_url: data[0].requester?.avatar_url,
        hasRequester: !!data[0].requester
      });
    }

    // Fetch request_history to get receive_time for each request
    if (data && data.length > 0) {
      const requestIds = data.map(r => r.id);
      const { data: historyData } = await supabase
        .from("request_history")
        .select("request_id, metadata, created_at")
        .in("request_id", requestIds)
        .eq("actor_role", "head")
        .order("created_at", { ascending: false });

      // Map receive_time to requests
      if (historyData) {
        const historyMap = new Map();
        historyData.forEach((h: any) => {
          if (!historyMap.has(h.request_id)) {
            const receiveTime = h.metadata?.receive_time || h.created_at;
            historyMap.set(h.request_id, receiveTime);
          }
        });

        // Add receive_time to each request
        data.forEach((req: any) => {
          req.received_at = historyMap.get(req.id) || req.created_at;
        });
      }
    }

    if (error) {
      console.error("[GET /api/head] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[GET /api/head] Found ${data?.length || 0} pending requests`);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[GET /api/head] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/head  → approve / reject using Workflow Engine
export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_head) {
      return NextResponse.json({ ok: false, error: "Not authorized as head" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      action = "approve",
      signature = "",
      comments = "",
      next_approver_id = null,
      next_approver_role = null,
      return_reason = null,
    } = body as {
      id: string;
      action?: "approve" | "reject";
      signature?: string;
      comments?: string;
      next_approver_id?: string | null;
      next_approver_role?: string | null;
      return_reason?: string | null;
    };

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing request id" }, { status: 400 });
    }

    // MANDATORY: Notes/comments are required (minimum 10 characters)
    if (action === "approve" && (!comments || comments.trim().length < 10)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Comments are mandatory and must be at least 10 characters long" 
      }, { status: 400 });
    }

    // Get request
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("*, department:departments!department_id(id, code, name, parent_department_id)")
      .eq("id", id)
      .single();

    if (fetchError || !request) {
      console.error("[PATCH /api/head] Request fetch error:", fetchError);
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Verify status is pending_head or pending_parent_head
    if (request.status !== "pending_head" && request.status !== "pending_parent_head") {
      return NextResponse.json({ 
        ok: false, 
        error: `Request is in ${request.status} status, not pending head approval` 
      }, { status: 400 });
    }

    // Verify user is head of this department
    if (request.department_id !== profile.department_id) {
      return NextResponse.json({ ok: false, error: "Not authorized for this department" }, { status: 403 });
    }

    const now = getPhilippineTimestamp();

    if (action === "approve") {
      // Handle approver selection logic
      let nextStatus: string;
      let nextApproverRole: string;
      let returnInfo: any = {}; // Store return info separately
      
      if (next_approver_role === "requester") {
        // Return to requester - set back to draft so they can edit and resubmit
        nextStatus = "draft";
        nextApproverRole = "requester";
        
        // Store return information
        const returnNote = return_reason 
          ? `Returned to requester: ${return_reason}. ${comments}`
          : `Returned to requester for revision. ${comments}`;
        returnInfo.head_comments = returnNote;
        returnInfo.returned_to_requester_at = now;
        returnInfo.returned_by = profile.id;
        returnInfo.return_reason = return_reason;
      } else if (next_approver_id && next_approver_role) {
        // Send to specific approver
        if (next_approver_role === "admin") {
          nextStatus = "pending_admin";
          nextApproverRole = "admin";
        } else if (next_approver_role === "vp") {
          // Head is sending directly to VP (skip admin/comptroller)
          nextStatus = "pending_exec";
          nextApproverRole = "vp";
          // Store which VP to send to
          updateData.next_vp_id = next_approver_id;
        } else {
          // Default workflow
          const hasParentDepartment = !!(request.department as any)?.parent_department_id;
          nextStatus = WorkflowEngine.getNextStatus(
            request.status,
            request.requester_is_head || false,
            request.has_budget || false,
            hasParentDepartment
          );
          nextApproverRole = WorkflowEngine.getApproverRole(nextStatus) || "admin";
        }
      } else {
        // Default workflow
        const hasParentDepartment = !!(request.department as any)?.parent_department_id;
        nextStatus = WorkflowEngine.getNextStatus(
          request.status,
          request.requester_is_head || false,
          request.has_budget || false,
          hasParentDepartment
        );
        nextApproverRole = WorkflowEngine.getApproverRole(nextStatus) || "admin";
      }

      console.log(`[PATCH /api/head] Approving request ${id}: ${request.status} → ${nextStatus}`);

      // Update request with approval
      const updateData: any = {
        status: nextStatus,
        current_approver_role: nextApproverRole,
        ...returnInfo, // Include return info if returning to requester
      };
      
      // Set next approver if specified (not returning to requester)
      if (next_approver_id && next_approver_role && next_approver_role !== "requester") {
        if (next_approver_role === "admin") {
          updateData.next_admin_id = next_approver_id;
        } else if (next_approver_role === "vp") {
          // Head is sending directly to VP
          updateData.next_vp_id = next_approver_id;
        }
      }

      // Set appropriate approval fields based on current status
      if (request.status === "pending_head") {
        updateData.head_approved_at = now;
        updateData.head_approved_by = profile.id;
        updateData.head_signature = signature;
        updateData.head_comments = comments;
      } else if (request.status === "pending_parent_head") {
        updateData.parent_head_approved_at = now;
        updateData.parent_head_approved_by = profile.id;
        updateData.parent_head_signature = signature;
        updateData.parent_head_comments = comments;
      }

      console.log(`[PATCH /api/head] Updating request with:`, {
        id,
        updateData,
        profile_id: profile.id
      });

      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("[PATCH /api/head] Update error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }
      
      // Verify the update
      const { data: verifyData } = await supabase
        .from("requests")
        .select("id, status, head_approved_by, parent_head_approved_by")
        .eq("id", id)
        .single();
      console.log(`[PATCH /api/head] Verification after update:`, verifyData);

      // Log in history with complete tracking
      await supabase.from("request_history").insert({
        request_id: id,
        action: "approved",
        actor_id: profile.id,
        actor_role: "head",
        previous_status: request.status,
        new_status: nextStatus,
        comments: comments || "Approved by department head",
        metadata: {
          signature_at: now,
          signature_time: now, // Track signature time
          receive_time: request.created_at || now, // Track when request was received by head
          submission_time: request.created_at || null, // Track original submission time
          sent_to: nextApproverRole,
          sent_to_id: next_approver_id || null,
          return_reason: return_reason || null,
          approval_time: now
        }
      });

      // Create notifications
      try {
        // Notify requester that request was approved by head
        if (request.requester_id) {
          await createNotification({
            user_id: request.requester_id,
            notification_type: "request_approved",
            title: "Request Approved by Department Head",
            message: `Your travel order request ${request.request_number || ''} has been approved by the department head and is now being processed.`,
            related_type: "request",
            related_id: id,
            action_url: `/user/submissions?view=${id}`,
            action_label: "View Request",
            priority: "normal",
          });
        }

        // Notify submitter (if different from requester) that request was approved
        if (request.submitted_by_user_id && request.submitted_by_user_id !== request.requester_id) {
          await createNotification({
            user_id: request.submitted_by_user_id,
            notification_type: "request_status_change",
            title: "Request Approved",
            message: `The travel order request ${request.request_number || ''} you submitted has been approved by the department head.`,
            related_type: "request",
            related_id: id,
            action_url: `/user/submissions?view=${id}`,
            action_label: "View Request",
            priority: "normal",
          });
        }

        // Notify next approver (if specified)
        if (next_approver_id && next_approver_role && next_approver_role !== "requester") {
          await createNotification({
            user_id: next_approver_id,
            notification_type: "request_pending_signature",
            title: "Request Requires Your Approval",
            message: `A travel order request ${request.request_number || ''} has been sent to you for approval.`,
            related_type: "request",
            related_id: id,
            action_url: next_approver_role === "admin" ? `/admin/requests?view=${id}` : `/inbox?view=${id}`,
            action_label: "Review Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[PATCH /api/head] Failed to create notifications:", notifError);
        // Don't fail the request if notifications fail
      }

      console.log(`[PATCH /api/head] Success! Next status: ${nextStatus}`);

      return NextResponse.json({ ok: true, nextStatus, data: { status: nextStatus } });
      
    } else {
      // Reject
      console.log(`[PATCH /api/head] Rejecting request ${id}`);

      const now = getPhilippineTimestamp();
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: now,
          rejected_by: profile.id,
          rejection_reason: comments || "Rejected by department head",
          rejection_stage: request.status,
          head_comments: comments,
        })
        .eq("id", id);

      if (updateError) {
        console.error("[PATCH /api/head] Reject error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log in history
      await supabase.from("request_history").insert({
        request_id: id,
        action: "rejected",
        actor_id: profile.id,
        actor_role: "head",
        previous_status: request.status,
        new_status: "rejected",
        comments: comments || "Rejected by department head",
      });

      // Create notifications
      try {
        // Notify requester that request was rejected
        if (request.requester_id) {
          await createNotification({
            user_id: request.requester_id,
            notification_type: "request_rejected",
            title: "Request Rejected",
            message: `Your travel order request ${request.request_number || ''} has been rejected by the department head.${comments ? ` Reason: ${comments}` : ''}`,
            related_type: "request",
            related_id: id,
            action_url: `/user/submissions?view=${id}`,
            action_label: "View Request",
            priority: "high",
          });
        }

        // Notify submitter (if different from requester) that request was rejected
        if (request.submitted_by_user_id && request.submitted_by_user_id !== request.requester_id) {
          await createNotification({
            user_id: request.submitted_by_user_id,
            notification_type: "request_rejected",
            title: "Request Rejected",
            message: `The travel order request ${request.request_number || ''} you submitted has been rejected by the department head.${comments ? ` Reason: ${comments}` : ''}`,
            related_type: "request",
            related_id: id,
            action_url: `/user/submissions?view=${id}`,
            action_label: "View Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[PATCH /api/head] Failed to create notifications:", notifError);
        // Don't fail the request if notifications fail
      }

      return NextResponse.json({ ok: true, data: { status: "rejected" } });
    }
  } catch (err: any) {
    console.error("[PATCH /api/head] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
