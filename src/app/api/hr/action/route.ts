import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * POST /api/hr/action
 * Approve or reject a request as HR
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get HR user info
    const { data: hrUser } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!hrUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes, next_vp_id, editedBudget } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // MANDATORY: Notes are required (minimum 10 characters)
    if (action === "approve" && (!notes || notes.trim().length < 10)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Notes are mandatory and must be at least 10 characters long" 
      }, { status: 400 });
    }

    console.log(`[HR Action] ${action} by ${hrUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Get request to check requester type and parent head status
      const { data: request } = await supabase
        .from("requests")
        .select(`
          *, 
          requester:users!requester_id(role, is_head, exec_type),
          parent_head_approver:users!parent_head_approved_by(id, is_vp, exec_type, role)
        `)
        .eq("id", requestId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const requester = request.requester as any;
      const requesterIsHead = request.requester_is_head || requester?.is_head || false;
      const requesterRole = requester?.role || "faculty";
      const headIncluded = request.head_included || false;
      
      // Check if parent head (any VP) already signed - if so, skip VP stage
      // Parent head can be any of the 4 VPs (SVP Academics, VP External, etc.)
      const parentHeadSigned = !!(request.parent_head_approved_at || request.parent_head_signature);
      const parentHeadApprover = request.parent_head_approver as any;
      const parentHeadIsVP = parentHeadApprover?.is_vp === true || 
                             parentHeadApprover?.exec_type === 'vp' || 
                             parentHeadApprover?.role === 'exec';
      
      console.log(`[HR Action] Parent head signed: ${parentHeadSigned}, parent_head_approved_at: ${request.parent_head_approved_at}`);
      console.log(`[HR Action] Parent head is VP: ${parentHeadIsVP}, parent_head_approver:`, parentHeadApprover?.id);

      // Get budget threshold from system config
      const { data: thresholdConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "faculty_president_threshold")
        .single();
      
      const budgetThreshold = thresholdConfig?.value 
        ? parseFloat(thresholdConfig.value) 
        : 5000.00; // Default: ₱5,000
      
      const totalBudget = request.total_budget || 0;
      const exceedsThreshold = totalBudget >= budgetThreshold;

      // Routing logic based on requester type, parent head status, and budget:
      // - Head/Director/Dean → Must go to President (skip VP if head requester OR parent head VP signed)
      // - Parent head (any VP: SVP Academics, VP External, etc.) already signed → Skip VP, go directly to President
      //   Note: Each VP has different departments under them. For CCMS, parent head is SVP Academics.
      // - Faculty + Head → VP only (not President) - UNLESS:
      //   * Parent head VP signed → President
      //   * Budget >= threshold (5-10K) → President
      // - Faculty alone → Should not reach here (validation prevents)
      
      let newStatus: string;
      let execLevel: string;
      let approverRole: string;
      let message: string;

      // Skip VP if parent head (who is a VP) already signed
      const shouldSkipVP = parentHeadSigned && parentHeadIsVP;

      if (requesterIsHead || requesterRole === "director" || requesterRole === "dean" || shouldSkipVP) {
        // Head/Director/Dean OR parent head VP already signed → Must go to President
        // Skip VP since parent head (VP) already signed
        newStatus = "pending_exec";
        execLevel = "president";
        approverRole = "president";
        message = shouldSkipVP 
          ? `Request approved and sent to President (VP skipped - parent head VP already signed)`
          : "Request approved and sent to President";
      } else if (!requesterIsHead && headIncluded) {
        // Faculty + Head → Check budget threshold
        if (exceedsThreshold) {
          // Budget >= threshold → President
          newStatus = "pending_exec";
          execLevel = "president";
          approverRole = "president";
          message = `Request approved and sent to President (budget ₱${totalBudget.toFixed(2)} exceeds threshold ₱${budgetThreshold.toFixed(2)})`;
        } else {
          // Budget < threshold → VP only
          newStatus = "pending_exec";
          execLevel = "vp";
          approverRole = "vp";
          message = "Request approved and sent to VP";
        }
      } else {
        // Default: VP (should not happen for faculty alone)
        newStatus = "pending_exec";
        execLevel = "vp";
        approverRole = "vp";
        message = "Request approved and sent to VP";
      }

      const now = getPhilippineTimestamp();
      const updateData: any = {
        status: newStatus,
        exec_level: execLevel,
        current_approver_role: approverRole,
        hr_approved_at: now,
        hr_approved_by: hrUser.id,
        hr_signature: signature || null,
        hr_comments: notes || null,
        updated_at: now,
      };

      // Set specific VP/President if selected via choice-based sending
      const { nextApproverId, nextApproverRole } = body;
      if (nextApproverId) {
        // Fetch user's actual role to determine correct routing
        try {
          const { data: approverUser } = await supabase
            .from("users")
            .select("id, role, is_admin, is_hr, is_vp, is_president, is_head, is_comptroller, exec_type")
            .eq("id", nextApproverId)
            .single();
          
          if (approverUser) {
            // Determine approver role based on user's actual role
            if (approverUser.is_president || approverUser.exec_type === "president") {
              approverRole = "president";
              updateData.next_president_id = nextApproverId;
            } else if (approverUser.is_vp || approverUser.role === "exec" || approverUser.exec_type?.startsWith("vp_") || approverUser.exec_type?.startsWith("svp_")) {
              approverRole = "vp";
              updateData.next_vp_id = nextApproverId;
            } else if (approverUser.is_admin || approverUser.role === "admin") {
              approverRole = "admin";
              // Don't set next_admin_id - allow all admins to see it
              // updateData.next_admin_id = nextApproverId;
            } else if (approverUser.is_hr || approverUser.role === "hr") {
              approverRole = "hr";
              // Don't set next_hr_id - allow all HRs to see it
              // updateData.next_hr_id = nextApproverId;
            } else if (approverUser.is_comptroller || approverUser.role === "comptroller") {
              approverRole = "comptroller";
              // Don't set next_comptroller_id - allow all comptrollers to see it
              // updateData.next_comptroller_id = nextApproverId;
            } else {
              // Use role from selection
              if (nextApproverRole === "vp") {
                approverRole = "vp";
                updateData.next_vp_id = nextApproverId;
              } else if (nextApproverRole === "president") {
                approverRole = "president";
                updateData.next_president_id = nextApproverId;
              }
            }
          } else {
            // User not found - use role from selection
            if (nextApproverRole === "vp") {
              approverRole = "vp";
              updateData.next_vp_id = nextApproverId;
            } else if (nextApproverRole === "president") {
              approverRole = "president";
              updateData.next_president_id = nextApproverId;
            }
          }
        } catch (err) {
          console.error("[HR Action] Error fetching approver user:", err);
          // Fallback to role from selection
          if (nextApproverRole === "vp") {
            approverRole = "vp";
            updateData.next_vp_id = nextApproverId;
          } else if (nextApproverRole === "president") {
            approverRole = "president";
            updateData.next_president_id = nextApproverId;
          }
        }
      }

      // Update workflow_metadata with routing information
      const workflowMetadata: any = request.workflow_metadata || {};
      if (nextApproverId && approverRole) {
        workflowMetadata.next_approver_id = nextApproverId;
        workflowMetadata.next_approver_role = approverRole;
        // Store role-specific IDs for inbox filtering
        if (approverRole === "vp") {
          workflowMetadata.next_vp_id = nextApproverId;
        } else if (approverRole === "president") {
          workflowMetadata.next_president_id = nextApproverId;
        } else if (approverRole === "admin") {
          workflowMetadata.next_admin_id = nextApproverId;
        } else if (approverRole === "hr") {
          workflowMetadata.next_hr_id = nextApproverId;
        } else if (approverRole === "comptroller") {
          workflowMetadata.next_comptroller_id = nextApproverId;
        } else if (approverRole === "head") {
          workflowMetadata.next_head_id = nextApproverId;
        }
      }
      updateData.workflow_metadata = workflowMetadata;

      // Approve and route to VP
      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[HR Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: hrUser.id,
        actor_role: "hr",
        previous_status: "pending_hr",
        new_status: newStatus,
        comments: notes || `Approved by HR, routed to ${execLevel.toUpperCase()}`,
        metadata: {
          signature_at: now,
          signature_time: now, // Track signature time
          receive_time: request.created_at || now, // Track when request was received
          submission_time: request.created_at || null, // Track original submission time
          sent_to: approverRole,
          sent_to_id: nextApproverId || null,
          requester_type: requesterIsHead ? "head" : "faculty",
          head_included: headIncluded,
          routing_decision: requesterIsHead || shouldSkipVP ? "skip_vp_to_president" : "vp_only",
          parent_head_is_vp: parentHeadIsVP,
          parent_head_signed: parentHeadSigned,
          parent_head_approver_id: parentHeadApprover?.id || null
        }
      });

      // Create notifications
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        
        // Notify requester
        if (request.requester_id) {
          await createNotification({
            user_id: request.requester_id,
            notification_type: "request_approved",
            title: "Request Approved by HR",
            message: `Your travel order request ${request.request_number || ''} has been approved by HR and is now with ${approverRole === "president" ? "President" : "VP"}.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: "normal",
          });
        }

        // Notify next approver (VP or President)
        if (nextApproverId) {
          await createNotification({
            user_id: nextApproverId,
            notification_type: "request_pending_signature",
            title: "Request Requires Your Approval",
            message: `A travel order request ${request.request_number || ''} has been sent to you for approval.`,
            related_type: "request",
            related_id: requestId,
            action_url: approverRole === "president" ? `/president/inbox?view=${requestId}` : `/vp/inbox?view=${requestId}`,
            action_label: "Review Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[HR Approve] Failed to create notifications:", notifError);
      }

      console.log(`[HR Approve] ✅ Request ${requestId} approved, sent to ${execLevel.toUpperCase()}`);
      
      return NextResponse.json({
        ok: true,
        message: message,
      });

    } else if (action === "reject") {
      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: hrUser.id,
          rejection_reason: notes || "Rejected by HR",
          rejection_stage: "hr",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[HR Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: hrUser.id,
        actor_role: "hr",
        previous_status: "pending_hr",
        new_status: "rejected",
        comments: notes || "Rejected by HR",
      });

      console.log(`[HR Reject] ❌ Request ${requestId} rejected`);
      
      return NextResponse.json({
        ok: true,
        message: "Request rejected",
      });

    } else if (action === "edit_budget") {
      // Just update the edited budget without changing status
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          hr_edited_budget: editedBudget,
          hr_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[HR Edit Budget] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      console.log(`[HR Edit Budget] 💰 Budget edited for request ${requestId}`);
      
      return NextResponse.json({
        ok: true,
        message: "Budget updated successfully",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[HR Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
