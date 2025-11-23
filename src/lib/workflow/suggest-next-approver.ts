// src/lib/workflow/suggest-next-approver.ts
/**
 * Smart suggestion logic for next approver based on workflow state
 */

export interface RequestContext {
  status: string;
  requester_is_head?: boolean;
  requester_role?: string;
  requester_is_comptroller?: boolean; // NEW: Check if requester is comptroller
  has_budget?: boolean;
  head_included?: boolean;
  parent_head_approved_at?: string | null;
  parent_head_approver?: any;
  requester_signature?: string | null;
  head_approved_at?: string | null;
  admin_approved_at?: string | null;
  comptroller_approved_at?: string | null;
  hr_approved_at?: string | null;
  vp_approved_at?: string | null;
  vp2_approved_at?: string | null;
  both_vps_approved?: boolean;
}

export interface SuggestedApprover {
  role: string;
  roleLabel: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Suggest the next approver based on current request state
 */
export function suggestNextApprover(context: RequestContext): SuggestedApprover | null {
  const {
    status,
    requester_is_head = false,
    requester_role,
    requester_is_comptroller = false,
    has_budget = false,
    head_included = false,
    parent_head_approved_at,
    parent_head_approver,
    requester_signature,
    head_approved_at,
    admin_approved_at,
    comptroller_approved_at,
    hr_approved_at,
    vp_approved_at,
    vp2_approved_at,
    both_vps_approved = false
  } = context;

  // Check if parent head who signed is a VP
  const parentHeadIsVP = parent_head_approver?.is_vp || 
                         parent_head_approver?.exec_type?.startsWith('vp_') || 
                         parent_head_approver?.exec_type?.startsWith('svp_') ||
                         parent_head_approver?.role === 'exec';

  // After Head Approval (pending_head → next)
  if (status === 'pending_head' && head_approved_at && requester_signature) {
    // Head approved, requester signed → Suggest Admin (Ma'am TM)
    return {
      role: 'admin',
      roleLabel: 'Administrator',
      reason: 'Request has been signed by requester and approved by head. Next step: Admin processing.',
      priority: 'high'
    };
  }

  // After Parent Head Approval (pending_parent_head → next)
  if (status === 'pending_parent_head' && parent_head_approved_at && requester_signature && head_approved_at) {
    // Parent head approved → Suggest Admin
    return {
      role: 'admin',
      roleLabel: 'Administrator',
      reason: 'Request approved by parent head. Next step: Admin processing.',
      priority: 'high'
    };
  }

  // After Admin Approval (pending_admin → next)
  if (status === 'pending_admin' && admin_approved_at) {
    // If requester is comptroller, skip comptroller stage and go directly to HR
    if (requester_is_comptroller || requester_role === 'comptroller') {
      return {
        role: 'hr',
        roleLabel: 'HR',
        reason: 'Requester is Comptroller (already approved). Next step: HR approval.',
        priority: 'high'
      };
    }
    
    if (has_budget) {
      // Has budget → Suggest Comptroller
      return {
        role: 'comptroller',
        roleLabel: 'Comptroller',
        reason: 'Request has budget. Next step: Comptroller review for budget verification.',
        priority: 'high'
      };
    } else {
      // No budget → Suggest HR
      return {
        role: 'hr',
        roleLabel: 'HR',
        reason: 'Request has no budget. Next step: HR approval.',
        priority: 'high'
      };
    }
  }

  // After Comptroller Approval (pending_comptroller → next)
  if (status === 'pending_comptroller' && comptroller_approved_at) {
    // Comptroller approved → Suggest HR
    return {
      role: 'hr',
      roleLabel: 'HR',
      reason: 'Budget verified by Comptroller. Next step: HR approval.',
      priority: 'high'
    };
  }

  // After HR Approval (pending_hr → next)
  if (status === 'pending_hr' && hr_approved_at) {
    // Check if parent head VP already signed - skip VP, go to President
    if (parent_head_approved_at && parentHeadIsVP) {
      return {
        role: 'president',
        roleLabel: 'President/COO',
        reason: 'Parent head (VP) already signed. Next step: President approval.',
        priority: 'high'
      };
    }

    // Head/Director/Dean requester → Must go to President
    if (requester_is_head || requester_role === 'director' || requester_role === 'dean') {
      return {
        role: 'president',
        roleLabel: 'President/COO',
        reason: 'Head/Director/Dean requester. Next step: President approval (required).',
        priority: 'high'
      };
    }

    // Faculty + Head included → VP only (not President)
    if (!requester_is_head && head_included) {
      return {
        role: 'vp',
        roleLabel: 'Vice President',
        reason: 'Faculty request with head included. Next step: VP approval (final).',
        priority: 'high'
      };
    }

    // Default: VP
    return {
      role: 'vp',
      roleLabel: 'Vice President',
      reason: 'Next step: VP approval.',
      priority: 'high'
    };
  }

  // After First VP Approval (pending_exec → next)
  if (status === 'pending_exec' && vp_approved_at && !vp2_approved_at && !both_vps_approved) {
    // First VP approved, but second hasn't
    // Check if this is a multi-department request that needs second VP
    // Otherwise, check if should go to President
    if (requester_is_head || requester_role === 'director' || requester_role === 'dean') {
      return {
        role: 'president',
        roleLabel: 'President/COO',
        reason: 'Head/Director/Dean requester. Next step: President approval.',
        priority: 'high'
      };
    }

    // If both VPs need to approve (multi-department), suggest second VP
    // Otherwise, if faculty + head, it's already approved
    if (head_included && !requester_is_head) {
      // Faculty + head → Already approved after first VP
      return null; // No suggestion needed, already approved
    }

    // Default: President
    return {
      role: 'president',
      roleLabel: 'President/COO',
      reason: 'First VP approved. Next step: President approval.',
      priority: 'high'
    };
  }

  // After Both VPs Approved (pending_exec → next)
  if (status === 'pending_exec' && both_vps_approved) {
    // Both VPs approved → Suggest President
    return {
      role: 'president',
      roleLabel: 'President/COO',
      reason: 'Both VPs approved. Next step: President approval (final).',
      priority: 'high'
    };
  }

  // No suggestion
  return null;
}

/**
 * Find suggested approver from options list
 */
export function findSuggestedApprover(
  suggestion: SuggestedApprover | null,
  options: Array<{ id: string; role: string; roleLabel?: string; name?: string; email?: string }>
): { id: string; name: string } | null {
  if (!suggestion) return null;

  // Find approver matching the suggested role
  const matching = options.filter(opt => {
    const optRole = opt.role?.toLowerCase();
    const suggestedRole = suggestion.role.toLowerCase();
    
    // Match role codes
    if (optRole === suggestedRole) return true;
    
    // Match role labels
    if (opt.roleLabel?.toLowerCase().includes(suggestedRole)) return true;
    
    // Special cases
    if (suggestedRole === 'admin' && (optRole === 'admin' || opt.roleLabel?.toLowerCase().includes('administrator'))) return true;
    if (suggestedRole === 'vp' && (optRole === 'vp' || opt.roleLabel?.toLowerCase().includes('vice president'))) return true;
    if (suggestedRole === 'president' && (optRole === 'president' || opt.roleLabel?.toLowerCase().includes('president'))) return true;
    if (suggestedRole === 'comptroller' && (optRole === 'comptroller' || opt.roleLabel?.toLowerCase().includes('comptroller'))) return true;
    if (suggestedRole === 'hr' && (optRole === 'hr' || opt.roleLabel?.toLowerCase().includes('hr'))) return true;
    
    return false;
  });

  if (matching.length === 0) return null;

  // For admin, prefer Ma'am TM (Trizzia Casino)
  if (suggestion.role === 'admin') {
    const maamTM = matching.find(opt => 
      opt.email?.toLowerCase().includes('trizzia') ||
      opt.email?.toLowerCase().includes('casino') ||
      opt.name?.toLowerCase().includes('trizzia') ||
      opt.name?.toLowerCase().includes('casino')
    );
    if (maamTM) {
      return { id: maamTM.id, name: maamTM.name || 'Ma\'am TM' };
    }
  }

  // Return first matching approver
  const first = matching[0];
  return { id: first.id, name: first.name || first.email || 'Unknown' };
}

