// src/lib/user/request/status.ts

import type { RequestFormData, VehicleMode } from "@/lib/user/request/types";
import type { AdminRequestStatus } from "@/lib/admin/requests/store";

// For safety kung iba-iba pangalan ng costs sa form
type TravelCosts = NonNullable<RequestFormData["travelOrder"]>["costs"];

function sumNumber(n: unknown): number {
  if (typeof n === "number" && isFinite(n)) return n;
  if (typeof n === "string" && n.trim() !== "") {
    const f = Number(n);
    if (!isNaN(f)) return f;
  }
  return 0;
}

export function computeTotalBudget(costs?: TravelCosts): number {
  if (!costs) return 0;
  const base =
    sumNumber((costs as any).food) +
    sumNumber((costs as any).driversAllowance) +
    sumNumber((costs as any).rentVehicles) +
    sumNumber((costs as any).hiredDrivers) +
    sumNumber((costs as any).accommodation);

  const singleOther =
    (costs as any).otherLabel ? sumNumber((costs as any).otherAmount) : 0;

  const arr = Array.isArray((costs as any).otherItems)
    ? (costs as any).otherItems.reduce((sum: number, it: any) => {
        return sum + sumNumber(it?.amount);
      }, 0)
    : 0;

  return base + singleOther + arr;
}

export function hasBudget(costs?: TravelCosts): boolean {
  return computeTotalBudget(costs) > 0;
}

// ✅ fixed version
export function needsVehicleCheck(
  vehicleMode?: VehicleMode | "none"
): boolean {
  if (!vehicleMode) return false;
  // "none" = walang vehicle
  if (vehicleMode === "none") return false;
  return true;
}

// --- MAIN ENTRY ---
// Ito yung tatawagin kapag nag-SUBMIT yung user.
export function computeInitialStatusFromRequest(opts: {
  isHeadRequester: boolean;
  costs?: TravelCosts;
  vehicleMode?: VehicleMode | "none";
}): AdminRequestStatus {
  const budget = hasBudget(opts.costs);
  const needsVeh = needsVehicleCheck(opts.vehicleMode);

  // CASE 1: HEAD ang nag-request → skip pending_head
  if (opts.isHeadRequester) {
    // head -> admin agad (Ma’am TM)
    return "admin_received";
  }

  // CASE 2: faculty → laging dadaan sa head
  return "pending_head";
}

// --- ADMIN ROUTING ---
export function decideNextAfterAdmin(opts: {
  costs?: TravelCosts;
  vehicleMode?: VehicleMode | "none";
}): AdminRequestStatus {
  const budget = hasBudget(opts.costs);
  const needsVeh = needsVehicleCheck(opts.vehicleMode);
  if (budget || needsVeh) {
    return "comptroller_pending";
  }
  return "hr_pending";
}

// --- For UI / display ---
export const STATE_LABELS: Record<AdminRequestStatus, string> = {
  pending: "Pending",
  pending_head: "Pending Dept. Head",
  head_approved: "Endorsed by Head",
  head_rejected: "Declined by Head",
  admin_received: "For Admin (Ma’am TM)",
  comptroller_pending: "For Comptroller",
  hr_pending: "For HR",
  executive_pending: "For Executive",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};
