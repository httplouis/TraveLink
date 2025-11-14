// src/app/api/schedule/assign/route.ts
/**
 * POST /api/schedule/assign
 * Smart assignment of vehicle and driver to a request
 * Checks availability before assigning
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await request.json();

    const { requestId, vehicleId, driverId } = body;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Request ID required" }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (!profile.is_admin && profile.role !== 'admin')) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Get request details
    const { data: req, error: reqError } = await supabase
      .from("requests")
      .select("travel_start_date, travel_end_date, assigned_vehicle_id, assigned_driver_id")
      .eq("id", requestId)
      .single();

    if (reqError || !req) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    const startDate = new Date(req.travel_start_date);
    const endDate = new Date(req.travel_end_date);

    // Check vehicle availability if provided
    if (vehicleId) {
      const { data: vehicle, error: vehError } = await supabase
        .from("vehicles")
        .select("id, status, plate_number")
        .eq("id", vehicleId)
        .single();

      if (vehError || !vehicle) {
        return NextResponse.json({ ok: false, error: "Vehicle not found" }, { status: 404 });
      }

      if (vehicle.status !== 'available') {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is not available (status: ${vehicle.status})` 
        }, { status: 400 });
      }

      // Check if vehicle is already assigned during this period
      const { data: conflictingRequests } = await supabase
        .from("requests")
        .select("id")
        .eq("assigned_vehicle_id", vehicleId)
        .neq("id", requestId)
        .in("status", ["approved", "pending_admin", "pending_hr", "pending_exec"])
        .or(`travel_start_date.lte.${endDate.toISOString()},travel_end_date.gte.${startDate.toISOString()}`);

      if (conflictingRequests && conflictingRequests.length > 0) {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is already assigned during this period` 
        }, { status: 400 });
      }

      // Check coding days
      const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      const { data: codingDay } = await supabase
        .from("vehicle_coding_days")
        .select("coding_day")
        .eq("vehicle_id", vehicleId)
        .eq("coding_day", dayOfWeek)
        .single();

      if (codingDay) {
        return NextResponse.json({ 
          ok: false, 
          error: `Vehicle ${vehicle.plate_number} is on coding day (${dayOfWeek})` 
        }, { status: 400 });
      }
    }

    // Check driver availability if provided
    if (driverId) {
      // Check if driver is already assigned during this period
      const { data: conflictingRequests } = await supabase
        .from("requests")
        .select("id")
        .eq("assigned_driver_id", driverId)
        .neq("id", requestId)
        .in("status", ["approved", "pending_admin", "pending_hr", "pending_exec"])
        .or(`travel_start_date.lte.${endDate.toISOString()},travel_end_date.gte.${startDate.toISOString()}`);

      if (conflictingRequests && conflictingRequests.length > 0) {
        const { data: driver } = await supabase
          .from("users")
          .select("name")
          .eq("id", driverId)
          .single();

        return NextResponse.json({ 
          ok: false, 
          error: `Driver ${driver?.name || 'Unknown'} is already assigned during this period` 
        }, { status: 400 });
      }
    }

    // Update request
    const updateData: any = {};
    if (vehicleId) updateData.assigned_vehicle_id = vehicleId;
    if (driverId) updateData.assigned_driver_id = driverId;
    if (vehicleId === null) updateData.assigned_vehicle_id = null;
    if (driverId === null) updateData.assigned_driver_id = null;

    const { error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[/api/schedule/assign] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Assignment successful" });
  } catch (err: any) {
    console.error("[/api/schedule/assign] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

