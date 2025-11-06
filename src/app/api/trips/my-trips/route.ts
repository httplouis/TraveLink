// src/app/api/trips/my-trips/route.ts
/**
 * GET /api/trips/my-trips
 * Fetch current user's trips/bookings from database
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Fetch trips where user is either requester or participant
    // Join with requests to get trip details
    const { data: trips, error } = await supabase
      .from("requests")
      .select(`
        id,
        title,
        purpose,
        destination,
        travel_start_date,
        travel_end_date,
        status,
        assigned_vehicle_id,
        assigned_driver_id,
        department:departments(name),
        vehicle:vehicles(vehicle_name, plate_number, type),
        driver:users!assigned_driver_id(name)
      `)
      .eq("requester_id", profile.id)
      .in("status", ["approved", "pending_admin", "pending_exec", "pending_hr"])
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[/api/trips/my-trips] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Transform to booking format
    const bookings = (trips || []).map((trip: any) => ({
      id: trip.id,
      dateISO: trip.travel_start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: new Date(trip.travel_start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      destination: trip.destination || "",
      purpose: trip.purpose || trip.title || "",
      department: trip.department?.name || "",
      vehicle: trip.vehicle?.type || "Van",
      vehicleName: trip.vehicle ? `${trip.vehicle.vehicle_name} (${trip.vehicle.plate_number})` : "",
      driver: trip.driver?.name || "TBD",
      status: trip.status,
    }));

    return NextResponse.json({ ok: true, data: bookings });
  } catch (err: any) {
    console.error("[/api/trips/my-trips] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
