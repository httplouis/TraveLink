// RBAC Helper Functions - Ground Truth Implementation
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = 'head' | 'hr' | 'comptroller' | 'exec' | 'admin';
export type ApprovalStep = 'head' | 'comptroller' | 'hr' | 'exec';

/**
 * Get active heads for a department
 * NEW: Simple approach - find users with is_head=true for this department
 */
export async function findHeads(departmentId: string, atTime = new Date()) {
  const supabase = await createSupabaseServerClient(true);
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('department_id', departmentId)
    .eq('is_head', true);

  if (error) {
    console.error('findHeads error:', error);
    return [];
  }

  // Return in compatible format
  return (data || []).map(user => ({
    user_id: user.id,
    is_primary: true,
    users: {
      id: user.id,
      full_name: user.name,
      email: user.email
    }
  }));
}

/**
 * Check if user has an active role grant
 * Ground Truth: role_grants table is source of truth, NOT directory
 */
export async function hasRoleGrant(userId: string, role: Role) {
  const supabase = await createSupabaseServerClient(true);
  
  const { data, error } = await supabase
    .from('role_grants')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .is('revoked_at', null)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Get all departments a user is head of
 * NEW: Simple approach - user has is_head flag and department_id
 */
export async function getUserDepartments(userId: string) {
  const supabase = await createSupabaseServerClient(true);
  
  // Get user's department if they are a head
  const { data: user, error } = await supabase
    .from('users')
    .select('department_id, is_head, departments(id, code, name)')
    .eq('id', userId)
    .eq('is_head', true)
    .single();

  if (error || !user || !user.department_id) {
    return [];
  }

  // Return in same format as before for compatibility
  return [{
    department_id: user.department_id,
    is_primary: true,
    departments: user.departments
  }];
}

/**
 * Determine next approval step after head approval
 * Ground Truth: If totalBudget > 0 OR vehicleMode != 'none' → comptroller_pending, else → hr_pending
 */
export function nextAfterHead(totalBudget: number, vehicleMode: string): string {
  if (Number(totalBudget) > 0 || (vehicleMode && vehicleMode !== 'none')) {
    return 'comptroller_pending';
  }
  return 'hr_pending';
}

/**
 * Route request to appropriate heads on submission
 * Ground Truth: If no heads found → admin_review with NO_DEPARTMENT_HEAD reason
 */
export async function routeToHeads(requestId: string, departmentId: string) {
  const supabase = await createSupabaseServerClient(true);
  
  const heads = await findHeads(departmentId);
  
  if (heads.length === 0) {
    // No heads found - route to admin for triage
    await supabase
      .from('requests')
      .update({ 
        current_status: 'admin_review',
        admin_notes: 'NO_DEPARTMENT_HEAD - requires admin triage'
      })
      .eq('id', requestId);
    
    return { ok: false, reason: 'NO_DEPARTMENT_HEAD' };
  }

  // Create approval tasks for each head (ANY_ONE policy by default)
  const approvals = heads.map(head => ({
    request_id: requestId,
    step: 'head' as ApprovalStep,
    approver_id: head.user_id,
    action: 'pending',
    created_at: new Date().toISOString(),
  }));

  await supabase.from('approvals').insert(approvals);
  
  await supabase
    .from('requests')
    .update({ current_status: 'pending_head' })
    .eq('id', requestId);

  return { ok: true, heads: heads.length };
}

/**
 * Handle head approval (ANY_ONE policy)
 * Ground Truth: First approval wins, lock others, advance to next step
 */
export async function onHeadApprove(
  requestId: string, 
  approverId: string, 
  signature: string,
  approverName: string
) {
  const supabase = await createSupabaseServerClient(true);
  
  // Get request
  const { data: request } = await supabase
    .from('requests')
    .select('current_status, total_budget, vehicle_mode')
    .eq('id', requestId)
    .single();

  if (!request || request.current_status !== 'pending_head') {
    return { ok: false, error: 'Request not in pending_head status' };
  }

  // Mark this head's approval
  await supabase
    .from('approvals')
    .update({
      action: 'approve',
      signature,
      approved_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .eq('approver_id', approverId)
    .eq('step', 'head');

  // Lock other head approvals (ANY_ONE policy)
  await supabase
    .from('approvals')
    .update({ action: 'locked' })
    .eq('request_id', requestId)
    .eq('step', 'head')
    .eq('action', 'pending')
    .neq('approver_id', approverId);

  // Advance to next step
  const nextStatus = nextAfterHead(
    request.total_budget || 0, 
    request.vehicle_mode || 'none'
  );

  await supabase
    .from('requests')
    .update({ 
      current_status: 'head_approved',
      head_approved_by: approverName,
      head_approved_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  // Move to next step
  await supabase
    .from('requests')
    .update({ current_status: nextStatus })
    .eq('id', requestId);

  return { ok: true, nextStatus };
}

/**
 * Handle head rejection
 * Ground Truth: Return to requester, preserve all data
 */
export async function onHeadReject(
  requestId: string,
  approverId: string,
  reason: string
) {
  const supabase = await createSupabaseServerClient(true);

  await supabase
    .from('approvals')
    .update({
      action: 'reject',
      reason,
      approved_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .eq('approver_id', approverId)
    .eq('step', 'head');

  await supabase
    .from('requests')
    .update({ 
      current_status: 'rejected',
      rejected_by_step: 'head',
      rejection_reason: reason,
    })
    .eq('id', requestId);

  return { ok: true };
}

/**
 * Auto-grant head role on login (DEPRECATED - not used in new workflow)
 * NEW: Head role is determined by is_head flag on users table
 */
export async function autoGrantFromRoster(userEmail: string) {
  // This function is deprecated in the new workflow system
  // Head status is now determined by the is_head flag on users table
  // No roster system needed
  return { granted: false };
}
