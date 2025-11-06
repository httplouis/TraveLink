// src/lib/admin/requests/api.ts
/**
 * API Service Layer for Admin Requests
 * Replaces localStorage with database calls
 */

import type { AdminRequest, AdminRequestStatus } from "./store";

/**
 * Fetch all requests with optional filters
 */
export async function fetchRequests(filters?: {
  status?: string;
  role?: string;
  department_id?: string;
}): Promise<AdminRequest[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.role) params.set("role", filters.role);
    if (filters?.department_id) params.set("department_id", filters.department_id);

    const url = `/api/requests/list${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Transform database format to AdminRequest format
    return (data || []).map((req: any) => transformToAdminRequest(req));
  } catch (error) {
    console.error("[Admin Requests API] Error fetching requests:", error);
    return [];
  }
}

/**
 * Fetch single request by ID
 */
export async function fetchRequest(id: string): Promise<AdminRequest | null> {
  try {
    const response = await fetch(`/api/requests/list`);
    const data = await response.json();
    const req = (data || []).find((r: any) => r.id === id);
    return req ? transformToAdminRequest(req) : null;
  } catch (error) {
    console.error("[Admin Requests API] Error fetching request:", error);
    return null;
  }
}

/**
 * Update request (assign driver, vehicle, notes, etc.)
 */
export async function updateRequest(id: string, updates: Partial<AdminRequest>): Promise<boolean> {
  try {
    // For now, just log - we'll implement the PATCH endpoint if needed
    console.log("[Admin Requests API] Update request:", id, updates);
    // TODO: Implement PATCH /api/requests/[id] endpoint
    return true;
  } catch (error) {
    console.error("[Admin Requests API] Error updating request:", error);
    return false;
  }
}

/**
 * Approve request
 */
export async function approveRequest(id: string, data: {
  signature?: string;
  approvedBy?: string;
  comments?: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`/api/requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("[Admin Requests API] Error approving request:", error);
    return false;
  }
}

/**
 * Reject request
 */
export async function rejectRequest(id: string, data: {
  reason?: string;
  rejectedBy?: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`/api/requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("[Admin Requests API] Error rejecting request:", error);
    return false;
  }
}

/**
 * Transform database request to AdminRequest format
 */
function transformToAdminRequest(dbReq: any): AdminRequest {
  return {
    id: dbReq.id,
    createdAt: dbReq.created_at,
    updatedAt: dbReq.updated_at || dbReq.created_at,
    status: mapStatus(dbReq.status),
    
    // Department and requester info
    department: dbReq.department?.name,
    departmentCode: dbReq.department?.code,
    requesterName: dbReq.requester?.name || dbReq.requester_name,
    requesterEmail: dbReq.requester?.email,
    requestNumber: dbReq.request_number,
    
    // Assignments
    driver: dbReq.assigned_driver_id, // TODO: Map to driver name
    vehicle: dbReq.assigned_vehicle_id, // TODO: Map to vehicle name
    
    // Form data (reconstruct from database fields)
    travelOrder: {
      requestingPerson: dbReq.requester_name,
      department: dbReq.department?.name,
      date: dbReq.travel_start_date,
      destination: dbReq.destination,
      purposeOfTravel: dbReq.purpose,
      participants: dbReq.participants || [],
      costs: reconstructCosts(dbReq),
      requesterSignature: dbReq.requester_signature,
    } as any,
    
    payload: {
      reason: dbReq.request_type === "seminar" ? "seminar" : "official",
      vehicleMode: dbReq.needs_rental ? "rent" : dbReq.needs_vehicle ? "institutional" : "owned",
      requesterRole: dbReq.requester_is_head ? "head" : "faculty",
      travelOrder: {
        requestingPerson: dbReq.requester_name,
        department: dbReq.department?.name,
        date: dbReq.travel_start_date,
        destination: dbReq.destination,
        purposeOfTravel: dbReq.purpose,
        participants: dbReq.participants || [],
        costs: reconstructCosts(dbReq),
        requesterSignature: dbReq.requester_signature,
      },
    } as any,
    
    // Approval signatures
    approverSignature: dbReq.admin_signature,
    approvedAt: dbReq.admin_processed_at,
    approvedBy: dbReq.admin_processed_by,
    
    comptrollerSignature: null, // TODO: Add to schema if needed
    comptrollerAt: dbReq.comptroller_approved_at,
    comptrollerBy: dbReq.comptroller_approved_by,
    
    hrSignature: dbReq.hr_signature,
    hrAt: dbReq.hr_approved_at,
    hrBy: dbReq.hr_approved_by,
    
    executiveSignature: dbReq.exec_signature,
    executiveAt: dbReq.exec_approved_at,
    executiveBy: dbReq.exec_approved_by,
    
    // Notes
    tmNote: dbReq.admin_comments,
  };
}

/**
 * Map database status to AdminRequestStatus
 */
function mapStatus(dbStatus: string): AdminRequestStatus {
  // Map database status to admin status
  const statusMap: Record<string, AdminRequestStatus> = {
    "draft": "pending",
    "pending_head": "pending_head",
    "pending_parent_head": "pending_head",
    "pending_admin": "pending_admin",
    "pending_comptroller": "comptroller_pending",
    "pending_hr": "hr_pending",
    "pending_exec": "executive_pending",
    "approved": "approved",
    "rejected": "rejected",
    "completed": "completed",
    "cancelled": "cancelled",
  };
  
  return statusMap[dbStatus] || "pending";
}

/**
 * Reconstruct costs from expense_breakdown
 */
function reconstructCosts(dbReq: any): any {
  if (!dbReq.expense_breakdown || !Array.isArray(dbReq.expense_breakdown)) {
    return {};
  }
  
  const costs: any = {
    food: 0,
    accommodation: 0,
    rentVehicles: 0,
    driversAllowance: 0,
    otherAmount: 0,
    otherLabel: "",
  };
  
  dbReq.expense_breakdown.forEach((item: any) => {
    const itemName = (item.item || "").toLowerCase();
    if (itemName.includes("food") || itemName.includes("meal")) {
      costs.food = item.amount || 0;
    } else if (itemName.includes("accommodation") || itemName.includes("lodg")) {
      costs.accommodation = item.amount || 0;
    } else if (itemName.includes("transport") || itemName.includes("vehicle")) {
      costs.rentVehicles = item.amount || 0;
    } else if (itemName.includes("driver") || itemName.includes("allowance")) {
      costs.driversAllowance = item.amount || 0;
    } else {
      costs.otherAmount = item.amount || 0;
      costs.otherLabel = item.item;
    }
  });
  
  return costs;
}
