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
    const { requestId, action, signature, notes, next_vp_id } = body;

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
      // Get request to check requester type
      const { data: request } = await supabase
        .from("requests")
        .select("*, requester:users!requester_id(role, is_head, exec_type)")
        .eq("id", requestId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const requester = request.requester as any;
      const requesterIsHead = request.requester_is_head || requester?.is_head || false;
      const requesterRole = requester?.role || "faculty";
      const headIncluded = request.head_included || false;

      // Routing logic based on requester type:
      // - Head/Director/Dean → Must go to President (skip VP if head requester)
      // - Faculty + Head → VP only (not President)
      // - Faculty alone → Should not reach here (validation prevents)
      
      let newStatus: string;
      let execLevel: string;
      let approverRole: string;
      let message: string;

      if (requesterIsHead || requesterRole === "director" || requesterRole === "dean") {
        // Head/Director/Dean → Must go to President
        // Head requester skips VP → goes directly to President
        newStatus = "pending_exec";
        execLevel = "president";
        approverRole = "president";
        message = "Request approved and sent to President";
      } else if (!requesterIsHead && headIncluded) {
        // Faculty + Head → VP only (not President)
        newStatus = "pending_exec";
        execLevel = "vp";
        approverRole = "vp";
        message = "Request approved and sent to VP";
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
        if (approverRole === "vp") {
          updateData.next_vp_id = nextApproverId;
        } else if (approverRole === "president") {
          updateData.next_president_id = nextApproverId;
        }
      }

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
          routing_decision: requesterIsHead ? "skip_vp_to_president" : "vp_only"
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
