// src/lib/admin/vehicles/mappers.ts
/**
 * Maps between Supabase vehicle schema and admin Vehicle type
 * Handles differences in column names and enum values
 */

import type { Vehicle, VehicleType, VehicleStatus } from "./types";

/**
 * Supabase vehicle row (from database)
 */
export interface SupabaseVehicle {
  id: string;
  vehicle_name: string;
  plate_number: string;
  type: string; // enum: van, bus, car (lowercase)
  capacity: number;
  status: string; // enum: available, in_use, maintenance (different from admin!)
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map Supabase type (lowercase) to admin VehicleType (capitalized)
 */
function mapType(supabaseType: string): VehicleType {
  const mapping: Record<string, VehicleType> = {
    'van': 'Van',
    'bus': 'Bus',
    'car': 'Car',
    'suv': 'SUV',
    'pickup': 'Car', // Map pickup to Car if it exists
    'motorcycle': 'Motorcycle',
  };
  return mapping[supabaseType.toLowerCase()] || 'Van';
}

/**
 * Map Supabase status to admin VehicleStatus
 */
function mapStatus(supabaseStatus: string): VehicleStatus {
  const mapping: Record<string, VehicleStatus> = {
    'available': 'active',
    'in_use': 'active',
    'maintenance': 'maintenance',
    'inactive': 'inactive',
    'retired': 'inactive',
  };
  return mapping[supabaseStatus.toLowerCase()] || 'active';
}

/**
 * Map admin type to Supabase type (for create/update)
 */
function mapTypeToSupabase(adminType: VehicleType): string {
  const mapping: Record<VehicleType, string> = {
    'Van': 'van',
    'Bus': 'bus',
    'Car': 'car',
    'SUV': 'car', // Map SUV to car since enum might not have suv
    'Motorcycle': 'van', // Map to van as fallback
  };
  return mapping[adminType] || 'van';
}

/**
 * Map admin status to Supabase status
 */
function mapStatusToSupabase(adminStatus: VehicleStatus): string {
  const mapping: Record<VehicleStatus, string> = {
    'active': 'available',
    'maintenance': 'maintenance',
    'inactive': 'inactive',
  };
  return mapping[adminStatus] || 'available';
}

/**
 * Transform Supabase vehicle to admin Vehicle type
 */
export function fromSupabase(supabaseVehicle: SupabaseVehicle): Vehicle {
  // Parse vehicle_name to extract brand/model if possible
  // Format could be: "L300 Van" or "Toyota Hiace"
  const nameParts = supabaseVehicle.vehicle_name.split(' ');
  const brand = nameParts[0] || 'Unknown';
  const model = nameParts.slice(1).join(' ') || 'Unknown';

  return {
    id: supabaseVehicle.id,
    plateNo: supabaseVehicle.plate_number,
    code: supabaseVehicle.plate_number, // Use plate number as code for now
    brand: brand,
    model: model,
    type: mapType(supabaseVehicle.type),
    capacity: supabaseVehicle.capacity,
    status: mapStatus(supabaseVehicle.status),
    odometerKm: 0, // Not in current schema
    lastServiceISO: new Date().toISOString(), // Placeholder
    notes: supabaseVehicle.notes || '',
    createdAt: supabaseVehicle.created_at,
    updatedAt: supabaseVehicle.updated_at,
  };
}

/**
 * Transform admin Vehicle to Supabase format (for create/update)
 */
export function toSupabase(vehicle: Partial<Vehicle>): Partial<SupabaseVehicle> {
  const result: Partial<SupabaseVehicle> = {};

  if (vehicle.brand && vehicle.model) {
    result.vehicle_name = `${vehicle.brand} ${vehicle.model}`.trim();
  }

  if (vehicle.plateNo) {
    result.plate_number = vehicle.plateNo;
  }

  if (vehicle.type) {
    result.type = mapTypeToSupabase(vehicle.type);
  }

  if (vehicle.capacity !== undefined) {
    result.capacity = vehicle.capacity;
  }

  if (vehicle.status) {
    result.status = mapStatusToSupabase(vehicle.status);
  }

  if (vehicle.notes !== undefined) {
    result.notes = vehicle.notes;
  }

  return result;
}

/**
 * Batch transform from Supabase
 */
export function fromSupabaseBatch(supabaseVehicles: SupabaseVehicle[]): Vehicle[] {
  return supabaseVehicles.map(fromSupabase);
}
