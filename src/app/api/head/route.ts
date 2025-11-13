// src/app/api/head/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { getPhilippineTimestamp } from "@/lib/datetime";

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
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments!department_id(id, name, code)
      `)
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", profile.department_id)
      .order("created_at", { ascending: false })
      .limit(50); // Limit to 50 most recent requests

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

      // Log in history
      await supabase.from("request_history").insert({
        request_id: id,
        action: "approved",
        actor_id: profile.id,
        actor_role: "head",
        previous_status: request.status,
        new_status: nextStatus,
        comments: comments || "Approved by department head",
      });

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

      return NextResponse.json({ ok: true, data: { status: "rejected" } });
    }
  } catch (err: any) {
    console.error("[PATCH /api/head] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
