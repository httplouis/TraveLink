/**
 * Workflow Helper Functions for Dual-Signature and Multi-Role Logic
 * Travelink Design System v2.0
 */

export type WorkflowStage =
  | "pending_head"
  | "pending_admin"
  | "pending_comptroller"
  | "pending_hr"
  | "pending_exec"
  | "approved"
  | "rejected"
  | "cancelled";

export interface Request {
  id: string;
  requester_id: string;
  status: WorkflowStage;
  requester_signature?: string | null;
  head_signature?: string | null;
  head_approved_by?: string | null;
  admin_signature?: string | null;
  admin_approved_by?: string | null;
  comptroller_signature?: string | null;
  comptroller_approved_by?: string | null;
  hr_signature?: string | null;
  hr_approved_by?: string | null;
  exec_signature?: string | null;
  exec_approved_by?: string | null;
  exec_level?: "vp" | "president" | null;
  total_budget?: number;
  is_international?: boolean;
}

export interface User {
  id: string;
  is_head?: boolean;
  is_admin?: boolean;
  is_comptroller?: boolean;
  is_hr?: boolean;
  is_executive?: boolean;
  exec_type?: "vp" | "president" | null;
  department_id?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// STAGE VALIDATION & CHECKING
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if a stage already has a signature (used for skipping in workflow)
 */
export function hasExistingSignature(
  request: Request,
  stage: WorkflowStage
): boolean {
  switch (stage) {
    case "pending_head":
      return !!request.head_signature;
    case "pending_comptroller":
      return !!request.comptroller_signature;
    case "pending_hr":
      return !!request.hr_signature;
    case "pending_exec":
      return !!request.exec_signature;
    case "pending_admin":
      // Admin stage never has pre-existing signature
      return false;
    default:
      return false;
  }
}

/**
 * Check if the requester should auto-approve a stage (dual-signature scenario)
 */
export function shouldAutoApproveStage(
  request: Request,
  requester: User,
  stage: WorkflowStage
): boolean {
  switch (stage) {
    case "pending_head":
      return !!requester.is_head;
    case "pending_comptroller":
      return !!requester.is_comptroller;
    case "pending_hr":
      return !!requester.is_hr;
    case "pending_exec":
      return !!requester.is_executive;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WORKFLOW PROGRESSION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get the next workflow stage, automatically skipping stages with existing signatures
 */
export function getNextStage(
  request: Request,
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
  if (currentIndex === -1) return "approved"; // Invalid stage, default to approved

  let nextIndex = currentIndex + 1;

  // Skip stages that already have signatures
  while (nextIndex < workflow.length) {
    const nextStage = workflow[nextIndex];

    // Check if this stage already has a signature
    if (hasExistingSignature(request, nextStage)) {
      console.log(`Skipping ${nextStage} - signature already present`);
      nextIndex++;
      continue;
    }

    return nextStage;
  }

  return "approved";
}

/**
 * Determine which executive level should approve the request
 */
export function determineExecutiveApprover(
  request: Request,
  requester: User
): "vp" | "president" | "auto_approve" {
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

// ═══════════════════════════════════════════════════════════════════════
// DUAL-SIGNATURE LOGIC
// ═══════════════════════════════════════════════════════════════════════

/**
 * Apply dual-signature logic when creating a request
 * Returns object with signature fields to set
 */
export function applyDualSignatureLogic(
  requester: User,
  signature: string
): {
  requester_signature: string;
  head_signature?: string;
  head_approved_by?: string;
  head_approved_at?: Date;
  comptroller_signature?: string;
  comptroller_approved_by?: string;
  comptroller_approved_at?: Date;
  hr_signature?: string;
  hr_approved_by?: string;
  hr_approved_at?: Date;
  exec_signature?: string;
  exec_approved_by?: string;
  exec_approved_at?: Date;
} {
  const now = new Date();
  const result: any = {
    requester_signature: signature,
  };

  // If requester is a department head
  if (requester.is_head) {
    result.head_signature = signature;
    result.head_approved_by = requester.id;
    result.head_approved_at = now;
  }

  // If requester is comptroller
  if (requester.is_comptroller) {
    result.comptroller_signature = signature;
    result.comptroller_approved_by = requester.id;
    result.comptroller_approved_at = now;
  }

  // If requester is HR
  if (requester.is_hr) {
    result.hr_signature = signature;
    result.hr_approved_by = requester.id;
    result.hr_approved_at = now;
  }

  // If requester is Executive
  if (requester.is_executive) {
    result.exec_signature = signature;
    result.exec_approved_by = requester.id;
    result.exec_approved_at = now;
  }

  return result;
}

/**
 * Get initial workflow stage based on requester's roles
 * Skips stages where requester has already signed
 */
export function getInitialWorkflowStage(
  requester: User,
  requiresBudgetApproval: boolean = true
): WorkflowStage {
  // If requester is department head, skip head stage
  if (requester.is_head) {
    return "pending_admin";
  }

  // Otherwise, start from head
  return "pending_head";
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate that user can approve at a given stage
 */
export function canUserApproveStage(
  user: User,
  stage: WorkflowStage,
  request: Request
): boolean {
  // Cannot approve own request (unless dual-signature scenario)
  // This check is done separately in API

  switch (stage) {
    case "pending_head":
      return !!user.is_head;
    case "pending_admin":
      return !!user.is_admin;
    case "pending_comptroller":
      return !!user.is_comptroller;
    case "pending_hr":
      return !!user.is_hr;
    case "pending_exec":
      // Check if user has the correct executive level
      if (!user.is_executive) return false;
      
      const requiredLevel = request.exec_level || "vp";
      if (requiredLevel === "president") {
        return user.exec_type === "president";
      }
      return true; // VP or President can approve VP-level requests
    default:
      return false;
  }
}

/**
 * Get human-readable stage name
 */
export function getStageName(stage: WorkflowStage): string {
  const stageNames: Record<WorkflowStage, string> = {
    pending_head: "Department Head Approval",
    pending_admin: "Admin Assignment",
    pending_comptroller: "Comptroller Review",
    pending_hr: "HR Review",
    pending_exec: "Executive Approval",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return stageNames[stage] || stage;
}

/**
 * Get all stages in order
 */
export function getAllStages(): WorkflowStage[] {
  return [
    "pending_head",
    "pending_admin",
    "pending_comptroller",
    "pending_hr",
    "pending_exec",
    "approved",
  ];
}

/**
 * Check if a stage is before another in the workflow
 */
export function isStageBefore(
  stage1: WorkflowStage,
  stage2: WorkflowStage
): boolean {
  const stages = getAllStages();
  return stages.indexOf(stage1) < stages.indexOf(stage2);
}

/**
 * Check if request is in a pending state
 */
export function isPending(status: WorkflowStage): boolean {
  return status.startsWith("pending_");
}

/**
 * Check if request is in a final state
 */
export function isFinal(status: WorkflowStage): boolean {
  return ["approved", "rejected", "cancelled"].includes(status);
}
