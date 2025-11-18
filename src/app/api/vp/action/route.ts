import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get VP user info
    const { data: vpUser } = await supabase
      .from("users")
      .select("id, name, is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (!vpUser?.is_vp) {
      return NextResponse.json({ ok: false, error: "VP role required" }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, action, signature, notes, is_head_request } = body;

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

    console.log(`[VP Action] ${action} by ${vpUser.name} on request ${requestId}`);

    if (action === "approve") {
      // Get request to check requester type and if other VP has already signed
      const { data: request } = await supabase
        .from("requests")
        .select(`
          *, 
          requester:users!requester_id(role, is_head, exec_type),
          vp_approver:users!vp_approved_by(id, name, email),
          vp2_approver:users!vp2_approved_by(id, name, email)
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

      // Check if this VP has already approved
      const alreadyApprovedByThisVP = 
        (request.vp_approved_by === vpUser.id) || 
        (request.vp2_approved_by === vpUser.id);
      
      if (alreadyApprovedByThisVP) {
        return NextResponse.json({ 
          ok: false, 
          error: "You have already approved this request" 
        }, { status: 400 });
      }

      // Check if other VP has already signed
      const otherVPApproved = 
        (request.vp_approved_by && request.vp_approved_by !== vpUser.id) ||
        (request.vp2_approved_by && request.vp2_approved_by !== vpUser.id);
      
      const isFirstVP = !request.vp_approved_by;
      const isSecondVP = !isFirstVP && !request.vp2_approved_by;

      const now = getPhilippineTimestamp();
      const { nextApproverId } = body; // For choice-based sending

      // Check if there are multiple requesters from different departments (for tracking)
      const { data: requesters } = await supabase
        .from("requester_invitations")
        .select("department_id")
        .eq("request_id", requestId)
        .eq("status", "confirmed");
      
      const uniqueDepartments = new Set(
        (requesters || [])
          .map((r: any) => r.department_id)
          .filter(Boolean)
      );

      let updateData: any = {};
      let newStatus: string;
      let nextApproverRole: string;
      let message: string;

      if (isFirstVP) {
        // First VP is signing
        updateData.vp_approved_at = now;
        updateData.vp_approved_by = vpUser.id;
        updateData.vp_signature = signature || null;
        updateData.vp_comments = notes || null;
        
        // Check if multiple departments - if so, need both VPs to approve
        // Request should have already gone through: Head → Admin → Comptroller → HR → VP
        if (uniqueDepartments.size > 1) {
          // Multiple departments - wait for second VP
          newStatus = "pending_exec"; // Stay in pending_exec, wait for second VP
          nextApproverRole = "vp";
          message = "First VP approved. Waiting for second VP approval (multiple departments).";
        } else {
          // Single department - one VP approval is enough
          // Request should have already gone through Admin/Comptroller/HR before reaching VP
          // Route based on requester type
          if (requesterIsHead || requesterRole === "director" || requesterRole === "dean") {
            // Head/Director/Dean requester → Must go to President
            newStatus = "pending_exec";
            nextApproverRole = "president";
            message = "VP approved. Request sent to President.";
          } else {
            // Faculty requester (with head included) → Fully approved after VP
            newStatus = "approved";
            nextApproverRole = "requester";
            updateData.final_approved_at = now;
            message = "Request fully approved by VP.";
          }
        }
      } else if (isSecondVP) {
        // Second VP is signing - both VPs have now approved
        // This is just an acknowledgment that both departments' heads have been approved by their respective VPs
        // Request should have already gone through: Head → Admin → Comptroller → HR → VP
        updateData.vp2_approved_at = now;
        updateData.vp2_approved_by = vpUser.id;
        updateData.vp2_signature = signature || null;
        updateData.vp2_comments = notes || null;
        updateData.both_vps_approved = true;
        
        // Both VPs approved - request should have already gone through Admin/Comptroller/HR
        // Now route to President (both VPs approved means both departments acknowledged)
        newStatus = "pending_exec";
        nextApproverRole = "president";
        message = "Both VPs have approved. Request sent to President.";
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: "Both VPs have already approved this request" 
        }, { status: 400 });
      }

      updateData.status = newStatus;
      updateData.current_approver_role = nextApproverRole;
      updateData.exec_level = requesterIsHead ? "president" : "vp";
      updateData.updated_at = now;

      // If going to President, set next president ID
      if (newStatus === "pending_exec" && nextApproverRole === "president" && nextApproverId) {
        updateData.next_president_id = nextApproverId;
      }

      // If fully approved, set final approval timestamp
      if (newStatus === "approved") {
        updateData.final_approved_at = now;
      }

      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      const historyComment = isSecondVP 
        ? `Second VP approved. Both VPs have now approved. ${notes || ''}`
        : isFirstVP && uniqueDepartments.size > 1
        ? `First VP approved. Waiting for second VP. ${notes || ''}`
        : notes || (newStatus === "approved" ? "Approved by VP - Request fully approved" : "Approved by VP, forwarded to President");

      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: request.status || "pending_exec",
        new_status: newStatus,
        comments: historyComment,
        metadata: {
          signature_at: now,
          signature_time: now,
          receive_time: request.created_at || now,
          submission_time: request.created_at || null,
          sent_to: nextApproverRole,
          sent_to_id: nextApproverId || null,
          requester_type: requesterIsHead ? "head" : "faculty",
          head_included: headIncluded,
          routing_decision: isSecondVP ? "both_vps_approved_skip_to_president" : (newStatus === "approved" ? "vp_final" : "vp_to_president"),
          is_first_vp: isFirstVP,
          is_second_vp: isSecondVP,
          other_vp_approved: otherVPApproved,
          both_vps_approved: isSecondVP
        }
      });

      // Create notifications
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        
        // Notify requester
        if (request.requester_id) {
          await createNotification({
            user_id: request.requester_id,
            notification_type: newStatus === "approved" ? "request_approved" : "request_status_change",
            title: newStatus === "approved" ? "Request Fully Approved" : "Request Approved by VP",
            message: newStatus === "approved" 
              ? `Your travel order request ${request.request_number || ''} has been fully approved!`
              : `Your travel order request ${request.request_number || ''} has been approved by VP and is now with President.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: newStatus === "approved" ? "high" : "normal",
          });
        }

        // Notify President if going to President
        if (newStatus === "pending_exec" && nextApproverRole === "president" && nextApproverId) {
          await createNotification({
            user_id: nextApproverId,
            notification_type: "request_pending_signature",
            title: "Request Requires Your Approval",
            message: `A travel order request ${request.request_number || ''} has been sent to you for final approval.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/president/inbox?view=${requestId}`,
            action_label: "Review Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[VP Approve] Failed to create notifications:", notifError);
      }

      console.log(`[VP Approve] ✅ Request ${requestId} ${newStatus === "approved" ? "fully approved" : "approved, sent to President"}`);
      
      return NextResponse.json({
        ok: true,
        message: message,
        data: {
          nextStatus: newStatus,
          nextApproverRole: nextApproverRole
        }
      });

    } else if (action === "reject") {
      // Reject request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: vpUser.id,
          rejection_reason: notes || "Rejected by VP",
          rejection_stage: "vp",
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[VP Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: vpUser.id,
        actor_role: "vp",
        previous_status: "pending_vp",
        new_status: "rejected",
        comments: notes || "Rejected by VP",
      });

      console.log(`[VP Reject] ❌ Request ${requestId} rejected`);
      
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
    console.error("[VP Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
