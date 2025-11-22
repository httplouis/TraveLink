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
  hasBudget = false,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
  reason: Reason;
  department?: string;
  hasBudget?: boolean; // Add budget parameter
}): FirstReceiver {
  // HEAD requesting for own department → skip dept head approval, go to Admin (TM) first
  if (requesterRole === "head") {
    return "TM"; // All head requests go to Admin (TM) first
  }
  
  // Faculty always goes to dept head first, then Admin (TM)
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
 * SMART ROUTING LOGIC:
 * - Skip Comptroller if no budget
 * - Skip TM if no vehicle needed (unless institutional)
 * - Heads (Deans/Directors) go to President, not just VP
 * - Faculty/Staff stop at VP
 */
export function fullApprovalPath({
  requesterRole,
  vehicleMode,
  hasBudget = false,
  needsVehicle = false,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
  hasBudget?: boolean;
  needsVehicle?: boolean;
}): string[] {
  const path: string[] = [];
  const isHead = requesterRole === "head";
  const isInstitutional = vehicleMode === "institutional";
  const isRent = vehicleMode === "rent";
  const needsVeh = needsVehicle || isInstitutional || isRent;

  // ALL requests go through Admin (TM) first for notes/processing
  // Then Admin routes to Comptroller (if budget) or HRD (if no budget)
  
  // Head requests - skip DEPT_HEAD approval since they ARE the department head
  if (isHead) {
    // Head requests always go to President/COO (not just VP)
    path.push("TM"); // Admin always processes first
    if (hasBudget) path.push("COMPTROLLER");
    path.push("HRD");
    path.push("VP");
    path.push("PRESIDENT/COO"); // Heads go to President/COO
    path.push("TM(close-out)"); // Transportation Manager close-out always shown
    return path;
  }
  
  // Faculty requests - need department head approval
  // Faculty/Staff stop at VP (not President/COO)
  if (requesterRole === "faculty") {
    path.push("DEPT_HEAD");
    path.push("TM"); // Transportation Manager (Admin) always processes after Dept Head
    if (hasBudget) path.push("COMPTROLLER");
    path.push("HRD");
    path.push("VP");
    path.push("TM(close-out)"); // Transportation Manager close-out always shown
    return path;
  }
  
  // Default fallback
  return path;
}

/**
 * Get full display name for approver role
 */
export function getApproverDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    "OSAS_ADMIN": "OSAS Admin",
    "DEPT_HEAD": "Department Head",
    "TM": "Transportation Manager (Admin)",
    "ADMIN": "Admin",
    "COMPTROLLER": "Comptroller",
    "HRD": "Human Resources Department",
    "HR": "Human Resources Department",
    "VP": "Vice President",
    "PRESIDENT/COO": "President / COO",
    "PRESIDENT": "President",
    "COO": "Chief Operating Officer",
    "TM(close-out)": "Transportation Manager",
  };
  
  return displayNames[role] || role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
