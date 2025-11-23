/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART REQUEST SUBMISSION API v2.1
 * Revolutionary Auto-Skip Logic Integration
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SmartWorkflowEngine, type SmartUser, type SmartDepartment, type DepartmentRouting } from "@/lib/workflow/smart-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createSupabaseServerClient(true);

    console.log("🚀 [SMART SUBMIT] Starting smart request submission...");

    // ═══════════════════════════════════════════════════════════════════
    // AUTHENTICATION & PROFILE
    // ═══════════════════════════════════════════════════════════════════

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get enhanced user profile with smart workflow fields
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id, email, name, department_id,
        is_head, is_admin, is_comptroller, is_hr, is_exec, exec_type,
        department:departments(
          id, code, name, parent_department_id,
          parent:departments(id, name, code, head_user_id)
        )
      `)
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ [SMART SUBMIT] Profile fetch error:", profileError);
      return NextResponse.json({ 
        ok: false, 
        error: "Profile not found: " + (profileError?.message || "Unknown error")
      }, { status: 404 });
    }

    if (!profile.department_id) {
      return NextResponse.json({ 
        ok: false, 
        error: "Your account is not assigned to a department. Please contact administrator." 
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // SMART USER & DEPARTMENT SETUP
    // ═══════════════════════════════════════════════════════════════════

    const smartUser: SmartUser = {
      id: profile.id,
      is_head: profile.is_head,
      is_admin: profile.is_admin,
      is_comptroller: profile.is_comptroller,
      is_hr: profile.is_hr,
      is_exec: profile.is_exec,
      exec_type: profile.exec_type,
      department_id: profile.department_id
    };

    const department = profile.department as any; // Type assertion for complex join
    const smartDepartment: SmartDepartment = {
      id: department.id,
      name: department.name,
      code: department.code,
      parent_department_id: department.parent_department_id,
      head_user_id: department.parent?.[0]?.head_user_id
    };

    console.log("🤖 [SMART SUBMIT] Smart user detected:", {
      roles: {
        head: smartUser.is_head,
        admin: smartUser.is_admin,
        comptroller: smartUser.is_comptroller,
        hr: smartUser.is_hr,
        executive: smartUser.is_exec,
        exec_type: smartUser.exec_type
      },
      department: smartDepartment.name,
      has_parent: !!smartDepartment.parent_department_id
    });

    // ═══════════════════════════════════════════════════════════════════
    // REQUEST DATA EXTRACTION & VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    const travelOrder = body.travelOrder ?? body.payload?.travelOrder ?? {};
    let costs = travelOrder.costs ?? {};
    const vehicleMode = body.vehicleMode ?? "owned";
    const reason = body.reason ?? "official";
    const departmentRouting: DepartmentRouting = body.departmentRouting ?? "own_office";

    // Auto-propose budget for institutional vehicles if no budget exists
    if (vehicleMode === "institutional") {
      const { mergeProposedBudget, hasExistingBudget } = await import("@/lib/user/request/budget-proposal");
      if (!hasExistingBudget(costs)) {
        console.log("[SMART SUBMIT] 💰 Auto-proposing budget for institutional vehicle");
        costs = mergeProposedBudget(costs);
        // Update travelOrder with proposed costs
        travelOrder.costs = costs;
      }
    }

    // 💰 SMART BUDGET DETECTION
    const totalBudget = Object.values(costs).reduce((sum: number, val: any) => {
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    const requiresBudget = totalBudget > 0 || 
                          body.cashAdvanceRequested || 
                          (Array.isArray(body.expenseBreakdown) && body.expenseBreakdown.length > 0);

    console.log("💰 [SMART SUBMIT] Budget analysis:", {
      total_budget: totalBudget,
      requires_budget: requiresBudget,
      cash_advance: body.cashAdvanceRequested
    });

    // ═══════════════════════════════════════════════════════════════════
    // SMART ROUTING DECISION
    // ═══════════════════════════════════════════════════════════════════

    let routingDecision = null;
    if (smartUser.is_head && smartDepartment.parent_department_id) {
      routingDecision = SmartWorkflowEngine.determineHeadApprovalRoute(
        smartUser,
        smartDepartment,
        departmentRouting
      );
      console.log("🏢 [SMART SUBMIT] Head routing decision:", routingDecision);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SMART REQUEST OBJECT CREATION
    // ═══════════════════════════════════════════════════════════════════

    const baseRequest: any = {
      request_type: reason === "seminar" ? "seminar" : "travel_order",
      title: travelOrder.purposeOfTravel || travelOrder.purpose || "Travel Request",
      purpose: travelOrder.purposeOfTravel || travelOrder.purpose || "",
      destination: travelOrder.destination || "",
      
      travel_start_date: travelOrder.departureDate || travelOrder.date || new Date().toISOString(),
      travel_end_date: travelOrder.returnDate || travelOrder.dateTo || travelOrder.date || new Date().toISOString(),
      
      // Requester info
      requester_id: profile.id,
      requester_name: travelOrder.requestingPerson || profile.name,
      requester_is_head: smartUser.is_head,
      department_id: profile.department_id,
      
      // Submitter info
      submitted_by_user_id: profile.id,
      submitted_by_name: profile.name,
      is_representative: false, // TODO: Implement representative logic
      
      // Participants
      participants: travelOrder.participants || [],
      head_included: (travelOrder.participants || []).some((p: any) => p.is_head) || smartUser.is_head,
      
      // Smart workflow fields
      requires_budget: requiresBudget,
      total_budget: totalBudget,
      budget_version: 1,
      hr_budget_ack_required: false,
      parent_department_routing: departmentRouting,
      
      // Budget breakdown
      expense_breakdown: body.expenseBreakdown || [],
      cost_justification: costs.justification || null,
      
      // Vehicle info
      vehicle_mode: vehicleMode,
      needs_vehicle: vehicleMode !== "owned",
      needs_rental: vehicleMode === "rent",
      
      // Metadata
      workflow_metadata: {
        smart_submission: true,
        submission_timestamp: new Date().toISOString(),
        user_roles: Object.keys(smartUser).filter(key => smartUser[key as keyof SmartUser] === true),
        routing_decision: routingDecision
      },
      smart_skips_applied: []
    };

    // ⚡ EXECUTIVE LEVEL DETERMINATION
    const execLevel = SmartWorkflowEngine.determineExecutiveLevel(baseRequest as any, smartUser);
    baseRequest.exec_level = execLevel;
    baseRequest.request_number = '';
    baseRequest.current_approver_role = '';

    console.log("👔 [SMART SUBMIT] Executive level determined:", execLevel);

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 DUAL-SIGNATURE MAGIC APPLICATION
    // ═══════════════════════════════════════════════════════════════════

    const signature = travelOrder.requesterSignature;
    if (!signature) {
      return NextResponse.json({ 
        ok: false, 
        error: "Signature is required for smart workflow processing" 
      }, { status: 400 });
    }

    const smartRequest = SmartWorkflowEngine.applyDualSignatureLogic(
      smartUser,
      signature,
      baseRequest
    );

    console.log("🎯 [SMART SUBMIT] Dual-signature logic applied:", {
      skips_applied: smartRequest.smart_skips_applied,
      head_skipped: smartRequest.head_skipped,
      comptroller_skipped: smartRequest.comptroller_skipped,
      hr_skipped: smartRequest.hr_skipped,
      exec_skipped: smartRequest.exec_skipped
    });

    // ═══════════════════════════════════════════════════════════════════
    // INITIAL STATUS DETERMINATION
    // ═══════════════════════════════════════════════════════════════════

    let initialStatus: any = "pending_head";
    
    if (routingDecision?.skip_head) {
      initialStatus = "pending_admin";
    } else if (smartUser.is_head && departmentRouting === "own_office") {
      initialStatus = "pending_admin";
    }

    (smartRequest as any).status = initialStatus;
    (smartRequest as any).current_approver_role = getApproverRole(initialStatus);

    console.log("📊 [SMART SUBMIT] Initial status determined:", initialStatus);

    // ═══════════════════════════════════════════════════════════════════
    // DATABASE INSERTION WITH RETRY LOGIC
    // ═══════════════════════════════════════════════════════════════════

    let insertResult: any = null;
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Generate unique request number
      const requestNumber = `TO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      (smartRequest as any).request_number = requestNumber;

      const { data, error } = await supabase
        .from("requests")
        .insert([smartRequest])
        .select()
        .single();

      if (!error) {
        insertResult = { data, error: null };
        break;
      }

      if (error.code === "23505" && attempt < maxRetries) {
        console.warn(`🔄 [SMART SUBMIT] Duplicate key on attempt ${attempt}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }

      insertResult = { data: null, error };
      break;
    }

    if (insertResult.error) {
      console.error("❌ [SMART SUBMIT] Database insertion failed:", insertResult.error);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to create request: " + insertResult.error.message 
      }, { status: 500 });
    }

    const createdRequest = insertResult.data;

    // ═══════════════════════════════════════════════════════════════════
    // HISTORY LOGGING
    // ═══════════════════════════════════════════════════════════════════

    await supabase.from("request_history").insert({
      request_id: createdRequest.id,
      action: "created",
      actor_id: profile.id,
      actor_role: "requester",
      previous_status: null,
      new_status: initialStatus,
      comments: "Smart request created with auto-skip logic",
      metadata: {
        smart_features: smartRequest.smart_skips_applied,
        dual_signature: !!signature,
        routing_decision: routingDecision
      }
    });

    // Log smart skips in history
    if (smartRequest.smart_skips_applied && smartRequest.smart_skips_applied.length > 0) {
      for (const skip of smartRequest.smart_skips_applied) {
        await supabase.from("request_history").insert({
          request_id: createdRequest.id,
          action: "auto_approved",
          actor_id: profile.id,
          actor_role: skip.includes("head") ? "head" : 
                     skip.includes("comptroller") ? "comptroller" :
                     skip.includes("hr") ? "hr" : 
                     skip.includes("exec") ? "executive" : "system",
          previous_status: initialStatus,
          new_status: initialStatus,
          comments: `Smart skip applied: ${skip}`,
          metadata: { smart_skip: true, skip_type: skip }
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎉 SUCCESS RESPONSE WITH WOW FACTOR
    // ═══════════════════════════════════════════════════════════════════

    const successMessage = SmartWorkflowEngine.generateSuccessMessage(createdRequest as any);
    const analytics = SmartWorkflowEngine.getWorkflowAnalytics(createdRequest as any);

    console.log("✅ [SMART SUBMIT] Request created successfully:", {
      id: createdRequest.id,
      request_number: createdRequest.request_number,
      status: createdRequest.status,
      analytics
    });

    return NextResponse.json({
      ok: true,
      data: createdRequest,
      message: successMessage,
      smart_analytics: analytics,
      wow_factor: {
        stages_skipped: analytics.skipped_stages,
        time_saved: analytics.time_saved_estimate,
        efficiency_boost: `${analytics.efficiency_percentage}%`,
        features_used: analytics.smart_features_used
      }
    });

  } catch (error: any) {
    console.error("💥 [SMART SUBMIT] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error: " + error.message 
    }, { status: 500 });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════
 */

function getApproverRole(status: string): string {
  const roleMap: Record<string, string> = {
    "pending_head": "head",
    "pending_admin": "admin", 
    "pending_comptroller": "comptroller",
    "pending_hr": "hr",
    "pending_hr_ack": "hr",
    "pending_exec": "executive"
  };
  
  return roleMap[status] || "admin";
}
