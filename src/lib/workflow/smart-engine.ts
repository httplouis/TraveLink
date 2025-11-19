/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART SIGNATURE WORKFLOW ENGINE v2.1
 * Revolutionary Auto-Skip Logic for Travelink
 * ═══════════════════════════════════════════════════════════════════════
 */

export type WorkflowStage =
  | "pending_head"
  | "pending_admin"
  | "pending_comptroller"
  | "pending_hr"
  | "pending_hr_ack"  // Special substage for budget acknowledgment
  | "pending_exec"
  | "approved"
  | "rejected"
  | "cancelled";

export type ExecLevel = "vp" | "president" | "auto_approve";
export type DepartmentRouting = "own_office" | "parent_dept";

export interface SmartRequest {
  id: string;
  requester_id: string;
  status: WorkflowStage;
  
  // Smart workflow fields
  requires_budget: boolean;
  budget_version: number;
  budget_last_modified_at?: Date;
  budget_last_modified_by?: string;
  hr_budget_ack_required: boolean;
  hr_budget_ack_at?: Date;
  exec_level: ExecLevel;
  parent_department_routing: DepartmentRouting;
  
  // Signatures and approvals
  requester_signature?: string;
  requester_signed_at?: Date;
  
  head_signature?: string;
  head_signed_at?: Date;
  head_approved_by?: string;
  head_skipped?: boolean;
  head_skip_reason?: string;
  
  admin_signature?: string;
  admin_signed_at?: Date;
  admin_approved_by?: string;
  
  comptroller_signature?: string;
  comptroller_signed_at?: Date;
  comptroller_approved_by?: string;
  comptroller_skipped?: boolean;
  comptroller_skip_reason?: string;
  
  hr_signature?: string;
  hr_signed_at?: Date;
  hr_approved_by?: string;
  hr_skipped?: boolean;
  hr_skip_reason?: string;
  
  exec_signature?: string;
  exec_signed_at?: Date;
  exec_approved_by?: string;
  exec_skipped?: boolean;
  exec_skip_reason?: string;
  
  // Metadata
  workflow_metadata: Record<string, any>;
  smart_skips_applied: string[];
  
  // Budget info
  total_budget?: number;
  is_international?: boolean;
}

export interface SmartUser {
  id: string;
  is_head?: boolean;
  is_admin?: boolean;
  is_comptroller?: boolean;
  is_hr?: boolean;
  is_exec?: boolean; // Changed from is_executive to match your schema
  exec_type?: "vp" | "president";
  department_id?: string;
}

export interface SmartDepartment {
  id: string;
  name: string;
  code: string;
  parent_department_id?: string;
  head_user_id?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * SMART WORKFLOW ENGINE CLASS
 * ═══════════════════════════════════════════════════════════════════════
 */
export class SmartWorkflowEngine {
  
  /**
   * 🎯 CORE INTELLIGENCE: Check if stage already has signature
   */
  static hasExistingSignature(request: SmartRequest, stage: WorkflowStage): boolean {
    switch (stage) {
      case "pending_head":
        return !!request.head_signature;
      case "pending_comptroller":
        return !!request.comptroller_signature;
      case "pending_hr":
        return !!request.hr_signature && !request.hr_budget_ack_required;
      case "pending_hr_ack":
        return !!request.hr_budget_ack_at;
      case "pending_exec":
        return !!request.exec_signature;
      case "pending_admin":
        return false; // Admin never has pre-existing signature
      default:
        return false;
    }
  }

  /**
   * 🤖 SMART DETECTION: Check if requester should auto-approve stage
   */
  static shouldAutoApproveStage(
    requester: SmartUser,
    stage: WorkflowStage,
    request: SmartRequest
  ): boolean {
    switch (stage) {
      case "pending_head":
        return !!requester.is_head;
      case "pending_comptroller":
        return !!requester.is_comptroller;
      case "pending_hr":
        return !!requester.is_hr;
      case "pending_exec":
        return !!requester.is_exec;
      default:
        return false;
    }
  }

  /**
   * 💰 BUDGET INTELLIGENCE: Check if comptroller stage is required
   */
  static requiresComptroller(request: SmartRequest): boolean {
    return request.requires_budget === true;
  }

  /**
   * 🔄 HR ACKNOWLEDGMENT: Check if HR needs to acknowledge budget changes
   */
  static requiresHrAcknowledgment(request: SmartRequest): boolean {
    return request.hr_budget_ack_required === true;
  }

  /**
   * ⚡ EXECUTIVE HIERARCHY: Determine executive approval level
   */
  static determineExecutiveLevel(
    request: SmartRequest,
    requester: SmartUser
  ): ExecLevel {
    // If requester is President, auto-approve (dual-signature)
    if (requester.exec_type === "president") {
      return "auto_approve";
    }

    // If requester is VP, needs President approval
    if (requester.exec_type === "vp") {
      return "president";
    }

    // High-value or international requests need President
    if (
      (request.total_budget && request.total_budget > 50000) ||
      request.is_international
    ) {
      return "president";
    }

    // Standard requests go to VP
    return "vp";
  }

  /**
   * 🎯 SMART ROUTING: Get next workflow stage with intelligent skipping
   */
  static getNextStage(
    request: SmartRequest,
    currentStage: WorkflowStage
  ): WorkflowStage {
    const workflow: WorkflowStage[] = [
      "pending_head",
      "pending_admin",
      "pending_comptroller",
      "pending_hr",
      "pending_exec",
      "approved",
    ];

    let currentIndex = workflow.indexOf(currentStage);
    if (currentIndex === -1) return "approved";

    let nextIndex = currentIndex + 1;

    // Smart stage progression with auto-skip logic
    while (nextIndex < workflow.length) {
      const nextStage = workflow[nextIndex];

      // 💰 BUDGET SKIP: Skip comptroller if no budget
      if (nextStage === "pending_comptroller" && !this.requiresComptroller(request)) {
        console.log("🎯 SMART SKIP: No budget - bypassing Comptroller");
        request.comptroller_skipped = true;
        request.comptroller_skip_reason = "No budget requested";
        request.smart_skips_applied.push("comptroller_no_budget");
        nextIndex++;
        continue;
      }

      // 🔄 HR ACKNOWLEDGMENT: Insert HR ack substage if needed
      if (nextStage === "pending_hr" && this.requiresHrAcknowledgment(request)) {
        return "pending_hr_ack";
      }

      // 🎯 DUAL-SIGNATURE SKIP: Skip if signature already exists
      if (this.hasExistingSignature(request, nextStage)) {
        console.log(`🎯 SMART SKIP: ${nextStage} - signature already present`);
        nextIndex++;
        continue;
      }

      return nextStage;
    }

    return "approved";
  }

  /**
   * 🚀 DUAL-SIGNATURE MAGIC: Apply smart signature logic at request creation
   */
  static applyDualSignatureLogic(
    requester: SmartUser,
    signature: string,
    request: Partial<SmartRequest>
  ): Partial<SmartRequest> {
    const now = new Date();
    const result: Partial<SmartRequest> = {
      ...request,
      requester_signature: signature,
      requester_signed_at: now,
      smart_skips_applied: [],
    };

    // 🎯 HEAD AUTO-APPROVAL
    if (requester.is_head) {
      result.head_signature = signature;
      result.head_signed_at = now;
      result.head_approved_by = requester.id;
      result.head_skipped = true;
      result.head_skip_reason = "Self-request (dual-signature)";
      result.smart_skips_applied?.push("head_self_request");
      console.log("🎯 SMART SKIP: Head approval auto-completed (dual-signature)");
    }

    // 💰 COMPTROLLER AUTO-APPROVAL
    if (requester.is_comptroller) {
      result.comptroller_signature = signature;
      result.comptroller_signed_at = now;
      result.comptroller_approved_by = requester.id;
      result.comptroller_skipped = true;
      result.comptroller_skip_reason = "Self-request (dual-signature)";
      result.smart_skips_applied?.push("comptroller_self_request");
      console.log("🎯 SMART SKIP: Comptroller approval auto-completed (dual-signature)");
    }

    // 👥 HR AUTO-APPROVAL
    if (requester.is_hr) {
      result.hr_signature = signature;
      result.hr_signed_at = now;
      result.hr_approved_by = requester.id;
      result.hr_skipped = true;
      result.hr_skip_reason = "Self-request (dual-signature)";
      result.smart_skips_applied?.push("hr_self_request");
      console.log("🎯 SMART SKIP: HR approval auto-completed (dual-signature)");
    }

    // 👔 EXECUTIVE AUTO-APPROVAL
    if (requester.is_exec) {
      const execLevel = this.determineExecutiveLevel(request as SmartRequest, requester);
      
      if (execLevel === "auto_approve") {
        result.exec_signature = signature;
        result.exec_signed_at = now;
        result.exec_approved_by = requester.id;
        result.exec_skipped = true;
        result.exec_skip_reason = "Self-request (President dual-signature)";
        result.smart_skips_applied?.push("exec_president_self_request");
        console.log("🎯 SMART SKIP: Executive approval auto-completed (President dual-signature)");
      }
      
      result.exec_level = execLevel;
    }

    return result;
  }

  /**
   * 🏢 PARENT DEPARTMENT ROUTING: Determine approval routing
   */
  static determineHeadApprovalRoute(
    requester: SmartUser,
    department: SmartDepartment,
    routingChoice: DepartmentRouting
  ): {
    skip_head: boolean;
    route_to?: string;
    next_stage: WorkflowStage;
    routing_note: string;
  } {
    if (requester.is_head) {
      if (routingChoice === "own_office") {
        return {
          skip_head: true,
          next_stage: "pending_admin",
          routing_note: "Auto-approved: Head requesting for own office"
        };
      } else if (routingChoice === "parent_dept" && department.parent_department_id) {
        return {
          skip_head: false,
          route_to: department.parent_department_id,
          next_stage: "pending_head",
          routing_note: "Routed to parent department head for approval"
        };
      }
    }

    return {
      skip_head: false,
      next_stage: "pending_head",
      routing_note: "Standard head approval required"
    };
  }

  /**
   * 🔄 BUDGET MODIFICATION HANDLER: Handle comptroller budget changes
   */
  static handleBudgetModification(
    request: SmartRequest,
    originalBudget: number,
    newBudget: number,
    comptrollerId: string
  ): {
    status: WorkflowStage;
    notification?: {
      to: string;
      message: string;
      action_required: string;
    };
    workflow_note: string;
  } {
    if (originalBudget !== newBudget) {
      // Budget was modified - require HR acknowledgment
      request.budget_version += 1;
      request.budget_last_modified_at = new Date();
      request.budget_last_modified_by = comptrollerId;
      request.hr_budget_ack_required = true;

      return {
        status: "pending_hr_ack",
        notification: {
          to: "hr_director",
          message: `⚠️ Budget modified by Comptroller: ₱${originalBudget.toLocaleString()} → ₱${newBudget.toLocaleString()}`,
          action_required: "Review and acknowledge budget changes"
        },
        workflow_note: "Budget modified - HR acknowledgment required"
      };
    } else {
      // Budget unchanged - proceed normally
      return {
        status: this.getNextStage(request, "pending_comptroller"),
        workflow_note: "Budget approved without changes"
      };
    }
  }

  /**
   * 📊 WORKFLOW ANALYTICS: Get smart workflow metrics
   */
  static getWorkflowAnalytics(request: SmartRequest): {
    total_stages: number;
    skipped_stages: number;
    efficiency_percentage: number;
    time_saved_estimate: string;
    smart_features_used: string[];
  } {
    const totalPossibleStages = 5; // head, admin, comptroller, hr, exec
    const skippedStages = request.smart_skips_applied?.length || 0;
    const efficiency = Math.round(((skippedStages / totalPossibleStages) * 100));
    
    return {
      total_stages: totalPossibleStages,
      skipped_stages: skippedStages,
      efficiency_percentage: efficiency,
      time_saved_estimate: `${skippedStages * 0.5} days`,
      smart_features_used: request.smart_skips_applied || []
    };
  }

  /**
   * 🎨 UI HELPERS: Get smart status display info
   */
  static getSmartStatusInfo(request: SmartRequest): {
    text: string;
    icon: string;
    color: string;
    description: string;
  } {
    const skips = request.smart_skips_applied || [];
    
    if (skips.length > 0) {
      return {
        text: `Smart Skip Active (${skips.length} stages)`,
        icon: "🎯",
        color: "bg-blue-100 text-blue-800",
        description: `Intelligent workflow optimization saved ${skips.length} approval steps`
      };
    }

    if (request.status === "pending_hr_ack") {
      return {
        text: "Budget Change Acknowledgment",
        icon: "🔄",
        color: "bg-orange-100 text-orange-800",
        description: "HR needs to acknowledge Comptroller's budget modifications"
      };
    }

    return {
      text: this.getStandardStatusText(request.status),
      icon: "📋",
      color: "bg-gray-100 text-gray-800",
      description: "Standard workflow progression"
    };
  }

  /**
   * 📝 STANDARD STATUS: Get regular status text
   */
  private static getStandardStatusText(status: WorkflowStage): string {
    const statusMap: Record<WorkflowStage, string> = {
      "pending_head": "Pending Head Approval",
      "pending_admin": "Pending Admin Processing",
      "pending_comptroller": "Pending Budget Review",
      "pending_hr": "Pending HR Approval",
      "pending_hr_ack": "Pending HR Acknowledgment",
      "pending_exec": "Pending Executive Approval",
      "approved": "Approved",
      "rejected": "Rejected",
      "cancelled": "Cancelled"
    };
    
    return statusMap[status] || status;
  }

  /**
   * ✅ VALIDATION: Check if user can approve at current stage
   */
  static canUserApproveStage(
    user: SmartUser,
    stage: WorkflowStage,
    request: SmartRequest
  ): boolean {
    switch (stage) {
      case "pending_head":
        return !!user.is_head;
      case "pending_admin":
        return !!user.is_admin;
      case "pending_comptroller":
        return !!user.is_comptroller;
      case "pending_hr":
      case "pending_hr_ack":
        return !!user.is_hr;
      case "pending_exec":
        if (!user.is_exec) return false;
        
        // Check executive level requirements
        if (request.exec_level === "president") {
          return user.exec_type === "president";
        }
        return true; // VP or President can approve VP-level requests
      default:
        return false;
    }
  }

  /**
   * 🎉 WOW FACTOR: Generate success message with smart features highlighted
   */
  static generateSuccessMessage(request: SmartRequest): string {
    const analytics = this.getWorkflowAnalytics(request);
    
    if (analytics.skipped_stages > 0) {
      return `🎯 Smart Workflow Success! Automatically skipped ${analytics.skipped_stages} redundant approval${analytics.skipped_stages > 1 ? 's' : ''}, saving approximately ${analytics.time_saved_estimate}. Efficiency boost: ${analytics.efficiency_percentage}%!`;
    }
    
    return "✅ Request processed successfully through standard workflow.";
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * CONVENIENCE EXPORTS
 * ═══════════════════════════════════════════════════════════════════════
 */

// Convenience alias for the main engine
export const SmartWorkflow = SmartWorkflowEngine;
