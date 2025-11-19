// Travelink Workflow Types

export type RequestType = 'travel_order' | 'seminar';

export type RequestStatus =
  | 'draft'
  | 'pending_head'
  | 'pending_parent_head'  // NEW: For parent department head approval (e.g., WCDEO → CCMS)
  | 'pending_admin'
  | 'pending_comptroller'
  | 'pending_hr'
  | 'pending_exec'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type ApproverRole = 'head' | 'admin' | 'comptroller' | 'hr' | 'exec';

export interface ExpenseItem {
  item: string;
  amount: number;
  description?: string;
}

export interface Participant {
  user_id: string;
  name: string;
  role?: string;
}

export interface Request {
  id: string;
  request_type: RequestType;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  
  // Dates
  travel_start_date: string;
  travel_end_date: string;
  created_at: string;
  updated_at: string;
  
  // Requester (person who needs the travel)
  requester_id: string;
  requester_name?: string;
  requester_is_head: boolean;
  department_id: string;
  
  // Submitter (account that clicked submit - may be different)
  submitted_by_user_id?: string;
  submitted_by_name?: string;
  is_representative: boolean;
  
  // Participants
  participants: Participant[];
  head_included: boolean;
  
  // Budget
  has_budget: boolean;
  total_budget: number;
  expense_breakdown: ExpenseItem[];
  
  // Vehicle
  needs_vehicle: boolean;
  vehicle_type?: string;
  needs_rental: boolean;
  rental_note?: string;
  
  // Preferred/Suggested (Faculty suggestion - optional)
  preferred_driver_id?: string;
  preferred_vehicle_id?: string;
  preferred_driver_note?: string;
  preferred_vehicle_note?: string;
  
  // Final Assignment (Admin decision)
  assigned_vehicle_id?: string;
  assigned_driver_id?: string;
  
  // Status
  status: RequestStatus;
  current_approver_role?: ApproverRole;
  
  // Approvals
  head_approved_at?: string;
  head_approved_by?: string;
  head_signature?: string;
  head_comments?: string;
  
  parent_head_approved_at?: string;  // NEW: For parent department head
  parent_head_approved_by?: string;
  parent_head_signature?: string;
  parent_head_comments?: string;
  
  admin_processed_at?: string;
  admin_processed_by?: string;
  admin_comments?: string;
  
  comptroller_approved_at?: string;
  comptroller_approved_by?: string;
  comptroller_comments?: string;
  comptroller_edited_budget?: number;
  
  hr_approved_at?: string;
  hr_approved_by?: string;
  hr_signature?: string;
  hr_comments?: string;
  
  exec_approved_at?: string;
  exec_approved_by?: string;
  exec_signature?: string;
  exec_comments?: string;
  
  final_approved_at?: string;
  
  // Rejection
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  rejection_stage?: string;
  
  // Meta
  representative_note?: string;
}

export interface DepartmentBudget {
  id: string;
  department_id: string;
  fiscal_year: number;
  total_allocated: number;
  total_used: number;
  total_pending: number;
  remaining: number;
}

export interface RequestHistory {
  id: string;
  request_id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  previous_status: RequestStatus;
  new_status: RequestStatus;
  comments?: string;
  metadata?: any;
  created_at: string;
}

export interface DailyVehicleLimit {
  request_date: string;
  vehicle_request_count: number; // Only counts requests with needs_vehicle = true
  max_vehicle_requests: number; // Default 5 per day
}
