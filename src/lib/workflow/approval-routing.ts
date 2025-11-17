// src/lib/workflow/approval-routing.ts
/**
 * Enhanced approval routing logic based on user requirements
 * Handles complex hierarchy and choice-based sending
 */

import type { RequestStatus } from './types';

export interface RoutingDecision {
  nextStatus: RequestStatus;
  nextApproverRole: 'admin' | 'comptroller' | 'hr' | 'vp' | 'president' | 'requester';
  requiresChoice: boolean; // Whether approver needs to choose recipient
  availableOptions: Array<{
    id: string;
    role: string;
    label: string;
  }>;
  skipVP?: boolean; // For head requester → skip VP → go to President
}

/**
 * Determine routing after head approval
 */
export function routeAfterHeadApproval(params: {
  requesterIsHead: boolean;
  hasParentDepartment: boolean;
  hasBudget: boolean;
  nextApproverId?: string;
  nextApproverRole?: string;
  returnToRequester?: boolean;
}): RoutingDecision {
  if (params.returnToRequester) {
    return {
      nextStatus: 'draft',
      nextApproverRole: 'requester',
      requiresChoice: false,
      availableOptions: []
    };
  }

  if (params.hasParentDepartment) {
    return {
      nextStatus: 'pending_parent_head',
      nextApproverRole: 'head',
      requiresChoice: true,
      availableOptions: [] // Will be populated by API with actual parent heads
    };
  }

  // Go to admin
  return {
    nextStatus: 'pending_admin',
    nextApproverRole: 'admin',
    requiresChoice: params.nextApproverId ? false : true, // If specific admin selected, no choice needed
    availableOptions: [] // Will be populated by API with available admins
  };
}

/**
 * Determine routing after admin approval
 */
export function routeAfterAdminApproval(params: {
  hasBudget: boolean;
  nextApproverId?: string;
  nextApproverRole?: string;
}): RoutingDecision {
  if (params.hasBudget) {
    return {
      nextStatus: 'pending_comptroller',
      nextApproverRole: 'comptroller',
      requiresChoice: params.nextApproverId ? false : true,
      availableOptions: [] // Will be populated by API
    };
  }

  // No budget: skip comptroller, go to HR
  return {
    nextStatus: 'pending_hr',
    nextApproverRole: 'hr',
    requiresChoice: params.nextApproverId ? false : true,
    availableOptions: [] // Will be populated by API
  };
}

/**
 * Determine routing after comptroller approval
 * Special case: Comptroller may send back to requester for payment confirmation
 */
export function routeAfterComptrollerApproval(params: {
  paymentConfirmed: boolean;
  sendToRequester: boolean;
  nextApproverId?: string;
}): RoutingDecision {
  if (params.sendToRequester && !params.paymentConfirmed) {
    // Send back to requester for payment
    return {
      nextStatus: 'pending_comptroller', // Stay in comptroller stage but waiting for payment
      nextApproverRole: 'requester',
      requiresChoice: false,
      availableOptions: []
    };
  }

  // Payment confirmed or not needed: go to HR
  return {
    nextStatus: 'pending_hr',
    nextApproverRole: 'hr',
    requiresChoice: params.nextApproverId ? false : true,
    availableOptions: [] // Will be populated by API
  };
}

/**
 * Determine routing after HR approval
 */
export function routeAfterHRApproval(params: {
  requesterIsHead: boolean;
  requesterRole?: string; // 'head', 'director', 'dean', 'faculty'
  headIncluded: boolean;
  nextApproverId?: string;
}): RoutingDecision {
  // Head/Director/Dean → Must go to President
  if (params.requesterIsHead || params.requesterRole === 'director' || params.requesterRole === 'dean') {
    return {
      nextStatus: 'pending_exec',
      nextApproverRole: 'president',
      requiresChoice: params.nextApproverId ? false : true,
      availableOptions: [], // Will be populated with President/COO
      skipVP: true // Head requester skips VP
    };
  }

  // Faculty + Head included → VP only (not President)
  if (!params.requesterIsHead && params.headIncluded) {
    return {
      nextStatus: 'pending_exec',
      nextApproverRole: 'vp',
      requiresChoice: params.nextApproverId ? false : true,
      availableOptions: [] // Will be populated with VP External (Atty. Dario Opistan)
    };
  }

  // Faculty alone should not reach here (validation prevents)
  // But if it does, default to VP
  return {
    nextStatus: 'pending_exec',
    nextApproverRole: 'vp',
    requiresChoice: params.nextApproverId ? false : true,
    availableOptions: []
  };
}

/**
 * Determine routing after VP approval
 */
export function routeAfterVPApproval(params: {
  requesterIsHead: boolean;
  requesterRole?: string;
}): RoutingDecision {
  // If head/director/dean, should have gone to President already
  // VP approval means it's a faculty request, so fully approved
  return {
    nextStatus: 'approved',
    nextApproverRole: 'requester', // Final approval
    requiresChoice: false,
    availableOptions: []
  };
}

/**
 * Determine routing after President approval
 */
export function routeAfterPresidentApproval(): RoutingDecision {
  return {
    nextStatus: 'approved',
    nextApproverRole: 'requester', // Final approval
    requiresChoice: false,
    availableOptions: []
  };
}

