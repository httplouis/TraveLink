// TraviLink Workflow Engine
// Implements complete approval flow logic

import type { RequestStatus, ApproverRole, RequestType } from './types';

/**
 * WORKFLOW RULES (from requirements):
 * 
 * TRAVEL ORDER / SEMINAR:
 * 
 * Scenario 1 - Faculty Request from Office (e.g., WCDEO under CCMS):
 * requester → office_head → parent_dept_head → admin → [comptroller] → hr → exec
 * 
 * Scenario 2 - Faculty Request from Department (no parent):
 * requester → dept_head → admin → [comptroller] → hr → exec
 * 
 * Scenario 3 - Head Request:
 * head → admin → [comptroller] → hr → exec
 * 
 * SPECIAL RULES:
 * - If department has parent_department_id, approval goes: office head → parent head → admin
 * - If no parent_department_id, approval goes: dept head → admin (original flow)
 * - Head must be included in faculty travel requests
 * - Head can send representative
 * - Comptroller only if has_budget = true
 * - 5 requests per day limit
 * - Can't request if department budget exhausted
 * - Ma'am TM (admin) and Comptroller are both admin role
 * - After exec approval, goes back to admin for final processing
 */

export class WorkflowEngine {
  /**
   * Determine the initial status when creating a new request
   */
  static getInitialStatus(requesterIsHead: boolean): RequestStatus {
    if (requesterIsHead) {
      // Head request: skip head approval, go directly to admin
      return 'pending_admin';
    } else {
      // Faculty request: must get head approval first
      return 'pending_head';
    }
  }

  /**
   * Determine the next status after an approval
   * @param hasParentDepartment - Whether the department has a parent (for office hierarchy)
   * @param requesterRole - Role of requester: 'head', 'faculty', 'director', 'dean', etc.
   * @param headIncluded - Whether head is included in travel (for faculty requests)
   */
  static getNextStatus(
    currentStatus: RequestStatus,
    requesterIsHead: boolean,
    hasBudget: boolean,
    hasParentDepartment: boolean = false,
    requesterRole?: string,
    headIncluded: boolean = false
  ): RequestStatus {
    switch (currentStatus) {
      case 'draft':
        return this.getInitialStatus(requesterIsHead);

      case 'pending_head':
        // After office/dept head approval, check if parent department exists
        if (hasParentDepartment) {
          // Has parent: go to parent department head next (e.g., WCDEO → CCMS Dean)
          return 'pending_parent_head';
        }
        // No parent: go directly to admin (original flow)
        return 'pending_admin';

      case 'pending_parent_head':
        // After parent head approval, go to admin
        return 'pending_admin';

      case 'pending_admin':
        // After admin processing, check budget to determine next step
        // Note: both_vps_approved is handled in API endpoints - requests still go through admin/comptroller
        // The flag is just an acknowledgment that both VPs have signed for multi-department requests
        if (hasBudget) {
          // Has budget: must go to comptroller for budget verification
          return 'pending_comptroller';
        } else {
          // No budget: skip comptroller, go directly to HR
          return 'pending_hr';
        }

      case 'pending_comptroller':
        // After comptroller approval, go to HR
        // NOTE: Comptroller may send back to requester for payment confirmation first
        // This is handled by the API endpoint, not here
        return 'pending_hr';

      case 'pending_hr':
        // After HR approval, determine next based on requester type
        // Head/Director/Dean → President (via exec)
        // Faculty + Head → VP only
        // Faculty alone → Should not reach here (validation prevents)
        if (requesterIsHead || requesterRole === 'director' || requesterRole === 'dean') {
          // Head/Director/Dean must go to President
          return 'pending_exec'; // Will be routed to President
        } else {
          // Faculty + Head included → VP only (not President)
          return 'pending_exec'; // Will be routed to VP
        }

      case 'pending_exec':
        // After executive approval, check if head requester
        // Head requester skips VP → goes directly to President
        // If already approved by President, fully approved
        // Otherwise, if VP approved and head requester, go to President
        // This logic is handled in the API endpoint based on exec_type
        return 'approved';

      case 'approved':
      case 'rejected':
      case 'cancelled':
        // Terminal states - no next status
        return currentStatus;

      default:
        throw new Error(`Unknown status: ${currentStatus}`);
    }
  }

  /**
   * Get the approver role for a given status
   */
  static getApproverRole(status: RequestStatus): ApproverRole | null {
    switch (status) {
      case 'pending_head':
      case 'pending_parent_head':  // Parent head is also a "head" role
        return 'head';
      case 'pending_admin':
        return 'admin';
      case 'pending_comptroller':
        return 'comptroller';
      case 'pending_hr':
        return 'hr';
      case 'pending_exec':
        return 'exec';
      default:
        return null;
    }
  }

  /**
   * Check if a user can approve a request based on their role
   */
  static canApprove(
    userRole: string,
    userIsHead: boolean,
    userIsHR: boolean,
    userIsExec: boolean,
    userIsAdmin: boolean,
    requestStatus: RequestStatus
  ): boolean {
    switch (requestStatus) {
      case 'pending_head':
      case 'pending_parent_head':  // Both head statuses require head role
        return userIsHead;

      case 'pending_admin':
        // Ma'am TM (admin role) processes this
        return userIsAdmin || userRole === 'admin';

      case 'pending_comptroller':
        // Comptroller is part of admin
        return userIsAdmin || userRole === 'admin';

      case 'pending_hr':
        return userIsHR;

      case 'pending_exec':
        return userIsExec;

      default:
        return false;
    }
  }

  /**
   * Validate if a request can be created based on business rules
   * CRITICAL RULE: Faculty alone cannot travel - must have head included
   */
  static async validateNewRequest(params: {
    requestDate: Date;
    requesterIsHead: boolean;
    headIncluded: boolean;
    hasBudget: boolean;
    totalBudget: number;
    departmentBudgetRemaining: number;
    needsVehicle: boolean;
    dailyVehicleRequestCount: number;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Rule 1: Faculty requests MUST include department head (cannot travel alone)
    if (!params.requesterIsHead && !params.headIncluded) {
      errors.push('Faculty members cannot travel alone. The department head must be included in travel participants.');
    }

    // Rule 2: Check daily VEHICLE request limit (5 per day)
    // NOTE: This limit only applies to requests that need vehicles!
    // If no vehicle needed, unlimited requests allowed
    if (params.needsVehicle && params.dailyVehicleRequestCount >= 5) {
      errors.push('Daily vehicle request limit reached (5 vehicle requests per day). Try a date with available vehicles.');
    }

    // Rule 3: Check department budget availability
    if (params.hasBudget && params.totalBudget > 0) {
      if (params.departmentBudgetRemaining < params.totalBudget) {
        errors.push(
          `Insufficient department budget. Requested: ₱${params.totalBudget.toFixed(2)}, ` +
          `Available: ₱${params.departmentBudgetRemaining.toFixed(2)}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get workflow progress percentage
   */
  static getProgressPercentage(
    status: RequestStatus,
    requesterIsHead: boolean,
    hasBudget: boolean
  ): number {
    // Calculate total steps based on workflow path
    let totalSteps = 5; // admin, hr, exec + 2 for start/end

    if (!requesterIsHead) {
      totalSteps++; // Add head approval step
    }

    if (hasBudget) {
      totalSteps++; // Add comptroller step
    }

    // Calculate completed steps
    let completedSteps = 1; // Started

    if (status === 'pending_admin' || this.isAfterStatus(status, 'pending_admin')) {
      if (!requesterIsHead) completedSteps++; // Head approved
    }

    if (status === 'pending_comptroller' || this.isAfterStatus(status, 'pending_comptroller')) {
      completedSteps++; // Admin processed
    }

    if (status === 'pending_hr' || this.isAfterStatus(status, 'pending_hr')) {
      completedSteps++; // Comptroller approved (if applicable)
      if (hasBudget) completedSteps++;
    }

    if (status === 'pending_exec' || this.isAfterStatus(status, 'pending_exec')) {
      completedSteps++; // HR approved
    }

    if (status === 'approved') {
      completedSteps = totalSteps; // All steps complete
    }

    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Helper: Check if current status is after a given status in workflow
   */
  private static isAfterStatus(current: RequestStatus, check: RequestStatus): boolean {
    const order: RequestStatus[] = [
      'draft',
      'pending_head',
      'pending_admin',
      'pending_comptroller',
      'pending_hr',
      'pending_exec',
      'approved',
    ];

    const currentIndex = order.indexOf(current);
    const checkIndex = order.indexOf(check);

    return currentIndex > checkIndex;
  }

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: RequestStatus): string {
    const labels: Record<RequestStatus, string> = {
      draft: 'Draft',
      pending_head: 'Pending Head Approval',
      pending_parent_head: 'Pending Parent Department Head',
      pending_admin: 'Pending Admin Processing',
      pending_comptroller: 'Pending Comptroller Review',
      pending_hr: 'Pending HR Approval',
      pending_exec: 'Pending Executive Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };

    return labels[status] || status;
  }

  /**
   * Get workflow steps for display
   */
  static getWorkflowSteps(
    requesterIsHead: boolean,
    hasBudget: boolean
  ): Array<{ role: string; label: string; required: boolean }> {
    const steps: Array<{ role: string; label: string; required: boolean }> = [];

    if (!requesterIsHead) {
      steps.push({ role: 'head', label: 'Department Head', required: true });
    }

    steps.push({ role: 'admin', label: 'Admin (Ma\'am TM)', required: true });

    if (hasBudget) {
      steps.push({ role: 'comptroller', label: 'Comptroller', required: true });
    }

    steps.push({ role: 'hr', label: 'HR', required: true });
    steps.push({ role: 'exec', label: 'Executive', required: true });

    return steps;
  }
}
