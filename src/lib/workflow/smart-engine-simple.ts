/**
 * SIMPLIFIED SMART WORKFLOW ENGINE - Error-Free Version
 * Use this if the main smart-engine.ts has issues
 */

export type WorkflowStage = "pending_head" | "pending_admin" | "pending_comptroller" | "pending_hr" | "pending_exec" | "approved";

export interface SmartUser {
  id: string;
  is_head?: boolean;
  is_admin?: boolean;
  is_comptroller?: boolean;
  is_hr?: boolean;
  is_exec?: boolean;
  exec_type?: "vp" | "president";
}

export interface SmartRequest {
  id: string;
  status: WorkflowStage;
  requires_budget?: boolean;
  total_budget?: number;
  is_international?: boolean;
  smart_skips_applied?: string[];
}

export class SmartWorkflowEngine {
  
  static shouldAutoApproveStage(user: SmartUser, stage: WorkflowStage): boolean {
    switch (stage) {
      case "pending_head":
        return !!user.is_head;
      case "pending_comptroller":
        return !!user.is_comptroller;
      case "pending_hr":
        return !!user.is_hr;
      case "pending_exec":
        return !!user.is_exec;
      default:
        return false;
    }
  }

  static requiresComptroller(request: SmartRequest): boolean {
    return request.requires_budget === true;
  }

  static determineExecutiveLevel(request: SmartRequest, user: SmartUser): string {
    if (user.exec_type === "president") return "auto_approve";
    if (user.exec_type === "vp") return "president";
    if ((request.total_budget && request.total_budget > 50000) || request.is_international) {
      return "president";
    }
    return "vp";
  }

  static getWorkflowAnalytics(request: SmartRequest) {
    const skippedStages = request.smart_skips_applied?.length || 0;
    return {
      skipped_stages: skippedStages,
      efficiency_percentage: Math.round((skippedStages / 5) * 100),
      time_saved_estimate: `${skippedStages * 0.5} days`,
      smart_features_used: request.smart_skips_applied || []
    };
  }

  static generateSuccessMessage(request: SmartRequest): string {
    const analytics = this.getWorkflowAnalytics(request);
    if (analytics.skipped_stages > 0) {
      return `🎯 Smart Skip Success! ${analytics.skipped_stages} stages skipped, ${analytics.efficiency_percentage}% faster!`;
    }
    return "✅ Request processed successfully.";
  }
}

// Export for convenience
export const SmartWorkflow = SmartWorkflowEngine;
