// src/lib/availability/check.ts
/**
 * Vehicle and Driver Availability Checking
 * Prevents double-booking by checking for overlapping date ranges
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AvailabilityCheckResult {
  available: boolean;
  conflicts: Array<{
    requestId: string;
    requestNumber: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  message?: string;
}

/**
 * Check if a vehicle is available for the given date range
 */
export async function checkVehicleAvailability(
  vehicleId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<AvailabilityCheckResult> {
  const supabase = await createSupabaseServerClient(true);
  
  // Convert dates to timestamps for comparison
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Find all requests that:
  // 1. Are assigned to this vehicle
  // 2. Have overlapping date ranges
  // 3. Are not rejected/cancelled
  // 4. Are not the current request (if editing)
  const { data: conflicts, error } = await supabase
    .from("requests")
    .select("id, request_number, travel_start_date, travel_end_date, status")
    .eq("assigned_vehicle_id", vehicleId)
    .not("status", "in", "(rejected,cancelled)")
    .lte("travel_start_date", endDate)
    .gte("travel_end_date", startDate)
    .order("travel_start_date", { ascending: true });
  
  if (error) {
    console.error("[Availability Check] Error checking vehicle:", error);
    return {
      available: true, // Assume available on error
      conflicts: [],
      message: "Error checking availability"
    };
  }
  
  // Filter out the current request if editing
  const relevantConflicts = (conflicts || []).filter(conflict => {
    if (excludeRequestId && conflict.id === excludeRequestId) {
      return false;
    }
    
    // Check if dates actually overlap
    const conflictStart = new Date(conflict.travel_start_date);
    const conflictEnd = new Date(conflict.travel_end_date);
    
    return (
      (start <= conflictEnd && end >= conflictStart) &&
      conflict.status !== "rejected" &&
      conflict.status !== "cancelled"
    );
  });
  
  return {
    available: relevantConflicts.length === 0,
    conflicts: relevantConflicts.map(c => ({
      requestId: c.id,
      requestNumber: c.request_number || "N/A",
      startDate: c.travel_start_date,
      endDate: c.travel_end_date,
      status: c.status
    })),
    message: relevantConflicts.length > 0
      ? `Vehicle is already assigned to ${relevantConflicts.length} other request(s) during this period`
      : undefined
  };
}

/**
 * Check if a driver is available for the given date range
 */
export async function checkDriverAvailability(
  driverId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<AvailabilityCheckResult> {
  const supabase = await createSupabaseServerClient(true);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Find all requests that:
  // 1. Are assigned to this driver
  // 2. Have overlapping date ranges
  // 3. Are not rejected/cancelled
  // 4. Are not the current request (if editing)
  const { data: conflicts, error } = await supabase
    .from("requests")
    .select("id, request_number, travel_start_date, travel_end_date, status")
    .eq("assigned_driver_id", driverId)
    .not("status", "in", "(rejected,cancelled)")
    .lte("travel_start_date", endDate)
    .gte("travel_end_date", startDate)
    .order("travel_start_date", { ascending: true });
  
  if (error) {
    console.error("[Availability Check] Error checking driver:", error);
    return {
      available: true, // Assume available on error
      conflicts: [],
      message: "Error checking availability"
    };
  }
  
  // Filter out the current request if editing
  const relevantConflicts = (conflicts || []).filter(conflict => {
    if (excludeRequestId && conflict.id === excludeRequestId) {
      return false;
    }
    
    // Check if dates actually overlap
    const conflictStart = new Date(conflict.travel_start_date);
    const conflictEnd = new Date(conflict.travel_end_date);
    
    return (
      (start <= conflictEnd && end >= conflictStart) &&
      conflict.status !== "rejected" &&
      conflict.status !== "cancelled"
    );
  });
  
  return {
    available: relevantConflicts.length === 0,
    conflicts: relevantConflicts.map(c => ({
      requestId: c.id,
      requestNumber: c.request_number || "N/A",
      startDate: c.travel_start_date,
      endDate: c.travel_end_date,
      status: c.status
    })),
    message: relevantConflicts.length > 0
      ? `Driver is already assigned to ${relevantConflicts.length} other request(s) during this period`
      : undefined
  };
}

/**
 * Check both vehicle and driver availability
 */
export async function checkBothAvailability(
  vehicleId: string | null,
  driverId: string | null,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<{
  vehicle: AvailabilityCheckResult;
  driver: AvailabilityCheckResult;
  bothAvailable: boolean;
}> {
  const [vehicle, driver] = await Promise.all([
    vehicleId
      ? checkVehicleAvailability(vehicleId, startDate, endDate, excludeRequestId)
      : Promise.resolve({ available: true, conflicts: [] }),
    driverId
      ? checkDriverAvailability(driverId, startDate, endDate, excludeRequestId)
      : Promise.resolve({ available: true, conflicts: [] })
  ]);
  
  return {
    vehicle,
    driver,
    bothAvailable: vehicle.available && driver.available
  };
}

