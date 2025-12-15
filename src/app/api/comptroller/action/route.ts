// src/app/api/comptroller/action/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    // Use createSupabaseServerClient for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use direct createClient for service role to truly bypass RLS for queries
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    // Service role client for queries (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

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
      budgetJustification, // NEW: Optional justification/comments for budget edits
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

      // Check if VP already approved AS A HEAD (parent_head or head) - if so, skip HR and go to President
      // IMPORTANT: Only skip HR if VP approved AS A HEAD, not if they approved as VP (executive level)
      const parentHeadIsVP = request.parent_head_approved_at && request.parent_head_approved_by;
      const headIsVP = request.head_approved_at && request.head_approved_by;
      
      // Check if the parent head or head who approved is a VP
      let vpApprovedAsHead = false;
      let vpHeadId: string | null = null;
      
      if (parentHeadIsVP && request.parent_head_approved_by) {
        try {
          const { data: parentHeadUser, error: parentHeadError } = await supabase
            .from("users")
            .select("is_vp, role")
            .eq("id", request.parent_head_approved_by)
            .single();
          
          if (parentHeadError) {
            console.error("[Comptroller Approve] Error checking parent head VP status:", parentHeadError);
          } else if (parentHeadUser && (parentHeadUser.is_vp === true || parentHeadUser.role === "exec")) {
            vpApprovedAsHead = true;
            vpHeadId = request.parent_head_approved_by;
            console.log(`[Comptroller Approve] Parent head ${request.parent_head_approved_by} is VP - will skip HR`);
          }
        } catch (err) {
          console.error("[Comptroller Approve] Exception checking parent head VP status:", err);
        }
      }
      
      // Also check if head who approved is a VP
      if (!vpApprovedAsHead && headIsVP && request.head_approved_by) {
        try {
          const { data: headUser, error: headError } = await supabase
            .from("users")
            .select("is_vp, role")
            .eq("id", request.head_approved_by)
            .single();
          
          if (headError) {
            console.error("[Comptroller Approve] Error checking head VP status:", headError);
          } else if (headUser && (headUser.is_vp === true || headUser.role === "exec")) {
            vpApprovedAsHead = true;
            vpHeadId = request.head_approved_by;
            console.log(`[Comptroller Approve] Head ${request.head_approved_by} is VP - will skip HR`);
          }
        } catch (err) {
          console.error("[Comptroller Approve] Exception checking head VP status:", err);
        }
      }
      
      // Flag to prevent nextApproverId logic from overriding VP head skip
      const shouldSkipHR = vpApprovedAsHead;
      
      // If VP already approved as head, skip HR and go to President
      if (shouldSkipHR) {
        console.log("[Comptroller Approve] ⏭️ VP already approved as head, skipping HR and going to President");
        nextStatus = "pending_exec";
        nextApproverRoleFinal = "president";
        updateData.status = nextStatus;
        updateData.current_approver_role = nextApproverRoleFinal;
        // Don't set next_president_id - allow all presidents to see it
      } else {
        // Go to HR
        nextStatus = "pending_hr";
        nextApproverRoleFinal = nextApproverRole || "hr";
        updateData.status = nextStatus;
        updateData.current_approver_role = nextApproverRoleFinal;
      }

      // Set next approver ID if provided (choice-based sending)
      // BUT: Don't override if we're skipping HR (VP is head)
      if (nextApproverId && !shouldSkipHR) {
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
              // Don't override if VP head already approved (should skip HR and go to President)
              if (!shouldSkipHR) {
                nextApproverRoleFinal = "vp";
                workflowMetadata.next_vp_id = nextApproverId;
                nextStatus = "pending_exec";
                updateData.status = nextStatus;
                updateData.current_approver_role = nextApproverRoleFinal;
              }
            } else if (approverUser.is_president || approverUser.exec_type === "president") {
              // Don't override if VP head already approved (should skip HR and go to President)
              if (!shouldSkipHR) {
                nextApproverRoleFinal = "president";
                workflowMetadata.next_president_id = nextApproverId;
                nextStatus = "pending_exec";
                updateData.status = nextStatus;
                updateData.current_approver_role = nextApproverRoleFinal;
              }
            } else {
              // Use role from selection or default to hr
              // Don't override if VP head already approved (should skip HR)
              if (nextApproverRole === "hr" && !shouldSkipHR) {
                nextApproverRoleFinal = "hr";
                nextStatus = "pending_hr";
                updateData.status = nextStatus;
                updateData.current_approver_role = nextApproverRoleFinal;
                // Don't set next_hr_id - allow all HRs to see it
              }
            }
            // Only update status and role if not already set (to prevent overriding VP head skip)
            if (!updateData.status) {
              updateData.status = nextStatus;
            }
            if (!updateData.current_approver_role) {
              updateData.current_approver_role = nextApproverRoleFinal;
            }
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
      
      // If skipping HR, add metadata note
      if (nextApproverRoleFinal === "president" && vpApprovedAsHead) {
        workflowMetadata.skipped_hr = true;
        workflowMetadata.skip_reason = "VP already approved as head";
        workflowMetadata.vp_head_id = vpHeadId;
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
      let historyComments = notes || "Approved by comptroller";
      if (nextApproverRoleFinal === "president" && request.vp_approved_at) {
        historyComments += " (HR skipped - VP already approved as head)";
      }
      
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "approved",
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
          edited_budget: editedBudget || null,
          skipped_hr: nextApproverRoleFinal === "president" && request.vp_approved_at ? true : false
        }
      });

      // Create notifications
      try {
        if (nextApproverId && nextApproverRoleFinal === "hr") {
          // Notify HR
          const { createNotification } = await import("@/lib/notifications/helpers");
          await createNotification({
            user_id: nextApproverId,
            notification_type: "request_pending_signature",
            title: "New Request from Comptroller",
            message: `Comptroller has approved request ${request.request_number || ''} and forwarded it to you for HR review.`,
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

      const finalMessage = nextApproverRoleFinal === "president" 
        ? "Request approved, skipping HR (VP already approved as head), sent to President"
        : "Request approved and sent to HR";
      
      console.log(`[Comptroller Approve] ✅ Request ${requestId} approved, sent to ${nextApproverRoleFinal}`);
      
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
        .select("total_budget, comptroller_edited_budget, requester_id, status, expense_breakdown")
        .eq("id", requestId)
        .single();

      if (!currentRequest) {
        return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
      }

      const oldBudget = currentRequest.comptroller_edited_budget || currentRequest.total_budget || 0;
      const newBudget = editedBudget || 0;

      // Update the edited budget and expense_breakdown without changing status
      // Collect all justifications from expense items for general comments
      const allJustifications = expense_breakdown && Array.isArray(expense_breakdown)
        ? expense_breakdown
            .filter((exp: any) => exp.justification && exp.justification.trim())
            .map((exp: any) => `${exp.item}: ${exp.justification}`)
            .join("; ")
        : null;

      const updateData: any = {
        comptroller_edited_budget: editedBudget,
        comptroller_comments: allJustifications || notes || null, // Use combined justifications or notes
        updated_at: getPhilippineTimestamp(),
      };
      
      // Update expense_breakdown if provided (includes justifications per item)
      if (expense_breakdown && Array.isArray(expense_breakdown)) {
        // Ensure each item has the proper structure with justification
        updateData.expense_breakdown = expense_breakdown.map((exp: any) => ({
          item: exp.item,
          amount: exp.amount || 0,
          description: exp.description || null,
          justification: exp.justification || null // Store justification per item
        }));
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
      const justificationText = budgetJustification || notes || "Budget edited by comptroller";
      
      // Store original expense_breakdown before edit for comparison
      let originalExpenseBreakdown = currentRequest.expense_breakdown;
      if (typeof originalExpenseBreakdown === 'string') {
        try {
          originalExpenseBreakdown = JSON.parse(originalExpenseBreakdown);
        } catch (e) {
          console.error("[Comptroller Edit Budget] Failed to parse original expense_breakdown:", e);
          originalExpenseBreakdown = null;
        }
      }
      
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "budget_modified",
        actor_id: comptrollerUser.id,
        actor_role: "comptroller",
        previous_status: currentRequest.status || "pending_comptroller",
        new_status: currentRequest.status || "pending_comptroller",
        comments: `Budget modified: ₱${oldBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → ₱${newBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${justificationText ? ` | Justification: ${justificationText}` : ''}`,
        metadata: {
          original_budget: oldBudget,
          new_budget: newBudget,
          original_expense_breakdown: originalExpenseBreakdown, // Store original breakdown
          edited_by: comptrollerUser.id,
          edited_by_name: comptrollerUser.name,
          edited_at: getPhilippineTimestamp(),
          notes: notes || null,
          budget_justification: budgetJustification || null
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
