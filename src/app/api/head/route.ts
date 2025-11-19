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
    // ALSO get requests from child departments (where request's department has parent_department_id = this head's department)
    // This allows parent heads (SVP) to see requests from child departments (e.g., CCMS → OVPAR)
    // ALSO get requests with multiple requesters where at least one requester is from this head's department
    // IMPORTANT: Exclude requests where the requester IS the current head (they shouldn't see their own requests)
    
    // Query 1: Direct department requests (pending_head or pending_parent_head for this department)
    const { data: directRequests, error: directError } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, name, email, profile_picture, avatar_url, position_title),
        department:departments!requests_department_id_fkey(id, name, code, parent_department_id)
      `)
      .in("status", ["pending_head", "pending_parent_head"])
      .eq("department_id", profile.department_id)
      .neq("requester_id", profile.id) // Exclude requests where requester is the current head
      .order("created_at", { ascending: false })
      .limit(50);

    // Query 2: Child department requests (for parent heads like SVP)
    // Get requests where the request's department has parent_department_id = this head's department
    // This allows SVP Academics to see CCMS requests when status is pending_parent_head
    let childDeptRequests: any[] = [];
    let childDeptError: any = null;
    
    try {
      // First, get all departments that have this head's department as parent
      const { data: childDepartments } = await supabase
        .from("departments")
        .select("id")
        .eq("parent_department_id", profile.department_id);
      
      if (childDepartments && childDepartments.length > 0) {
        const childDeptIds = childDepartments.map((d: any) => d.id);
        
        // Get requests from child departments with pending_parent_head status
        const { data: childRequests, error: childError } = await supabase
          .from("requests")
          .select(`
            *,
            requester:users!requests_requester_id_fkey(id, name, email, profile_picture, avatar_url, position_title),
            department:departments!requests_department_id_fkey(id, name, code, parent_department_id)
          `)
          .in("status", ["pending_parent_head"])
          .in("department_id", childDeptIds)
          .neq("requester_id", profile.id) // Exclude requests where requester is the current head
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!childError && childRequests) {
          childDeptRequests = childRequests;
          console.log(`[GET /api/head] Found ${childDeptRequests.length} requests from child departments`);
        } else if (childError) {
          childDeptError = childError;
          console.error("[GET /api/head] Error fetching child department requests:", childError);
        }
      }
    } catch (err: any) {
      console.error("[GET /api/head] Exception fetching child department requests:", err);
      childDeptError = err;
    }

    // Also get requests with multiple requesters from requester_invitations where this head's department is involved
    // Use a safer approach: first get the request IDs, then fetch the requests separately
    let multiDeptRequestList: any[] = [];
    let multiDeptError: any = null;
    
    try {
      const { data: requesterInvitations, error: invError } = await supabase
        .from("requester_invitations")
        .select("request_id")
        .eq("department_id", profile.department_id)
        .eq("status", "confirmed");
      
      if (invError) {
        console.error("[GET /api/head] Error fetching requester invitations:", invError);
        multiDeptError = invError;
      } else if (requesterInvitations && requesterInvitations.length > 0) {
        const requestIds = requesterInvitations.map((inv: any) => inv.request_id).filter(Boolean);
        
        if (requestIds.length > 0) {
          const { data: multiDeptRequests, error: reqError } = await supabase
            .from("requests")
            .select(`
              *,
              requester:users!requests_requester_id_fkey(id, name, email, profile_picture, avatar_url, position_title),
              department:departments!requests_department_id_fkey(id, name, code)
            `)
            .in("id", requestIds)
            .in("status", ["pending_head", "pending_parent_head"])
            .neq("requester_id", profile.id) // Exclude requests where requester is the current head
            .order("created_at", { ascending: false })
            .limit(50);
          
          if (reqError) {
            console.error("[GET /api/head] Error fetching multi-department requests:", reqError);
            multiDeptError = reqError;
          } else {
            multiDeptRequestList = multiDeptRequests || [];
          }
        }
      }
    } catch (err: any) {
      console.error("[GET /api/head] Exception fetching multi-department requests:", err);
      multiDeptError = err;
    }

    // Combine all sets of requests, avoiding duplicates
    const directRequestIds = new Set((directRequests || []).map((r: any) => r.id));
    const uniqueMultiDeptRequests = multiDeptRequestList.filter((r: any) => r && !directRequestIds.has(r.id));
    
    // Also exclude child department requests that are already in direct requests
    const allRequestIds = new Set([
      ...(directRequests || []).map((r: any) => r.id),
      ...uniqueMultiDeptRequests.map((r: any) => r.id)
    ]);
    const uniqueChildDeptRequests = childDeptRequests.filter((r: any) => r && !allRequestIds.has(r.id));
    
    const data = [...(directRequests || []), ...uniqueMultiDeptRequests, ...uniqueChildDeptRequests];
    const error = directError || multiDeptError || childDeptError;

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

    // Handle errors gracefully - if multi-dept query fails, still return direct requests
    if (directError) {
      console.error("[GET /api/head] Direct requests query error:", directError);
      // If direct requests fail, return error
      return NextResponse.json({ ok: false, error: directError.message }, { status: 500 });
    }
    
    // If multi-dept query fails, log but don't fail the entire request
    // Just return the direct requests
    if (multiDeptError) {
      console.warn("[GET /api/head] Multi-department query failed (non-critical):", multiDeptError);
      // Continue with just direct requests
    }

    console.log(`[GET /api/head] Found ${data?.length || 0} pending requests (${directRequests?.length || 0} direct, ${uniqueMultiDeptRequests.length} multi-dept)`);
    
    // Additional debug: Log all request IDs and requester info
    if (data && data.length > 0) {
      console.log(`[GET /api/head] Request IDs:`, data.map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        requester_id: r.requester_id,
        has_requester: !!r.requester,
        requester_name: r.requester?.name || r.requester_name || 'Unknown'
      })));
    }

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

    // Verify user is head of this department OR parent head of child department OR request has multiple requesters
    // For parent heads (SVP), they can approve requests from child departments when status is pending_parent_head
    let isAuthorized = request.department_id === profile.department_id;
    
    if (!isAuthorized && request.status === "pending_parent_head") {
      // Check if this head is the parent head of the request's department
      const requestDept = request.department as any;
      if (requestDept?.parent_department_id === profile.department_id) {
        isAuthorized = true;
        console.log(`[PATCH /api/head] Parent head authorization: ${profile.id} is parent of ${request.department_id}`);
      }
    }
    
    if (!isAuthorized) {
      // Check if this request has multiple requesters and this head's department is involved
      const { data: requesterInvitations } = await supabase
        .from("requester_invitations")
        .select("department_id, status")
        .eq("request_id", id)
        .eq("department_id", profile.department_id)
        .eq("status", "confirmed")
        .limit(1);
      
      if (requesterInvitations && requesterInvitations.length > 0) {
        isAuthorized = true;
        console.log(`[PATCH /api/head] Multi-department request authorized for head ${profile.id}`);
      }
    }
    
    if (!isAuthorized) {
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
        // Send to specific approver - fetch user's actual role to determine correct status
        try {
          const { data: approverUser } = await supabase
            .from("users")
            .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
            .eq("id", next_approver_id)
            .single();
          
          if (approverUser) {
            // Determine status based on user's actual role
            if (approverUser.is_admin || approverUser.role === "admin") {
              nextStatus = "pending_admin";
              nextApproverRole = "admin";
            } else if (approverUser.is_vp || approverUser.role === "exec" || approverUser.exec_type?.startsWith("vp_") || approverUser.exec_type?.startsWith("svp_")) {
              nextStatus = "pending_exec";
              nextApproverRole = "vp";
            } else if (approverUser.is_president || approverUser.exec_type === "president") {
              nextStatus = "pending_exec";
              nextApproverRole = "president";
            } else if (approverUser.is_hr || approverUser.role === "hr") {
              nextStatus = "pending_hr";
              nextApproverRole = "hr";
            } else if (approverUser.is_comptroller || approverUser.role === "comptroller") {
              nextStatus = "pending_comptroller";
              nextApproverRole = "comptroller";
            } else if (approverUser.is_head || approverUser.role === "head") {
              // Check if this is a parent head
              const hasParentDepartment = !!(request.department as any)?.parent_department_id;
              if (hasParentDepartment && approverUser.department_id === (request.department as any)?.parent_department_id) {
                nextStatus = "pending_parent_head";
              } else {
                nextStatus = "pending_head";
              }
              nextApproverRole = "head";
            } else {
              // Unknown role - use role from selection or default to admin
              if (next_approver_role === "admin") {
                nextStatus = "pending_admin";
                nextApproverRole = "admin";
              } else if (next_approver_role === "vp") {
                nextStatus = "pending_exec";
                nextApproverRole = "vp";
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
            }
          } else {
            // User not found - use role from selection or default
            if (next_approver_role === "admin") {
              nextStatus = "pending_admin";
              nextApproverRole = "admin";
            } else if (next_approver_role === "vp") {
              nextStatus = "pending_exec";
              nextApproverRole = "vp";
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
          }
        } catch (err) {
          console.error("[PATCH /api/head] Error fetching approver user:", err);
          // Fallback to role-based logic
          if (next_approver_role === "admin") {
            nextStatus = "pending_admin";
            nextApproverRole = "admin";
          } else if (next_approver_role === "vp") {
            nextStatus = "pending_exec";
            nextApproverRole = "vp";
          } else {
            const hasParentDepartment = !!(request.department as any)?.parent_department_id;
            nextStatus = WorkflowEngine.getNextStatus(
              request.status,
              request.requester_is_head || false,
              request.has_budget || false,
              hasParentDepartment
            );
            nextApproverRole = WorkflowEngine.getApproverRole(nextStatus) || "admin";
          }
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
        // Store approver ID in workflow_metadata based on their role
        const workflowMetadata: any = request.workflow_metadata || {};
        workflowMetadata.next_approver_id = next_approver_id;
        workflowMetadata.next_approver_role = nextApproverRole;
        
        // Store role-specific IDs for inbox filtering
        // Note: Don't set next_admin_id, next_hr_id, or next_comptroller_id - allow all users in those roles to see it
        if (nextApproverRole === "admin") {
          // Don't set next_admin_id - allow all admins to see it
          // workflowMetadata.next_admin_id = next_approver_id;
        } else if (nextApproverRole === "vp") {
          workflowMetadata.next_vp_id = next_approver_id;
        } else if (nextApproverRole === "president") {
          workflowMetadata.next_president_id = next_approver_id;
        } else if (nextApproverRole === "hr") {
          // Don't set next_hr_id - allow all HRs to see it
          // workflowMetadata.next_hr_id = next_approver_id;
        } else if (nextApproverRole === "comptroller") {
          // Don't set next_comptroller_id - allow all comptrollers to see it
          // workflowMetadata.next_comptroller_id = next_approver_id;
        } else if (nextApproverRole === "head") {
          workflowMetadata.next_head_id = next_approver_id;
        }
        
        updateData.workflow_metadata = workflowMetadata;
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
        profile_id: profile.id,
        workflow_metadata: updateData.workflow_metadata,
        next_vp_id: updateData.workflow_metadata?.next_vp_id,
        next_approver_role: updateData.workflow_metadata?.next_approver_role
      });

      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("[PATCH /api/head] Update error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }
      
      // Verify the update - check if workflow_metadata was saved correctly
      const { data: verifyData, error: verifyError } = await supabase
        .from("requests")
        .select("id, status, head_approved_by, parent_head_approved_by, workflow_metadata")
        .eq("id", id)
        .single();
      
      console.log(`[PATCH /api/head] Verification after update:`, {
        id: verifyData?.id,
        status: verifyData?.status,
        workflow_metadata: verifyData?.workflow_metadata,
        next_vp_id: verifyData?.workflow_metadata?.next_vp_id,
        next_admin_id: verifyData?.workflow_metadata?.next_admin_id,
        verifyError
      });
      
      // If workflow_metadata was supposed to be set but isn't, log a warning
      if (updateData.workflow_metadata && (!verifyData?.workflow_metadata || Object.keys(verifyData.workflow_metadata).length === 0)) {
        console.error(`[PATCH /api/head] ⚠️ WARNING: workflow_metadata was not saved!`, {
          expected: updateData.workflow_metadata,
          actual: verifyData?.workflow_metadata
        });
      }

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
          approval_time: now,
          department_id: profile.department_id, // Track which department's head approved (for multi-department requests)
          is_multi_department: !!(request.department_id !== profile.department_id) // Flag if this is a multi-department approval
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

        // If request goes to admin (pending_admin), notify ALL admins
        if (nextStatus === "pending_admin") {
          console.log("[PATCH /api/head] 📧 Notifying all admins about new pending request");
          
          // Find all active admin users
          const { data: admins, error: adminsError } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("role", "admin")
            .eq("is_admin", true)
            .eq("status", "active");

          if (adminsError) {
            console.error("[PATCH /api/head] ❌ Failed to fetch admins:", adminsError);
          } else if (admins && admins.length > 0) {
            console.log(`[PATCH /api/head] ✅ Found ${admins.length} admin(s) to notify`);
            
            // Get requester name for notification
            const requestingPersonName = request.requester_name || request.requester?.name || "Requester";
            
            // Notify each admin
            const adminNotifications = admins.map((admin: any) =>
              createNotification({
                user_id: admin.id,
                notification_type: "request_pending_signature",
                title: "New Request Requires Review",
                message: `A travel order request ${request.request_number || ''} from ${requestingPersonName} requires your review.`,
                related_type: "request",
                related_id: id,
                action_url: `/admin/requests?view=${id}`,
                action_label: "Review Request",
                priority: "high",
              })
            );

            await Promise.allSettled(adminNotifications);
            console.log("[PATCH /api/head] ✅ Admin notifications sent");
          } else {
            console.warn("[PATCH /api/head] ⚠️ No active admins found to notify");
          }
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
