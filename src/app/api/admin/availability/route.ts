// src/app/api/admin/availability/route.ts
/**
 * Admin API - Vehicle/Driver Availability Check
 * Returns availability status for vehicles and drivers for a given date range
 * Supports shared trip detection (same destination + overlapping dates)
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Auth check - only admin can access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const isAdmin = profile.is_admin || profile.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const destination = searchParams.get("destination");
    const excludeRequestId = searchParams.get("exclude_request_id"); // Exclude current request from conflict check
    
    if (!startDate || !endDate) {
      return NextResponse.json({ ok: false, error: "start_date and end_date are required" }, { status: 400 });
    }

    // Find all approved requests that overlap with the given date range
    // Overlap condition: request.start <= query.end AND request.end >= query.start
    let conflictQuery = supabase
      .from("requests")
      .select(`
        id,
        request_number,
        destination,
        travel_start_date,
        travel_end_date,
        assigned_driver_id,
        assigned_vehicle_id,
        status,
        requester_name
      `)
      .eq("status", "approved")
      .lte("travel_start_date", endDate)
      .gte("travel_end_date", startDate);
    
    // Exclude current request if provided
    if (excludeRequestId) {
      conflictQuery = conflictQuery.neq("id", excludeRequestId);
    }
    
    const { data: conflictingRequests, error: conflictError } = await conflictQuery;
    
    if (conflictError) {
      console.error("[GET /api/admin/availability] Conflict query error:", conflictError);
      return NextResponse.json({ ok: false, error: conflictError.message }, { status: 500 });
    }

    // Build availability maps
    const driverConflicts: Record<string, { requestId: string; requestNumber: string; destination: string; startDate: string; endDate: string; requesterName: string }[]> = {};
    const vehicleConflicts: Record<string, { requestId: string; requestNumber: string; destination: string; startDate: string; endDate: string; requesterName: string }[]> = {};
    
    // Track potential shared trips (same destination + overlapping dates)
    const sharedTripCandidates: Record<string, { requestId: string; requestNumber: string; destination: string; startDate: string; endDate: string; driverId?: string; vehicleId?: string; requesterName: string }[]> = {};
    
    for (const req of conflictingRequests || []) {
      const conflictInfo = {
        requestId: req.id,
        requestNumber: req.request_number || "N/A",
        destination: req.destination || "Unknown",
        startDate: req.travel_start_date,
        endDate: req.travel_end_date,
        requesterName: req.requester_name || "Unknown",
      };
      
      // Track driver conflicts
      if (req.assigned_driver_id) {
        if (!driverConflicts[req.assigned_driver_id]) {
          driverConflicts[req.assigned_driver_id] = [];
        }
        driverConflicts[req.assigned_driver_id].push(conflictInfo);
      }
      
      // Track vehicle conflicts
      if (req.assigned_vehicle_id) {
        if (!vehicleConflicts[req.assigned_vehicle_id]) {
          vehicleConflicts[req.assigned_vehicle_id] = [];
        }
        vehicleConflicts[req.assigned_vehicle_id].push(conflictInfo);
      }
      
      // Check for shared trip candidates (same destination)
      if (destination && req.destination) {
        const normalizedDest = destination.toLowerCase().trim();
        const reqDest = req.destination.toLowerCase().trim();
        
        // Check if destinations are similar (exact match or contains)
        if (normalizedDest === reqDest || normalizedDest.includes(reqDest) || reqDest.includes(normalizedDest)) {
          const key = `${reqDest}`;
          if (!sharedTripCandidates[key]) {
            sharedTripCandidates[key] = [];
          }
          sharedTripCandidates[key].push({
            ...conflictInfo,
            driverId: req.assigned_driver_id || undefined,
            vehicleId: req.assigned_vehicle_id || undefined,
          });
        }
      }
    }

    // Get all active drivers
    const { data: drivers, error: driversError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "driver")
      .eq("is_active", true);
    
    if (driversError) {
      console.error("[GET /api/admin/availability] Drivers query error:", driversError);
    }

    // Get all available vehicles (check coding day)
    const queryDate = new Date(startDate);
    const dayOfWeek = queryDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id, plate_number, vehicle_name, type, capacity, coding_day")
      .eq("status", "available");
    
    if (vehiclesError) {
      console.error("[GET /api/admin/availability] Vehicles query error:", vehiclesError);
    }

    // Build response with availability status
    const driversWithAvailability = (drivers || []).map(driver => {
      const conflicts = driverConflicts[driver.id] || [];
      const isAvailable = conflicts.length === 0;
      
      // Check if any conflict is a shared trip candidate
      const sharedTrips = conflicts.filter(c => {
        if (!destination) return false;
        const normalizedDest = destination.toLowerCase().trim();
        const conflictDest = c.destination.toLowerCase().trim();
        return normalizedDest === conflictDest || normalizedDest.includes(conflictDest) || conflictDest.includes(normalizedDest);
      });
      
      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        isAvailable,
        conflicts: conflicts.map(c => ({
          requestNumber: c.requestNumber,
          destination: c.destination,
          dates: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
          requesterName: c.requesterName,
        })),
        canShare: sharedTrips.length > 0,
        sharedTrips: sharedTrips.map(c => ({
          requestNumber: c.requestNumber,
          destination: c.destination,
          dates: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
          requesterName: c.requesterName,
        })),
      };
    });

    const vehiclesWithAvailability = (vehicles || []).map(vehicle => {
      const conflicts = vehicleConflicts[vehicle.id] || [];
      const isCodingDay = vehicle.coding_day?.toLowerCase() === dayOfWeek.toLowerCase();
      const isAvailable = conflicts.length === 0 && !isCodingDay;
      
      // Check if any conflict is a shared trip candidate
      const sharedTrips = conflicts.filter(c => {
        if (!destination) return false;
        const normalizedDest = destination.toLowerCase().trim();
        const conflictDest = c.destination.toLowerCase().trim();
        return normalizedDest === conflictDest || normalizedDest.includes(conflictDest) || conflictDest.includes(normalizedDest);
      });
      
      return {
        id: vehicle.id,
        label: `${vehicle.vehicle_name} (${vehicle.plate_number})`,
        plateNumber: vehicle.plate_number,
        vehicleName: vehicle.vehicle_name,
        type: vehicle.type,
        capacity: vehicle.capacity,
        isAvailable,
        isCodingDay,
        codingDay: vehicle.coding_day,
        conflicts: conflicts.map(c => ({
          requestNumber: c.requestNumber,
          destination: c.destination,
          dates: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
          requesterName: c.requesterName,
        })),
        canShare: sharedTrips.length > 0,
        sharedTrips: sharedTrips.map(c => ({
          requestNumber: c.requestNumber,
          destination: c.destination,
          dates: `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`,
          requesterName: c.requesterName,
        })),
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        drivers: driversWithAvailability,
        vehicles: vehiclesWithAvailability,
        queryDates: { startDate, endDate },
        queryDestination: destination,
        dayOfWeek,
      }
    });
  } catch (err: any) {
    console.error("[GET /api/admin/availability] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
