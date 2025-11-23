// src/lib/user/request/budget-proposal.ts
/**
 * Auto-propose budget when institutional vehicle is selected
 * This ensures that requests using institutional vehicles always have a proposed budget
 */

import type { TravelCosts } from "@/lib/user/request/types";

/**
 * Get the proposed budget for institutional vehicles
 * This provides default values that can be edited by the user
 */
export function getInstitutionalVehicleProposedBudget(): TravelCosts {
  return {
    food: 500, // Default food budget
    driversAllowance: 0, // No driver allowance needed for institutional vehicles (driver is provided)
    rentVehicles: 0, // No rental needed (using institutional vehicle)
    hiredDrivers: 0, // No hired drivers needed (driver is provided)
    accommodation: 0, // Accommodation is optional
    // Keep existing descriptions if any
    foodDescription: "Meals during travel",
    driversAllowanceDescription: "",
    rentVehiclesDescription: "",
    hiredDriversDescription: "",
    accommodationDescription: "",
    justification: "",
    otherItems: [],
    otherLabel: "",
    otherAmount: null,
  };
}

/**
 * Check if costs already have a budget (any non-zero amount)
 */
export function hasExistingBudget(costs?: TravelCosts): boolean {
  if (!costs) return false;
  
  const total = 
    (costs.food || 0) +
    (costs.driversAllowance || 0) +
    (costs.rentVehicles || 0) +
    (costs.hiredDrivers || 0) +
    (costs.accommodation || 0) +
    (costs.otherAmount || 0) +
    (Array.isArray(costs.otherItems) 
      ? costs.otherItems.reduce((sum, item) => sum + (item?.amount || 0), 0)
      : 0);
  
  return total > 0;
}

/**
 * Merge proposed budget with existing costs
 * Only sets defaults if no budget exists yet
 */
export function mergeProposedBudget(existingCosts?: TravelCosts): TravelCosts {
  // If there's already a budget, keep it
  if (hasExistingBudget(existingCosts)) {
    return existingCosts || {};
  }
  
  // Otherwise, propose default budget
  const proposed = getInstitutionalVehicleProposedBudget();
  
  // Merge with existing costs to preserve any descriptions or other fields
  return {
    ...proposed,
    ...existingCosts,
    // Override amounts with proposed defaults only if not set
    food: existingCosts?.food ?? proposed.food,
    driversAllowance: existingCosts?.driversAllowance ?? proposed.driversAllowance,
    rentVehicles: existingCosts?.rentVehicles ?? proposed.rentVehicles,
    hiredDrivers: existingCosts?.hiredDrivers ?? proposed.hiredDrivers,
    accommodation: existingCosts?.accommodation ?? proposed.accommodation,
  };
}

