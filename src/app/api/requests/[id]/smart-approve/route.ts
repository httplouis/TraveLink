/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART APPROVAL API v2.1
 * Enhanced Approval with Auto-Skip Logic
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SmartWorkflowEngine, type SmartUser, type SmartRequest } from "@/lib/workflow/smart-engine";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { comments, signature, budget_modifications } = await req.json();
    const requestId = params.id;
    
    console.log("🚀 [SMART APPROVE] Starting smart approval process...");
    
    const supabase = await createSupabaseServerClient(true);

    // ═══════════════════════════════════════════════════════════════════
    // AUTHENTICATION & AUTHORIZATION
    // ═══════════════════════════════════════════════════════════════════

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get enhanced user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id, email, name,
        is_head, is_admin, is_comptroller, is_hr, is_exec, exec_type
      `)
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const smartUser: SmartUser = {
      id: profile.id,
      is_head: profile.is_head,
      is_admin: profile.is_admin,
      is_comptroller: profile.is_comptroller,
      is_hr: profile.is_hr,
      is_exec: profile.is_exec,
      exec_type: profile.exec_type
    };

    // ═══════════════════════════════════════════════════════════════════
    // GET REQUEST WITH SMART FIELDS
    // ═══════════════════════════════════════════════════════════════════

    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    const smartRequest = request as SmartRequest;

    console.log("🤖 [SMART APPROVE] Current request status:", {
      id: requestId,
      status: smartRequest.status,
      current_stage: smartRequest.status,
      approver_roles: Object.keys(smartUser).filter(key => smartUser[key as keyof SmartUser] === true)
    });

    // ═══════════════════════════════════════════════════════════════════
    // AUTHORIZATION CHECK
    // ═══════════════════════════════════════════════════════════════════

    const canApprove = SmartWorkflowEngine.canUserApproveStage(
      smartUser,
      smartRequest.status,
      smartRequest
    );

    if (!canApprove) {
      return NextResponse.json({ 
        ok: false, 
        error: `You are not authorized to approve this request at stage: ${smartRequest.status}` 
      }, { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // SMART APPROVAL PROCESSING
    // ═══════════════════════════════════════════════════════════════════

    const now = new Date();
    const updateData: any = {
      updated_at: now.toISOString()
    };

    let workflowNote = "";
    let budgetModified = false;

    // Process approval based on current stage
    switch (smartRequest.status) {
      case "pending_head":
        updateData.head_approved_at = now.toISOString();
        updateData.head_approved_by = profile.id;
        updateData.head_signature = signature;
        updateData.head_comments = comments;
        updateData.head_signed_at = now.toISOString();
        workflowNote = "Head approval completed";
        break;
        
      case "pending_admin":
        updateData.admin_processed_at = now.toISOString();
        updateData.admin_processed_by = profile.id;
        updateData.admin_comments = comments;
        updateData.admin_signed_at = now.toISOString();
        workflowNote = "Admin processing completed";
        break;
        
      case "pending_comptroller":
        updateData.comptroller_approved_at = now.toISOString();
        updateData.comptroller_approved_by = profile.id;
        updateData.comptroller_comments = comments;
        updateData.comptroller_signed_at = now.toISOString();
        
        // 💰 BUDGET MODIFICATION LOGIC
        if (budget_modifications && Object.keys(budget_modifications).length > 0) {
          const originalBudget = smartRequest.total_budget || 0;
          const newBudget = budget_modifications.total_budget || originalBudget;
          
          if (originalBudget !== newBudget) {
            budgetModified = true;
            updateData.total_budget = newBudget;
            updateData.budget_version = (smartRequest.budget_version || 1) + 1;
            updateData.budget_last_modified_at = now.toISOString();
            updateData.budget_last_modified_by = profile.id;
            updateData.hr_budget_ack_required = true;
            
            workflowNote = `Budget modified: ₱${originalBudget.toLocaleString()} → ₱${newBudget.toLocaleString()}`;
            console.log("💰 [SMART APPROVE] Budget modification detected:", workflowNote);
          } else {
            workflowNote = "Budget approved without changes";
          }
        } else {
          workflowNote = "Budget approved";
        }
        break;
        
      case "pending_hr":
        updateData.hr_approved_at = now.toISOString();
        updateData.hr_approved_by = profile.id;
        updateData.hr_signature = signature;
        updateData.hr_comments = comments;
        updateData.hr_signed_at = now.toISOString();
        workflowNote = "HR approval completed";
        break;
        
      case "pending_hr_ack":
        updateData.hr_budget_ack_at = now.toISOString();
        updateData.hr_budget_ack_required = false;
        updateData.hr_comments = comments || "Budget changes acknowledged";
        workflowNote = "HR acknowledged budget changes";
        break;
        
      case "pending_exec":
        updateData.exec_approved_at = now.toISOString();
        updateData.exec_approved_by = profile.id;
        updateData.exec_signature = signature;
        updateData.exec_comments = comments;
        updateData.exec_signed_at = now.toISOString();
        workflowNote = `Executive approval completed (${smartRequest.exec_level || 'VP'})`;
        break;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 SMART NEXT STAGE DETERMINATION
    // ═══════════════════════════════════════════════════════════════════

    let nextStatus = SmartWorkflowEngine.getNextStage(
      { ...smartRequest, ...updateData } as SmartRequest,
      smartRequest.status
    );

    // Special handling for budget modifications
    if (budgetModified && smartRequest.status === "pending_comptroller") {
      nextStatus = "pending_hr_ack" as any;
    }

    // Final approval check
    if (nextStatus === "approved") {
      updateData.final_approved_at = now.toISOString();
      updateData.status = "approved";
      workflowNote += " - Request fully approved!";
    } else {
      updateData.status = nextStatus;
    }

    console.log("⚡ [SMART APPROVE] Next stage determined:", {
      current: smartRequest.status,
      next: nextStatus,
      budget_modified: budgetModified,
      workflow_note: workflowNote
    });

    // ═══════════════════════════════════════════════════════════════════
    // DATABASE UPDATE
    // ═══════════════════════════════════════════════════════════════════

    const { data: updatedRequest, error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [SMART APPROVE] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // HISTORY LOGGING
    // ═══════════════════════════════════════════════════════════════════

    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "approved",
      actor_id: profile.id,
      actor_role: smartRequest.status.replace("pending_", ""),
      previous_status: smartRequest.status,
      new_status: nextStatus,
      comments: comments || workflowNote,
      metadata: { 
        signature: signature ? "provided" : "none",
        budget_modified: budgetModified,
        smart_workflow: true,
        workflow_note: workflowNote
      }
    });

    // Log budget modification if applicable
    if (budgetModified) {
      await supabase.from("request_history").insert({
        request_id: requestId,
        action: "budget_modified",
        actor_id: profile.id,
        actor_role: "comptroller",
        previous_status: smartRequest.status,
        new_status: nextStatus,
        comments: `Budget modified: ₱${smartRequest.total_budget} → ₱${updateData.total_budget}`,
        metadata: { 
          original_budget: smartRequest.total_budget,
          new_budget: updateData.total_budget,
          budget_version: updateData.budget_version
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎉 SUCCESS RESPONSE WITH ANALYTICS
    // ═══════════════════════════════════════════════════════════════════

    const analytics = SmartWorkflowEngine.getWorkflowAnalytics(updatedRequest as SmartRequest);
    const successMessage = nextStatus === "approved" 
      ? SmartWorkflowEngine.generateSuccessMessage(updatedRequest as SmartRequest)
      : `Request approved and forwarded to next stage: ${nextStatus.replace("pending_", "")}`;

    console.log("✅ [SMART APPROVE] Approval completed:", {
      request_id: requestId,
      previous_status: smartRequest.status,
      new_status: nextStatus,
      workflow_note: workflowNote,
      analytics
    });

    return NextResponse.json({ 
      ok: true, 
      data: updatedRequest,
      message: successMessage,
      workflow_info: {
        previous_status: smartRequest.status,
        new_status: nextStatus,
        workflow_note: workflowNote,
        budget_modified: budgetModified,
        fully_approved: nextStatus === "approved"
      },
      smart_analytics: analytics,
      wow_factor: analytics.skipped_stages > 0 ? {
        efficiency_boost: `${analytics.efficiency_percentage}%`,
        time_saved: analytics.time_saved_estimate,
        smart_features: analytics.smart_features_used
      } : null
    });

  } catch (error: any) {
    console.error("💥 [SMART APPROVE] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error: " + error.message 
    }, { status: 500 });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART REJECTION API
 * ═══════════════════════════════════════════════════════════════════════
 */

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reason, comments } = await req.json();
    const requestId = params.id;
    
    console.log("🚫 [SMART REJECT] Starting smart rejection process...");
    
    const supabase = await createSupabaseServerClient(true);

    // Get user and request (similar to approval flow)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, email, name, is_head, is_admin, is_comptroller, is_hr, is_exec")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Update request to rejected status
    const now = new Date();
    const { data: rejectedRequest, error: updateError } = await supabase
      .from("requests")
      .update({
        status: "rejected",
        rejected_at: now.toISOString(),
        rejected_by: profile.id,
        rejection_reason: reason,
        rejection_stage: request.status,
        updated_at: now.toISOString()
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log rejection in history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "rejected",
      actor_id: profile.id,
      actor_role: request.status.replace("pending_", ""),
      previous_status: request.status,
      new_status: "rejected",
      comments: comments || reason,
      metadata: { 
        rejection_reason: reason,
        rejection_stage: request.status,
        smart_workflow: true
      }
    });

    console.log("🚫 [SMART REJECT] Request rejected:", {
      request_id: requestId,
      rejected_by: profile.name,
      reason: reason,
      stage: request.status
    });

    return NextResponse.json({
      ok: true,
      data: rejectedRequest,
      message: `Request rejected at ${request.status.replace("pending_", "")} stage`,
      rejection_info: {
        rejected_by: profile.name,
        rejection_reason: reason,
        rejection_stage: request.status,
        rejected_at: now.toISOString()
      }
    });

  } catch (error: any) {
    console.error("💥 [SMART REJECT] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error: " + error.message 
    }, { status: 500 });
  }
}
