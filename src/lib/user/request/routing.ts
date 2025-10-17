// src/lib/user/request/routing.ts
import type { RequesterRole, VehicleMode, Reason } from "./types";

export type FirstReceiver = "OSAS_ADMIN" | "DEPT_HEAD" | "TM" | "COMPTROLLER";

/** Force vehicle mode for specific reasons (policy). */
export function lockVehicle(reason: Reason): VehicleMode | null {
  return reason === "educational" || reason === "competition" ? "institutional" : null;
}

export function firstReceiver({
  requesterRole,
  vehicleMode,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
  reason: Reason;
}): FirstReceiver {
  if (requesterRole === "org") return "OSAS_ADMIN";
  if (vehicleMode === "institutional") return requesterRole === "faculty" ? "DEPT_HEAD" : "TM";
  return requesterRole === "faculty" ? "DEPT_HEAD" : "COMPTROLLER";
}

export function fullApprovalPath({
  requesterRole,
  vehicleMode,
}: {
  requesterRole: RequesterRole;
  vehicleMode: VehicleMode;
}): string[] {
  if (requesterRole === "org") return ["OSAS_ADMIN", "TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
  if (requesterRole === "head" && vehicleMode !== "institutional") return ["COMPTROLLER", "HRD", "VP/COO"];
  if (requesterRole === "head" && vehicleMode === "institutional")
    return ["TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
  if (requesterRole === "faculty" && vehicleMode !== "institutional")
    return ["DEPT_HEAD", "COMPTROLLER", "HRD", "VP/COO"];
  return ["DEPT_HEAD", "TM", "COMPTROLLER", "HRD", "VP/COO", "TM(close-out)"];
}
