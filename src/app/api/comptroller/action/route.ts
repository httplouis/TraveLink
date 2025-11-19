// src/app/api/comptroller/action/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get comptroller user info
    const { data: comptrollerUser } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!comptrollerUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { 
      requestId, 
      action, 
      signature, 
      notes, 
      editedBudget,
      expense_breakdown, // NEW: Updated expense breakdown array
      sendToRequester, // NEW: Option to send back to requester for payment
      paymentConfirmed, // NEW: If payment is confirmed
      nextApproverId, // NEW: Choice-based sending
      nextApproverRole // NEW: 'hr' or 'requester'
    } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[Comptroller Action] ${action} by ${comptrollerUser.name} on request ${requestId}`);

    if (action === "approve") {

      // Get request to check current status
      const { data: request } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const now = getPhilippineTimestamp();
      let nextStatus: string;
      let nextApproverRoleFinal: string;
      let updateData: any = {
        comptroller_approved_at: now,
        comptroller_approved_by: comptrollerUser.id,
        comptroller_signature: signature || null,
        comptroller_comments: notes || null,
        comptroller_edited_budget: editedBudget || null,
        updated_at: now,
      };

      // Special flow: Comptroller can send to requester for payment confirmation
      if (sendToRequester && !paymentConfirmed) {
        // Send back to requester for payment
        nextStatus = "pending_comptroller"; // Stay in comptroller stage
        nextApproverRoleFinal = "requester";
        updateData.payment_required = true;
        updateData.payment_confirmed = false;
        updateData.sent_to_requester_for_payment_at = now;
      } else if (paymentConfirmed || !sendToRequester) {
        // Check if VP already approved (as head) - if so, skip HR and go to President
        const vpAlreadyApproved = request.vp_approved_at && request.vp_approved_by;
        
        // Check if VP is also a head (dual role)
        let vpIsHead = false;
        if (vpAlreadyApproved && request.vp_approved_by) {
          try {
            const { data: vpUser } = await supabase
              .from("users")
              .select("is_head")
              .eq("id", request.vp_approved_by)
              .single();
            vpIsHead = vpUser?.is_head === true;
          } catch (err) {
            console.error("[Comptroller Approve] Error checking VP head status:", err);
          }
        }
        
        // If VP already approved as head, skip HR and go to President
        if (vpAlreadyApproved && vpIsHead) {
          console.log("[Comptroller Approve] ⏭️ VP already approved as head, skipping HR and going to President");
          nextStatus = "pending_exec";
          nextApproverRoleFinal = "president";
          updateData.status = nextStatus;
          updateData.current_approver_role = nextApproverRoleFinal;
          // Don't set next_president_id - allow all presidents to see it
        } else {
          // Payment confirmed or not needed: go to HR
          nextStatus = "pending_hr";
          nextApproverRoleFinal = nextApproverRole || "hr";
          updateData.status = nextStatus;
          updateData.current_approver_role = nextApproverRoleFinal;
        }
        updateData.payment_confirmed = paymentConfirmed || false;
        updateData.payment_confirmed_at = paymentConfirmed ? now : null;
      } else {
        // Default: go to HR (unless VP already approved)
        const vpAlreadyApproved = request.vp_approved_at && request.vp_approved_by;
        let vpIsHead = false;
        if (vpAlreadyApproved && request.vp_approved_by) {
          try {
            const { data: vpUser } = await supabase
              .from("users")
              .select("is_head")
              .eq("id", request.vp_approved_by)
              .single();
            vpIsHead = vpUser?.is_head === true;
          } catch (err) {
            console.error("[Comptroller Approve] Error checking VP head status:", err);
          }
        }
        
        if (vpAlreadyApproved && vpIsHead) {
          console.log("[Comptroller Approve] ⏭️ VP already approved as head, skipping HR and going to President");
          nextStatus = "pending_exec";
          nextApproverRoleFinal = "president";
        } else {
          nextStatus = "pending_hr";
          nextApproverRoleFinal = "hr";
        }
        updateData.status = nextStatus;
        updateData.current_approver_role = nextApproverRoleFinal;
      }

      // Set next approver ID if provided (choice-based sending)
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
            if (approverUser.is_hr || approverUser.role === "hr") {
              nextApproverRoleFinal = "hr";
              // Don't set next_hr_id - allow all HRs to see it
              // updateData.next_hr_id = nextApproverId;
            } else if (approverUser.is_admin || approverUser.role === "admin") {
              nextApproverRoleFinal = "admin";
              // Don't set next_admin_id - allow all admins to see it
              // updateData.next_admin_id = nextApproverId;
              nextStatus = "pending_admin";
            } else if (approverUser.is_comptroller || approverUser.role === "comptroller") {
              nextApproverRoleFinal = "comptroller";
              // Don't set next_comptroller_id - allow all comptrollers to see it
              // updateData.next_comptroller_id = nextApproverId;
              nextStatus = "pending_comptroller";
            } else if (approverUser.is_vp || approverUser.role === "exec") {
              nextApproverRoleFinal = "vp";
              updateData.next_vp_id = nextApproverId;
              nextStatus = "pending_exec";
            } else if (approverUser.is_president || approverUser.exec_type === "president") {
              nextApproverRoleFinal = "president";
              updateData.next_president_id = nextApproverId;
              nextStatus = "pending_exec";
            } else {
              // Use role from selection or default to hr
              if (nextApproverRole === "hr") {
                nextApproverRoleFinal = "hr";
                // Don't set next_hr_id - allow all HRs to see it
                // updateData.next_hr_id = nextApproverId;
              }
            }
            updateData.status = nextStatus;
            updateData.current_approver_role = nextApproverRoleFinal;
          } else {
            // User not found - use role from selection
            if (nextApproverRole === "hr") {
              nextApproverRoleFinal = "hr";
              // Don't set next_hr_id - allow all HRs to see it
              // updateData.next_hr_id = nextApproverId;
            }
          }
        } catch (err) {
          console.error("[Comptroller Action] Error fetching approver user:", err);
          // Fallback to role from selection
          if (nextApproverRole === "hr") {
            nextApproverRoleFinal = "hr";
            // Don't set next_hr_id - allow all HRs to see it
            // updateData.next_hr_id = nextApproverId;
          }
        }
      }

      // Update workflow_metadata with routing information
      const workflowMetadata: any = request.workflow_metadata || {};
      
      // IMPORTANT: For comptroller, hr, admin, and president - don't set next_approver_id
      // This allows ALL users in that role to see the request
      if (nextApproverRoleFinal === "comptroller" || nextApproverRoleFinal === "hr" || nextApproverRoleFinal === "admin" || nextApproverRoleFinal === "president") {
        // Clear any existing next_approver_id to ensure all users in that role can see it
        workflowMetadata.next_approver_id = null;
        workflowMetadata.next_approver_role = nextApproverRoleFinal;
        // Explicitly clear role-specific IDs
        workflowMetadata.next_comptroller_id = null;
        workflowMetadata.next_hr_id = null;
        workflowMetadata.next_admin_id = null;
        workflowMetadata.next_president_id = null;
      } else if (nextApproverId && nextApproverRoleFinal) {
        // For other roles (VP, Head), set the specific approver ID
        workflowMetadata.next_approver_id = nextApproverId;
        workflowMetadata.next_approver_role = nextApproverRoleFinal;
        
        // Store role-specific IDs for inbox filtering
        if (nextApproverRoleFinal === "vp") {
          workflowMetadata.next_vp_id = nextApproverId;
        } else if (nextApproverRoleFinal === "head") {
          workflowMetadata.next_head_id = nextApproverId;
        }
      }
      
      if (sendToRequester) {
        workflowMetadata.return_reason = "payment_confirmation";
      }
      
      // If skipping HR, add metadata note
      if (nextApproverRoleFinal === "president" && request.vp_approved_at) {
        workflowMetadata.skipped_hr = true;
        workflowMetadata.skip_reason = "VP already approved as head";
      }
      
      updateData.workflow_metadata = workflowMetadata;

      // Update request
      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Approve] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history with complete tracking
      let historyComments = notes || (sendToRequester ? "Sent to requester for payment confirmation" : "Approved by comptroller");
      if (nextApproverRoleFinal === "president" && request.vp_approved_at) {
        historyComments += " (HR skipped - VP already approved as head)";
      }
      
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: sendToRequester ? "sent_to_requester_for_payment" : "approved",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: request.status,
        new_status: nextStatus,
        comments: historyComments,
        metadata: {
          signature_at: now,
          signature_time: now, // Track signature time
          receive_time: request.created_at || now, // Track when request was received
          submission_time: request.created_at || null, // Track original submission time
          sent_to: nextApproverRoleFinal,
          sent_to_id: nextApproverId || null,
          payment_required: sendToRequester || false,
          payment_confirmed: paymentConfirmed || false,
          edited_budget: editedBudget || null,
          skipped_hr: nextApproverRoleFinal === "president" && request.vp_approved_at ? true : false
        }
      });

      // Create notifications
      try {
        if (sendToRequester && request.requester_id) {
          // Notify requester about payment requirement
          const { createNotification } = await import("@/lib/notifications/helpers");
          await createNotification({
            user_id: request.requester_id,
            notification_type: "payment_required",
            title: "Payment Confirmation Required",
            message: `Your travel order request ${request.request_number || ''} requires payment confirmation. Please confirm payment to proceed.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "Confirm Payment",
            priority: "high",
          });
        } else if (nextApproverId && nextApproverRoleFinal === "hr") {
          // Notify HR
          const { createNotification } = await import("@/lib/notifications/helpers");
          await createNotification({
            user_id: nextApproverId,
            notification_type: "request_pending_signature",
            title: "Request Requires Your Approval",
            message: `A travel order request ${request.request_number || ''} has been sent to you for approval.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/hr/inbox?view=${requestId}`,
            action_label: "Review Request",
            priority: "high",
          });
        }
      } catch (notifError: any) {
        console.error("[Comptroller Approve] Failed to create notifications:", notifError);
      }

      const finalMessage = sendToRequester 
        ? "Request sent to requester for payment confirmation"
        : (nextApproverRoleFinal === "president" 
          ? "Request approved, skipping HR (VP already approved as head), sent to President"
          : "Request approved and sent to HR");
      
      console.log(`[Comptroller Approve] ✅ Request ${requestId} ${sendToRequester ? 'sent to requester for payment' : `approved, sent to ${nextApproverRoleFinal}`}`);
      
      return NextResponse.json({
        ok: true,
        message: finalMessage,
        data: {
          nextStatus,
          nextApproverRole: nextApproverRoleFinal
        }
      });

    } else if (action === "reject") {
      // Reject and send back to user
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          status: "rejected",
          rejection_stage: "comptroller",
          rejected_at: getPhilippineTimestamp(),
          rejected_by: comptrollerUser.id,
          rejection_reason: notes || "Rejected by comptroller",
          comptroller_rejected_at: getPhilippineTimestamp(),
          comptroller_rejected_by: comptrollerUser.id,
          comptroller_rejection_reason: notes || "Budget not approved",
          comptroller_comments: notes || null,
          updated_at: getPhilippineTimestamp(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Reject] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log to request history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "rejected",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: "pending_comptroller",
        new_status: "rejected",
        comments: notes || "Rejected by comptroller",
      });

      console.log(`[Comptroller Reject] ❌ Request ${requestId} rejected, sent back to user`);
      
      return NextResponse.json({
        ok: true,
        message: "Request rejected and sent back to user",
      });

    } else if (action === "edit_budget") {
      // Get current request to track budget change
      const { data: currentRequest } = await supabase
        .from("requests")
        .select("total_budget, comptroller_edited_budget, requester_id, status")
        .eq("id", requestId)
        .single();

      if (!currentRequest) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const oldBudget = currentRequest.comptroller_edited_budget || currentRequest.total_budget || 0;
      const newBudget = editedBudget || 0;

      // Update the edited budget and expense_breakdown without changing status
      const updateData: any = {
        comptroller_edited_budget: editedBudget,
        comptroller_comments: notes || null,
        updated_at: getPhilippineTimestamp(),
      };
      
      // Update expense_breakdown if provided
      if (expense_breakdown && Array.isArray(expense_breakdown)) {
        updateData.expense_breakdown = expense_breakdown;
      }
      
      const { error: updateError } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId);

      if (updateError) {
        console.error("[Comptroller Edit Budget] Error:", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }

      // Log budget change to request_history
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "budget_modified",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: currentRequest.status || "pending_comptroller",
        new_status: currentRequest.status || "pending_comptroller",
        comments: `Budget modified: ₱${oldBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → ₱${newBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        metadata: {
          original_budget: oldBudget,
          new_budget: newBudget,
          edited_by: comptrollerUser.id,
          edited_by_name: comptrollerUser.name,
          edited_at: getPhilippineTimestamp(),
          notes: notes || null
        }
      });

      // Notify requester about budget change
      try {
        const { createNotification } = await import("@/lib/notifications/helpers");
        if (currentRequest.requester_id) {
          await createNotification({
            user_id: currentRequest.requester_id,
            notification_type: "budget_modified",
            title: "Budget Modified by Comptroller",
            message: `Your travel order budget has been modified from ₱${oldBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ₱${newBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
            related_type: "request",
            related_id: requestId,
            action_url: `/user/submissions?view=${requestId}`,
            action_label: "View Request",
            priority: "normal",
          });
        }
      } catch (notifError) {
        console.error("[Comptroller Edit Budget] Failed to create notification:", notifError);
      }

      console.log(`[Comptroller Edit Budget] 💰 Budget edited: ₱${oldBudget} → ₱${newBudget}`);
      
      return NextResponse.json({
        ok: true,
        message: "Budget updated successfully",
      });

    } else {
      return NextResponse.json(
        { ok: false, error: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("[Comptroller Action] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
