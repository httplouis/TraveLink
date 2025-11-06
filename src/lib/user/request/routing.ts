// src/lib/user/request/routing.ts
import type { RequesterRole, VehicleMode, Reason } from "./types";

export type FirstReceiver = "OSAS_ADMIN" | "DEPT_HEAD" | "TM" | "COMPTROLLER";

/** Force vehicle mode for specific reasons (policy). */
export function lockVehicle(reason: Reason): VehicleMode | null {
  return reason === "educational" || reason === "competition" ? "institutional" : null;
}

/**
 * Determine first receiver for a request.
 * Now also accepts department to enable department-specific routing.
 * If head is requesting for their own department, goes straight to admin (Comptroller/TM).
 */
export function firstReceiver({
  requesterRole,
  vehicleMode,
  department,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
  reason: Reason;
  department?: string; // Add department parameter
}): FirstReceiver {
  if (requesterRole === "org") return "OSAS_ADMIN";
  
  // HEAD requesting for own department → skip dept head approval, go to admin
  if (requesterRole === "head") {
    return vehicleMode === "institutional" ? "TM" : "COMPTROLLER";
  }
  
  // Faculty always goes to dept head first
  if (vehicleMode === "institutional") return "DEPT_HEAD";
  return "DEPT_HEAD";
}

/**
 * Extract department code from full department name.
 * E.g., "College of Nursing and Allied Health Sciences (CNAHS)" → "CNAHS"
 */
export function extractDepartmentCode(department: string): string {
  const match = department.match(/\(([^)]+)\)$/);
  return match ? match[1] : department;
}

/**
 * Get the full approval path for a request.
 * NOTE: For heads, their department head approval is automatically considered approved,
 * so they skip the DEPT_HEAD step and go straight to next approver.
 */
export function fullApprovalPath({
  requesterRole,
  vehicleMode,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
}): string[] {
  // Org requests
  if (requesterRole === "org") return ["OSAS_ADMIN", "TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
  
  // Head requests - skip DEPT_HEAD approval since they ARE the department head
  if (requesterRole === "head" && vehicleMode !== "institutional") 
    return ["COMPTROLLER", "HRD", "VP/COO"];
  if (requesterRole === "head" && vehicleMode === "institutional")
    return ["TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
  
  // Faculty requests - need department head approval
  if (requesterRole === "faculty" && vehicleMode !== "institutional")
    return ["DEPT_HEAD", "COMPTROLLER", "HRD", "VP/COO"];
  return ["DEPT_HEAD", "TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
}
